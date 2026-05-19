import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool, { query } from '../db/client';
import { AuthRequest, TicketRow, CategoryRow, EventRow, UserRow } from '../types/index';
import { calculateFees } from '../services/feeService';
import { generateQRCode } from '../services/qrService';
import { initiatePayment, verifyTransaction, checkWebhookSignature } from '../services/flutterwaveService';

// ─── Initiate purchase ────────────────────────────────────────────────────────
export async function purchaseTicket(req: AuthRequest, res: Response): Promise<void> {
  const { event_id, category_id, quantity = 1 } =
    req.body as { event_id?: number; category_id?: number; quantity?: number };
  if (!event_id || !category_id) {
    res.status(400).json({ error: 'event_id and category_id are required' }); return;
  }
  try {
    const evR = await query<EventRow>("SELECT * FROM events WHERE id=$1 AND status='published'", [event_id]);
    if (!evR.rows[0]) { res.status(404).json({ error: 'Event not available' }); return; }

    const catR = await query<CategoryRow>('SELECT * FROM ticket_categories WHERE id=$1 AND event_id=$2', [category_id, event_id]);
    const cat = catR.rows[0];
    if (!cat) { res.status(404).json({ error: 'Category not found' }); return; }

    const available = cat.quantity - cat.sold;
    if (available < quantity) { res.status(400).json({ error: `Only ${available} tickets left` }); return; }

    const userR = await query<UserRow>('SELECT * FROM users WHERE id=$1', [req.user!.userId]);
    const user = userR.rows[0];

    const fees = await calculateFees(parseFloat(cat.price) * quantity);
    const txRef = `BX-${uuidv4().replace(/-/g, '').toUpperCase().slice(0, 14)}`;
    const frontendUrl = process.env.FRONTEND_URL ?? 'https://beatix.vercel.app';

    await query(
      `INSERT INTO payments (user_id,flutterwave_ref,amount,currency,status,created_at)
       VALUES ($1,$2,$3,$4,'pending',NOW())`,
      [req.user!.userId, txRef, fees.total, fees.currency]
    );

    const flw = await initiatePayment({
      tx_ref: txRef,
      amount: fees.total,
      currency: fees.currency,
      redirect_url: `${frontendUrl}/payment/callback?tx_ref=${txRef}`,
      payment_options: 'card,mobilemoney',
      customer: { email: user.email, phonenumber: user.phone ?? undefined, name: user.full_name ?? undefined },
      customizations: { title: 'Beatix', description: `Ticket for ${evR.rows[0].title}`, logo: `${frontendUrl}/logo.png` },
      meta: { event_id, category_id, quantity, user_id: req.user!.userId },
    });

    res.json({ paymentLink: flw.link, tx_ref: txRef, fees });
  } catch (err) {
    console.error('[purchaseTicket]', err);
    res.status(500).json({ error: 'Failed to initiate purchase' });
  }
}

// ─── Verify payment + issue tickets ──────────────────────────────────────────
export async function confirmPayment(req: AuthRequest, res: Response): Promise<void> {
  const { transaction_id, tx_ref, event_id, category_id, quantity = 1 } =
    req.body as { transaction_id?: string; tx_ref?: string; event_id?: number; category_id?: number; quantity?: number };
  if (!transaction_id) { res.status(400).json({ error: 'transaction_id required' }); return; }

  try {
    const flw = await verifyTransaction(transaction_id);
    if (flw.data.status !== 'successful') {
      res.status(400).json({ error: 'Payment not successful' }); return;
    }
    // Idempotency check
    const dup = await query('SELECT id FROM tickets WHERE payment_ref=$1 LIMIT 1', [transaction_id]);
    if (dup.rows.length) { res.json({ message: 'Tickets already issued' }); return; }

    const client = await pool.connect();
    const issued: TicketRow[] = [];
    try {
      await client.query('BEGIN');
      for (let i = 0; i < quantity; i++) {
        const t = await client.query<TicketRow>(
          `INSERT INTO tickets (user_id,event_id,category_id,qr_code,status,payment_ref,amount_paid,purchased_at)
           VALUES ($1,$2,$3,$4,'active',$5,$6,NOW()) RETURNING *`,
          [req.user!.userId, event_id, category_id, generateQRCode(), transaction_id,
           (flw.data.charged_amount / quantity).toFixed(2)]
        );
        issued.push(t.rows[0]);
      }
      await client.query('UPDATE ticket_categories SET sold=sold+$1 WHERE id=$2', [quantity, category_id]);
      await client.query(
        "UPDATE payments SET status='successful', ticket_id=$1 WHERE flutterwave_ref=$2",
        [issued[0]?.id ?? null, tx_ref]
      );
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK'); throw e;
    } finally {
      client.release();
    }
    res.json({ tickets: issued });
  } catch (err) {
    console.error('[confirmPayment]', err);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
}

// ─── Flutterwave webhook ──────────────────────────────────────────────────────
export async function webhook(req: Request, res: Response): Promise<void> {
  const sig = req.headers['verif-hash'] as string | undefined;
  if (!checkWebhookSignature(sig)) { res.status(401).json({ error: 'Bad signature' }); return; }
  try {
    const body = req.body as { data?: { status?: string; tx_ref?: string } };
    if (body.data?.status === 'successful' && body.data.tx_ref) {
      await query(
        "UPDATE payments SET status='successful' WHERE flutterwave_ref=$1 AND status='pending'",
        [body.data.tx_ref]
      );
    }
    res.json({ received: true });
  } catch (err) {
    console.error('[webhook]', err);
    res.status(500).json({ error: 'Webhook error' });
  }
}

// ─── Get single ticket ────────────────────────────────────────────────────────
export async function getTicket(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  try {
    const r = await query<TicketRow & {
      event_title: string; event_date: Date; event_location: string | null;
      sales_end_date: Date | null; category_name: string;
    }>(
      `SELECT t.*, e.title AS event_title, e.event_date, e.location AS event_location,
              e.sales_end_date, tc.name AS category_name
       FROM tickets t
       JOIN events e ON e.id=t.event_id
       JOIN ticket_categories tc ON tc.id=t.category_id
       WHERE t.id=$1 AND t.user_id=$2`,
      [id, req.user!.userId]
    );
    if (!r.rows[0]) { res.status(404).json({ error: 'Ticket not found' }); return; }
    res.json({ ticket: r.rows[0] });
  } catch (err) {
    console.error('[getTicket]', err);
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
}

// ─── Scan / verify QR (organizer) ────────────────────────────────────────────
export async function scanTicket(req: AuthRequest, res: Response): Promise<void> {
  const { qr_code } = req.body as { qr_code?: string };
  if (!qr_code) { res.status(400).json({ error: 'qr_code required' }); return; }
  try {
    const r = await query<TicketRow & { event_title: string; holder_name: string | null }>(
      `SELECT t.*, e.title AS event_title, u.full_name AS holder_name
       FROM tickets t JOIN events e ON e.id=t.event_id JOIN users u ON u.id=t.user_id
       WHERE t.qr_code=$1`,
      [qr_code]
    );
    if (!r.rows[0]) { res.json({ valid: false, error: 'Ticket not found' }); return; }
    const ticket = r.rows[0];
    if (ticket.status !== 'active') {
      res.json({ valid: false, ticket, error: `Ticket status: ${ticket.status}` }); return;
    }
    await query("UPDATE tickets SET status='used' WHERE id=$1", [ticket.id]);
    res.json({ valid: true, ticket: { ...ticket, status: 'used' } });
  } catch (err) {
    console.error('[scanTicket]', err);
    res.status(500).json({ error: 'Scan failed' });
  }
}
