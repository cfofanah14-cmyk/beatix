import { Request, Response, NextFunction } from 'express'
import { validationResult } from 'express-validator'
import crypto from 'crypto'
import { query, withTransaction } from '../db/client'
import { AuthRequest } from '../middleware/auth'
import { generateQrToken, generateQrImage, generateTicketNumber } from '../services/qrService'
import { sendTicketConfirmation, sendPaymentFailed } from '../services/smsService'
import { calculateFee } from './feeController'

// POST /api/payments/initiate
export async function initiatePayment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) { res.status(400).json({ success: false, errors: errors.array() }); return }

    const { event_id, ticket_type_id, quantity, payment_method, buyer_phone, buyer_name, discount_code } = req.body

    // Validate event is published
    const eventRes = await query("SELECT id, title, status, sales_end_at FROM events WHERE id=$1", [event_id])
    if (eventRes.rows.length === 0 || eventRes.rows[0].status !== 'published') {
      res.status(400).json({ success: false, message: 'Event not available' }); return
    }
    if (eventRes.rows[0].sales_end_at && new Date(eventRes.rows[0].sales_end_at) < new Date()) {
      res.status(400).json({ success: false, message: 'Ticket sales have ended' }); return
    }

    // Validate ticket type and capacity
    const ttRes = await query(
      'SELECT id, name, price, capacity, sold FROM ticket_types WHERE id=$1 AND event_id=$2 AND is_active=TRUE',
      [ticket_type_id, event_id]
    )
    if (ttRes.rows.length === 0) { res.status(400).json({ success: false, message: 'Ticket type not found' }); return }
    const tt = ttRes.rows[0]
    if (tt.capacity - tt.sold < quantity) {
      res.status(400).json({ success: false, message: `Only ${tt.capacity - tt.sold} tickets remaining` }); return
    }

    // Fraud detection — flag suspicious bulk purchases
    const bulkCheck = await query(
      `SELECT COUNT(*) FROM transactions WHERE buyer_phone=$1 AND event_id=$2 AND status IN ('pending','success') AND created_at > NOW() - INTERVAL '1 hour'`,
      [buyer_phone, event_id]
    )
    if (Number(bulkCheck.rows[0].count) >= 3) {
      await query('INSERT INTO fraud_flags (transaction_id, reason) SELECT id, $1 FROM transactions WHERE buyer_phone=$2 AND event_id=$3 ORDER BY created_at DESC LIMIT 1',
        ['Suspicious bulk purchase attempt', buyer_phone, event_id]).catch(() => {})
      res.status(429).json({ success: false, message: 'Too many purchase attempts. Please contact support.' }); return
    }

    // Calculate pricing
    const unitPrice = Number(tt.price)
    const subtotal = unitPrice * quantity
    let discountAmount = 0
    let discountCodeId: string | null = null

    if (discount_code) {
      const dcRes = await query(
        `SELECT id, discount_pct, max_uses, times_used FROM discount_codes WHERE event_id=$1 AND code=$2 AND is_active=TRUE AND (expires_at IS NULL OR expires_at > NOW())`,
        [event_id, discount_code.toUpperCase()]
      )
      if (dcRes.rows.length > 0) {
        const dc = dcRes.rows[0]
        if (!dc.max_uses || dc.times_used < dc.max_uses) {
          discountAmount = subtotal * (dc.discount_pct / 100)
          discountCodeId = dc.id
        }
      }
    }

    const serviceFee = (subtotal - discountAmount) * (await calculateFee(subtotal, (await query('SELECT organizer_id FROM events WHERE id=$1', [event_id])).rows[0].organizer_id)).feeRate
    const feeBreakdown = await calculateFee(subtotal - discountAmount, (await query('SELECT organizer_id FROM events WHERE id=$1', [event_id])).rows[0].organizer_id)
    const totalAmount = subtotal - discountAmount + feeBreakdown.buyerFeeShare

    // Create pending transaction
    const txRes = await query(`
      INSERT INTO transactions (user_id, event_id, ticket_type_id, quantity, unit_price, subtotal, service_fee, organizer_fee_share, buyer_fee_share, discount_amount, total_amount, payment_method, buyer_phone, buyer_name, discount_code_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *
    `, [req.user?.userId || null, event_id, ticket_type_id, quantity, unitPrice, subtotal, feeBreakdown.serviceFee, feeBreakdown.organizerFeeShare, feeBreakdown.buyerFeeShare, discountAmount, totalAmount, payment_method, buyer_phone, buyer_name || null, discountCodeId])

    const transaction = txRes.rows[0]

    // Build Flutterwave payment payload
    const flwPayload = {
      tx_ref: transaction.id,
      amount: totalAmount.toFixed(2),
      currency: 'SLL', // Sierra Leone Leone
      payment_options: payment_method === 'card' ? 'card' : 'mobilemoney',
      customer: { phone_number: buyer_phone, name: buyer_name || 'Beatix Customer' },
      customizations: {
        title: 'Beatix Tickets',
        description: `${quantity}x ${tt.name} — ${eventRes.rows[0].title}`,
        logo: 'https://beatix.sl/logo.png',
      },
      redirect_url: `${process.env.FRONTEND_URL}/checkout/verify`,
      meta: { transaction_id: transaction.id },
    }

    res.json({
      success: true,
      data: {
        transactionId: transaction.id,
        totalAmount,
        serviceFee,
        discountAmount,
        flwPayload,
        // In dev mode return summary without hitting Flutterwave
        ...(process.env.NODE_ENV === 'development' && {
          devNote: 'In production this would redirect to Flutterwave. Call POST /api/payments/verify with this transactionId to simulate success.',
        }),
      },
    })
  } catch (err) { next(err) }
}

// POST /api/payments/verify
export async function verifyPayment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { transaction_id, flw_transaction_id, status } = req.body

    const txRes = await query('SELECT * FROM transactions WHERE id=$1', [transaction_id])
    if (txRes.rows.length === 0) { res.status(404).json({ success: false, message: 'Transaction not found' }); return }
    const tx = txRes.rows[0]

    if (tx.status === 'success') {
      res.json({ success: true, message: 'Already processed', data: { transactionId: tx.id } }); return
    }

    // In production: verify with Flutterwave API here
    // const flwVerify = await flw.Transaction.verify({ id: flw_transaction_id })
    // if (flwVerify.data.status !== 'successful') { ... }

    if (status === 'failed' || status === 'cancelled') {
      await query("UPDATE transactions SET status='failed' WHERE id=$1", [transaction_id])
      if (tx.buyer_phone) await sendPaymentFailed(tx.buyer_phone, 'your event')
      res.json({ success: false, message: 'Payment failed' }); return
    }

    // Payment success — generate tickets inside a transaction
    await withTransaction(async (client) => {
      // Mark transaction success
      await client.query(
        "UPDATE transactions SET status='success', flw_transaction_id=$1, paid_at=NOW() WHERE id=$2",
        [flw_transaction_id || 'DEV-' + Date.now(), transaction_id]
      )

      // Get event short code for ticket number
      const evRes = await client.query('SELECT title FROM events WHERE id=$1', [tx.event_id])
      const eventCode = evRes.rows[0]?.title?.slice(0, 3).toUpperCase() || 'EVT'

      // Generate one ticket per quantity
      const tickets = []
      for (let i = 0; i < tx.quantity; i++) {
        const ticketNumber = generateTicketNumber(eventCode)
        const qrToken = generateQrToken(ticketNumber, tx.event_id, ticketNumber)
        const qrImage = await generateQrImage(qrToken)

        const ticketRes = await client.query(`
          INSERT INTO tickets (transaction_id, event_id, ticket_type_id, user_id, ticket_number, qr_code_data, qr_code_image, buyer_name, buyer_phone)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id, ticket_number
        `, [transaction_id, tx.event_id, tx.ticket_type_id, tx.user_id, ticketNumber, qrToken, qrImage, tx.buyer_name, tx.buyer_phone])
        tickets.push(ticketRes.rows[0])
      }

      // Update sold count on ticket type
      await client.query('UPDATE ticket_types SET sold = sold + $1 WHERE id=$2', [tx.quantity, tx.ticket_type_id])
      await client.query('UPDATE events SET tickets_sold = tickets_sold + $1 WHERE id=$2', [tx.quantity, tx.event_id])

      // Update discount code usage
      if (tx.discount_code_id) {
        await client.query('UPDATE discount_codes SET times_used = times_used + 1 WHERE id=$1', [tx.discount_code_id])
      }

      // Update organizer earnings (total minus service fee)
      const organizerEarnings = Number(tx.subtotal) - Number(tx.discount_amount)
      await client.query(
        'UPDATE organizers SET total_earnings = total_earnings + $1 WHERE id = (SELECT organizer_id FROM events WHERE id=$2)',
        [organizerEarnings, tx.event_id]
      )

      // Send SMS confirmation
      if (tx.buyer_phone && tickets.length > 0) {
        await sendTicketConfirmation(tx.buyer_phone, evRes.rows[0]?.title || 'your event', tickets[0].ticket_number)
      }

      res.json({ success: true, data: { transactionId: transaction_id, tickets } })
    })
  } catch (err) { next(err) }
}

// POST /api/payments/webhook  (Flutterwave webhook)
export async function handleWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Verify webhook signature
    const signature = req.headers['verif-hash']
    if (signature !== process.env.FLW_WEBHOOK_SECRET) {
      res.status(401).json({ success: false, message: 'Invalid webhook signature' }); return
    }

    const { event, data } = req.body
    if (event === 'charge.completed' && data.status === 'successful') {
      const txRes = await query("SELECT id, status FROM transactions WHERE id=$1", [data.tx_ref])
      if (txRes.rows.length > 0 && txRes.rows[0].status === 'pending') {
        // Re-use verifyPayment logic
        req.body = { transaction_id: data.tx_ref, flw_transaction_id: data.id, status: 'successful' }
        await verifyPayment(req as AuthRequest, res, next)
        return
      }
    }
    res.json({ success: true })
  } catch (err) { next(err) }
}

// POST /api/payments/validate-discount
export async function validateDiscount(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { event_id, code } = req.body
    const dcRes = await query(
      `SELECT id, discount_pct, max_uses, times_used FROM discount_codes WHERE event_id=$1 AND code=$2 AND is_active=TRUE AND (expires_at IS NULL OR expires_at > NOW())`,
      [event_id, code.toUpperCase()]
    )
    if (dcRes.rows.length === 0) { res.status(404).json({ success: false, message: 'Invalid or expired discount code' }); return }
    const dc = dcRes.rows[0]
    if (dc.max_uses && dc.times_used >= dc.max_uses) {
      res.status(400).json({ success: false, message: 'Discount code has reached its usage limit' }); return
    }
    res.json({ success: true, data: { discountPct: dc.discount_pct } })
  } catch (err) { next(err) }
}

// GET /api/payments/transaction/:id
export async function getTransaction(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const txRes = await query(
      'SELECT * FROM transactions WHERE id=$1 AND (user_id=$2 OR $3=\'admin\')',
      [req.params.id, req.user!.userId, req.user!.role]
    )
    if (txRes.rows.length === 0) { res.status(404).json({ success: false, message: 'Transaction not found' }); return }
    res.json({ success: true, data: txRes.rows[0] })
  } catch (err) { next(err) }
}
