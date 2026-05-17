import { Request, Response } from 'express';
import pool from '../db/client';
import { AuthRequest } from '../types';
import { generateQRCode } from '../services/qrService';
import { calculateFees } from '../services/feeService';
import { buildPaymentPayload, initiatePayment, verifyTransaction, verifyWebhookSignature } from '../services/flutterwaveService';
import { v4 as uuidv4 } from 'uuid';

// ─── Initiate ticket purchase ─────────────────────────────────────────────────
export const initiateTicketPurchase = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { event_id, category_id, quantity = 1 } = req.body as {
      event_id?: number;
      category_id?: number;
      quantity?: number;
    };

    if (!event_id || !category_id) {
      res.status(400).json({ error: 'event_id and category_id are required' });
      return;
    }

    // Check event exists and is published
    const eventResult = await pool.query(
      "SELECT * FROM events WHERE id=$1 AND status='published'",
      [event_id]
    );
    if (!eventResult.rows[0]) {
      res.status(404).json({ error: 'Event not found or not available' });
      return;
    }
    const event = eventResult.rows[0];

    // Check category and availability
    const catResult = await pool.query(
      'SELECT * FROM ticket_categories WHERE id=$1 AND event_id=$2',
      [category_id, event_id]
    );
    if (!catResult.rows[0]) {
      res.status(404).json({ error: 'Ticket category not found' });
      return;
    }
    const category = catResult.rows[0];

    const available = category.quantity - category.sold;
    if (available < quantity) {
      res.status(400).json({ error: `Only ${available} tickets remaining in this category` });
      return;
    }

    // Get user details
    const userResult = await pool.query('SELECT * FROM users WHERE id=$1', [req.user!.userId]);
    const user = userResult.rows[0];

    // Calculate fees
    const fees = calculateFees(Number(category.price) * quantity, 'SLL');
    const txRef = `BEATIX-${uuidv4().replace(/-/g, '').toUpperCase().slice(0, 16)}`;

    const frontendUrl = process.env.FRONTEND_URL || 'https://beatix.vercel.app';

    const payload = buildPaymentPayload({
      amount: fees.total,
      currency: 'SLL',
      email: user.email,
      fullName: user.full_name ?? user.email,
      phone: user.phone ?? undefined,
      txRef,
      redirectUrl: `${frontendUrl}/payment/callback?tx_ref=${txRef}`,
      eventTitle: event.title,
    });

    // Create a pending payment record
    await pool.query(
      `INSERT INTO payments (user_id, flutterwave_ref, amount, currency, status, created_at)
       VALUES ($1,$2,$3,'SLL','pending',NOW())`,
      [req.user!.userId, txRef, fees.total]
    );

    const flwResponse = await initiatePayment(payload);

    res.json({
      paymentLink: flwResponse.data?.link,
      tx_ref: txRef,
      fees,
    });
  } catch (err) {
    console.error('[initiateTicketPurchase]', err);
    res.status(500).json({ error: 'Failed to initiate payment' });
  }
};

// ─── Verify payment and issue tickets ────────────────────────────────────────
export const verifyPaymentAndIssueTickets = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { transaction_id, tx_ref, event_id, category_id, quantity = 1 } = req.body as {
      transaction_id?: string;
      tx_ref?: string;
      event_id?: number;
      category_id?: number;
      quantity?: number;
    };

    if (!transaction_id) {
      res.status(400).json({ error: 'transaction_id is required' });
      return;
    }

    const verification = await verifyTransaction(transaction_id);

    if (verification.data.status !== 'successful') {
      res.status(400).json({ error: 'Payment was not successful' });
      return;
    }

    // Check for duplicate processing
    const existing = await pool.query(
      "SELECT id FROM tickets WHERE payment_ref=$1 LIMIT 1",
      [transaction_id]
    );
    if (existing.rows.length > 0) {
      res.json({ message: 'Tickets already issued for this payment' });
      return;
    }

    const catResult = await pool.query('SELECT * FROM ticket_categories WHERE id=$1', [category_id]);
    const category = catResult.rows[0];

    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    const client = await pool.connect();
    const issuedTickets = [];

    try {
      await client.query('BEGIN');

      for (let i = 0; i < (quantity ?? 1); i++) {
        const qr = generateQRCode();
        const ticketResult = await client.query(
          `INSERT INTO tickets (user_id, event_id, category_id, qr_code, status, payment_ref, amount_paid, purchased_at)
           VALUES ($1,$2,$3,$4,'active',$5,$6,NOW()) RETURNING *`,
          [req.user!.userId, event_id, category_id, qr, transaction_id, verification.data.charged_amount / (quantity ?? 1)]
        );
        issuedTickets.push(ticketResult.rows[0]);
      }

      await client.query(
        'UPDATE ticket_categories SET sold = sold + $1 WHERE id = $2',
        [quantity ?? 1, category_id]
      );

      await client.query(
        "UPDATE payments SET status='successful', ticket_id=$1 WHERE flutterwave_ref=$2",
        [issuedTickets[0]?.id ?? null, tx_ref]
      );

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    res.json({ tickets: issuedTickets });
  } catch (err) {
    console.error('[verifyPaymentAndIssueTickets]', err);
    res.status(500).json({ error: 'Failed to verify payment and issue tickets' });
  }
};

// ─── Flutterwave webhook ──────────────────────────────────────────────────────
export const handleWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const signature = req.headers['verif-hash'] as string | undefined;

    if (!verifyWebhookSignature(signature)) {
      res.status(401).json({ error: 'Invalid webhook signature' });
      return;
    }

    const { data } = req.body as { data?: { status?: string; tx_ref?: string; id?: number } };

    if (data?.status === 'successful' && data.tx_ref) {
      await pool.query(
        "UPDATE payments SET status='successful' WHERE flutterwave_ref=$1 AND status='pending'",
        [data.tx_ref]
      );
    }

    res.json({ received: true });
  } catch (err) {
    console.error('[handleWebhook]', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

// ─── Get single ticket (for QR display) ──────────────────────────────────────
export const getTicket = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT t.*, e.title AS event_title, e.event_date, e.location AS event_location,
              e.sales_end_date, tc.name AS category_name, tc.price
       FROM tickets t
       JOIN events e ON e.id = t.event_id
       JOIN ticket_categories tc ON tc.id = t.category_id
       WHERE t.id=$1 AND t.user_id=$2`,
      [id, req.user!.userId]
    );

    if (!result.rows[0]) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }

    res.json({ ticket: result.rows[0] });
  } catch (err) {
    console.error('[getTicket]', err);
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
};

// ─── Verify ticket by QR code (organizer/admin) ───────────────────────────────
export const verifyTicketQR = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { qr_code } = req.body as { qr_code?: string };

    if (!qr_code) {
      res.status(400).json({ error: 'qr_code is required' });
      return;
    }

    const result = await pool.query(
      `SELECT t.*, e.title AS event_title, u.full_name AS holder_name
       FROM tickets t
       JOIN events e ON e.id = t.event_id
       JOIN users u ON u.id = t.user_id
       WHERE t.qr_code=$1`,
      [qr_code]
    );

    if (!result.rows[0]) {
      res.status(404).json({ valid: false, error: 'Ticket not found' });
      return;
    }

    const ticket = result.rows[0];

    if (ticket.status === 'used') {
      res.json({ valid: false, ticket, error: 'Ticket has already been used' });
      return;
    }

    if (ticket.status === 'refunded') {
      res.json({ valid: false, ticket, error: 'Ticket has been refunded' });
      return;
    }

    // Mark as used
    await pool.query("UPDATE tickets SET status='used' WHERE id=$1", [ticket.id]);
    ticket.status = 'used';

    res.json({ valid: true, ticket });
  } catch (err) {
    console.error('[verifyTicketQR]', err);
    res.status(500).json({ error: 'Failed to verify ticket' });
  }
};
