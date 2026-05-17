import Stripe from 'stripe';
import { v4 as uuidv4 } from 'uuid';
import { pool, query } from '../config/database';
import { config } from '../config/config';
import { Order, CreateOrderBody } from '../types';
import { AppError } from '../middleware/error.middleware';

const stripe = config.stripeSecretKey
  ? new Stripe(config.stripeSecretKey, { apiVersion: '2024-12-18.acacia' })
  : null;

export const createOrder = async (
  userId: string,
  body: CreateOrderBody
): Promise<{ order: Order; clientSecret: string | null }> => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Validate tiers and compute total
    let totalAmount = 0;
    const tierDetails: { tierId: string; qty: number; price: number; available: number }[] = [];

    for (const item of body.items) {
      const tierResult = await client.query(
        'SELECT * FROM ticket_tiers WHERE id = $1 AND event_id = $2 AND is_active = TRUE FOR UPDATE',
        [item.ticket_tier_id, body.event_id]
      );

      const tier = tierResult.rows[0];
      if (!tier) throw new AppError(`Ticket tier ${item.ticket_tier_id} not found`, 404);

      const available = tier.quantity_total - tier.quantity_sold;
      if (available < item.quantity) {
        throw new AppError(`Only ${available} tickets available for "${tier.name}"`, 400);
      }

      totalAmount += tier.price * item.quantity;
      tierDetails.push({ tierId: tier.id, qty: item.quantity, price: tier.price, available });
    }

    // Create order
    const orderResult = await client.query(
      `INSERT INTO orders (user_id, event_id, total_amount, currency, status)
       VALUES ($1, $2, $3, 'SLL', 'pending') RETURNING *`,
      [userId, body.event_id, totalAmount]
    );
    const order: Order = orderResult.rows[0];

    // Create order items
    for (const item of body.items) {
      const tier = tierDetails.find((t) => t.tierId === item.ticket_tier_id)!;
      const subtotal = tier.price * item.quantity;

      await client.query(
        `INSERT INTO order_items (order_id, ticket_tier_id, quantity, unit_price, subtotal)
         VALUES ($1, $2, $3, $4, $5)`,
        [order.id, item.ticket_tier_id, item.quantity, tier.price, subtotal]
      );

      // Reserve tickets
      await client.query(
        'UPDATE ticket_tiers SET quantity_sold = quantity_sold + $1 WHERE id = $2',
        [item.quantity, item.ticket_tier_id]
      );
    }

    await client.query('COMMIT');

    // Create Stripe PaymentIntent if Stripe is configured and amount > 0
    let clientSecret: string | null = null;

    if (stripe && totalAmount > 0) {
      const intent = await stripe.paymentIntents.create({
        amount: Math.round(totalAmount * 100), // pence/cents
        currency: 'sll',
        metadata: { orderId: order.id, userId },
      });

      await query(
        'UPDATE orders SET stripe_payment_intent_id = $1 WHERE id = $2',
        [intent.id, order.id]
      );

      clientSecret = intent.client_secret;
    } else if (totalAmount === 0) {
      // Free event — auto-confirm
      await client.query(
        "UPDATE orders SET status = 'paid' WHERE id = $1",
        [order.id]
      );
      await issueTickets(order.id);
    }

    return { order, clientSecret };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const issueTickets = async (orderId: string): Promise<void> => {
  const itemsResult = await query(
    'SELECT * FROM order_items WHERE order_id = $1',
    [orderId]
  );

  const orderResult = await query('SELECT * FROM orders WHERE id = $1', [orderId]);
  const order: Order = orderResult.rows[0];

  for (const item of itemsResult.rows) {
    for (let i = 0; i < item.quantity; i++) {
      const qrCode = `BX-${uuidv4().replace(/-/g, '').toUpperCase().slice(0, 16)}`;
      await query(
        `INSERT INTO tickets (order_item_id, user_id, event_id, ticket_tier_id, qr_code)
         VALUES ($1, $2, $3, $4, $5)`,
        [item.id, order.user_id, order.event_id, item.ticket_tier_id, qrCode]
      );
    }
  }
};

export const handleStripeWebhook = async (
  rawBody: Buffer,
  signature: string
): Promise<void> => {
  if (!stripe || !config.stripeWebhookSecret) {
    throw new AppError('Stripe not configured', 500);
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, config.stripeWebhookSecret);
  } catch {
    throw new AppError('Invalid webhook signature', 400);
  }

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object as Stripe.PaymentIntent;
    const orderId = intent.metadata.orderId;

    await query(
      "UPDATE orders SET status = 'paid', stripe_charge_id = $1 WHERE id = $2",
      [intent.latest_charge, orderId]
    );

    await issueTickets(orderId);
  }

  if (event.type === 'payment_intent.payment_failed') {
    const intent = event.data.object as Stripe.PaymentIntent;
    const orderId = intent.metadata.orderId;
    await query("UPDATE orders SET status = 'failed' WHERE id = $1", [orderId]);
  }
};

export const getUserOrders = async (userId: string): Promise<Order[]> => {
  const result = await query(
    `SELECT o.*, e.title as event_title, e.starts_at, e.cover_image_url
     FROM orders o
     JOIN events e ON o.event_id = e.id
     WHERE o.user_id = $1
     ORDER BY o.created_at DESC`,
    [userId]
  );
  return result.rows;
};

export const getUserTickets = async (userId: string) => {
  const result = await query(
    `SELECT t.*, e.title as event_title, e.starts_at, e.cover_image_url,
            tt.name as tier_name, v.name as venue_name, v.city as venue_city
     FROM tickets t
     JOIN events e ON t.event_id = e.id
     JOIN ticket_tiers tt ON t.ticket_tier_id = tt.id
     LEFT JOIN venues v ON e.venue_id = v.id
     WHERE t.user_id = $1
     ORDER BY e.starts_at ASC`,
    [userId]
  );
  return result.rows;
};

export const checkInTicket = async (qrCode: string, organizerId: string) => {
  const ticketResult = await query(
    `SELECT t.*, e.organizer_id FROM tickets t
     JOIN events e ON t.event_id = e.id
     WHERE t.qr_code = $1`,
    [qrCode]
  );

  const ticket = ticketResult.rows[0];
  if (!ticket) throw new AppError('Ticket not found', 404);
  if (ticket.organizer_id !== organizerId) throw new AppError('Unauthorized', 403);
  if (ticket.status === 'used') throw new AppError('Ticket already used', 409);
  if (ticket.status !== 'valid') throw new AppError('Ticket is not valid', 400);

  const result = await query(
    `UPDATE tickets SET status = 'used', checked_in_at = NOW()
     WHERE qr_code = $1 RETURNING *`,
    [qrCode]
  );
  return result.rows[0];
};
