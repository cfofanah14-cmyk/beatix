/**
 * BEATIX — Payments Controller
 * Handles: initiate → verify → webhook → payout → refund
 * All Flutterwave calls use TEST mode.
 */

import { Request, Response, NextFunction } from 'express'
import { validationResult } from 'express-validator'
import { query, withTransaction } from '../config/database'
import { AuthRequest } from '../middleware/auth'
import { resolveFeeConfig, calculateFees } from '../services/feeService'
import { initiatePayment, verifyPayment, initiatePayout, verifyWebhookSignature } from '../services/flutterwaveService'
import { checkForFraud, recordFraudFlag } from '../services/fraudService'
import { generateQrToken, generateQrImage, generateTicketNumber } from '../services/qrService'
import { sendTicketConfirmation, sendPaymentFailed } from '../services/smsService'
import { env } from '../config/env'
import { v4 as uuid } from 'uuid'

// ── POST /api/payments/initiate ───────────────────────────────────────────────
export async function initiateTransaction(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() })
      return
    }

    const {
      event_id, ticket_category_id, quantity,
      payment_method, buyer_phone, buyer_name, buyer_email,
      discount_code,
    } = req.body

    // ── 1. Validate event ─────────────────────────────────────────────────
    const eventRes = await query<any>(
      `SELECT e.id, e.title, e.status, e.sales_end_at, e.organizer_id,
              o.id AS org_id
       FROM events e
       JOIN organizers o ON o.id = e.organizer_id
       WHERE e.id = $1`,
      [event_id]
    )
    if (eventRes.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Event not found' }); return
    }
    const event = eventRes.rows[0]
    if (event.status !== 'published') {
      res.status(400).json({ success: false, message: 'Event is not available for purchase' }); return
    }
    if (event.sales_end_at && new Date(event.sales_end_at) < new Date()) {
      res.status(400).json({ success: false, message: 'Ticket sales have ended for this event' }); return
    }

    // ── 2. Validate ticket category + availability ────────────────────────
    const catRes = await query<any>(
      `SELECT id, name, price, capacity, remaining, is_active
       FROM ticket_categories
       WHERE id = $1 AND event_id = $2`,
      [ticket_category_id, event_id]
    )
    if (catRes.rows.length === 0 || !catRes.rows[0].is_active) {
      res.status(404).json({ success: false, message: 'Ticket category not found or inactive' }); return
    }
    const cat = catRes.rows[0]
    if (cat.remaining < quantity) {
      res.status(400).json({
        success: false,
        message: cat.remaining === 0
          ? 'This ticket category is sold out'
          : `Only ${cat.remaining} ticket(s) remaining`,
      }); return
    }

    // ── 3. Fraud check ────────────────────────────────────────────────────
    const fraud = await checkForFraud({
      buyerPhone: buyer_phone,
      eventId:    event_id,
      quantity,
      unitPrice:  Number(cat.price),
    })
    if (fraud.flagged && fraud.severity === 'high') {
      res.status(429).json({
        success: false,
        message: 'Purchase limit reached. Please contact support@beatix.sl',
      }); return
    }

    // ── 4. Resolve discount code ──────────────────────────────────────────
    let discountAmount = 0
    let discountCodeId: string | null = null
    if (discount_code) {
      const dcRes = await query<any>(
        `SELECT id, discount_pct, max_uses, times_used
         FROM discount_codes
         WHERE event_id = $1 AND code = $2 AND is_active = TRUE
           AND (expires_at IS NULL OR expires_at > NOW())`,
        [event_id, discount_code.toUpperCase()]
      )
      if (dcRes.rows.length > 0) {
        const dc = dcRes.rows[0]
        if (!dc.max_uses || dc.times_used < dc.max_uses) {
          const subtotalBeforeDiscount = Number(cat.price) * quantity
          discountAmount = subtotalBeforeDiscount * (Number(dc.discount_pct) / 100)
          discountCodeId = dc.id
        }
      }
    }

    // ── 5. Calculate fees ─────────────────────────────────────────────────
    const feeConfig = await resolveFeeConfig(event.org_id, event_id)
    const fees = calculateFees({
      unitPrice:         Number(cat.price),
      quantity,
      discountAmount,
      totalFeePct:       feeConfig.totalFeePct,
      organizerSharePct: feeConfig.organizerSharePct,
      buyerSharePct:     feeConfig.buyerSharePct,
      feeType:           feeConfig.feeType,
    })

    // ── 6. Create PENDING transaction (no tickets yet) ────────────────────
    const txId = uuid()
    await query(
      `INSERT INTO transactions (
         id, user_id, event_id, ticket_category_id, quantity,
         unit_price, subtotal, beatix_fee, organizer_fee_share, buyer_fee_share, total,
         fee_percentage_applied, organizer_share_pct_applied, buyer_share_pct_applied, fee_type_applied,
         payment_method, buyer_phone, buyer_name, buyer_email, discount_code, discount_amount,
         status
       ) VALUES (
         $1,$2,$3,$4,$5,
         $6,$7,$8,$9,$10,$11,
         $12,$13,$14,$15,
         $16,$17,$18,$19,$20,$21,
         'pending'
       )`,
      [
        txId,
        req.user?.userId || null,
        event_id, ticket_category_id, quantity,
        fees.unitPrice, fees.subtotal, fees.totalFee,
        fees.organizerFeeShare, fees.buyerFeeShare, fees.total,
        fees.feePercentageApplied, fees.organizerSharePctApplied,
        fees.buyerSharePctApplied, fees.feeTypeApplied,
        payment_method, buyer_phone, buyer_name, buyer_email || null,
        discount_code || null, discountAmount,
      ]
    )

    // Log low-severity fraud flags without blocking
    if (fraud.flagged) {
      await recordFraudFlag({ transactionId: txId, reason: fraud.reason!, severity: fraud.severity })
    }

    // ── 7. Get Flutterwave payment link ───────────────────────────────────
    const flwResult = await initiatePayment({
      transactionId:      txId,
      amount:             fees.total,
      currency:           'SLE',
      paymentMethod:      payment_method,
      buyerPhone:         buyer_phone,
      buyerName:          buyer_name,
      buyerEmail:         buyer_email,
      eventTitle:         event.title,
      ticketCategoryName: cat.name,
      quantity,
      redirectUrl:        `${env.frontendUrl}/checkout/verify`,
    })

    res.status(201).json({
      success: true,
      data: {
        transactionId: txId,
        paymentLink:   flwResult.paymentLink,
        summary: {
          categoryName:  cat.name,
          quantity,
          unitPrice:     fees.unitPrice,
          subtotal:      fees.subtotal,
          discountAmount: fees.discountAmount,
          serviceFee:    fees.buyerFeeShare,
          total:         fees.total,
          feeBreakdown: {
            totalFeeRate:       `${fees.feePercentageApplied}%`,
            buyerPays:          `${fees.buyerSharePctApplied}% of fee`,
            organizerAbsorbs:   `${fees.organizerSharePctApplied}% of fee`,
            feeType:            fees.feeTypeApplied,
          },
        },
      },
      // In dev, include hint on how to simulate success
      ...(env.isDev && {
        devNote: 'TEST MODE: redirect buyer to paymentLink. It auto-completes with status=successful.',
      }),
    })
  } catch (err) { next(err) }
}

// ── POST /api/payments/verify ─────────────────────────────────────────────────
// Called by frontend after Flutterwave redirects back
export async function verifyTransaction(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { transaction_id, flw_transaction_id, status } = req.body

    if (!transaction_id) {
      res.status(400).json({ success: false, message: 'transaction_id required' }); return
    }

    // Fetch our pending transaction
    const txRes = await query<any>(
      'SELECT * FROM transactions WHERE id = $1',
      [transaction_id]
    )
    if (txRes.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Transaction not found' }); return
    }
    const tx = txRes.rows[0]

    // Idempotency — already processed
    if (tx.status === 'success') {
      const qrRes = await query('SELECT ticket_number FROM qr_codes WHERE transaction_id=$1', [transaction_id])
      res.json({ success: true, data: { transactionId: transaction_id, tickets: qrRes.rows }, message: 'Already processed' })
      return
    }

    // ── Payment failed / cancelled ────────────────────────────────────────
    if (status === 'failed' || status === 'cancelled') {
      await query("UPDATE transactions SET status='failed' WHERE id=$1", [transaction_id])
      if (tx.buyer_phone) {
        const evRes = await query('SELECT title FROM events WHERE id=$1', [tx.event_id])
        await sendPaymentFailed(tx.buyer_phone, evRes.rows[0]?.title || 'the event')
      }
      res.json({ success: false, message: 'Payment failed. No ticket was issued.' }); return
    }

    // ── Verify with Flutterwave ───────────────────────────────────────────
    if (flw_transaction_id) {
      const verification = await verifyPayment(flw_transaction_id)
      if (!verification.verified) {
        await query("UPDATE transactions SET status='failed' WHERE id=$1", [transaction_id])
        res.status(400).json({ success: false, message: 'Payment could not be verified' }); return
      }
    }

    // ── Success — generate tickets inside a DB transaction ────────────────
    const tickets = await withTransaction(async (client) => {
      // Mark transaction success
      await client.query(
        `UPDATE transactions
         SET status='success', flw_transaction_id=$1, paid_at=NOW()
         WHERE id=$2`,
        [flw_transaction_id || `TEST_${Date.now()}`, transaction_id]
      )

      // Reduce ticket remaining count (with lock to prevent overselling)
      const updateRes = await client.query(
        `UPDATE ticket_categories
         SET remaining = remaining - $1
         WHERE id = $2 AND remaining >= $1
         RETURNING remaining`,
        [tx.quantity, tx.ticket_category_id]
      )
      if (updateRes.rows.length === 0) {
        throw new Error('Tickets sold out during payment processing')
      }

      // Update events.tickets_sold
      await client.query(
        'UPDATE events SET tickets_sold = tickets_sold + $1 WHERE id = $2',
        [tx.quantity, tx.event_id]
      )

      // Update organizer earnings
      const organizerEarning = Number(tx.subtotal) - Number(tx.discount_amount) - Number(tx.organizer_fee_share)
      await client.query(
        `UPDATE organizers
         SET total_earnings  = total_earnings  + $1,
             pending_balance = pending_balance + $1
         WHERE id = (SELECT organizer_id FROM events WHERE id = $2)`,
        [organizerEarning, tx.event_id]
      )

      // Update discount code usage
      if (tx.discount_code) {
        await client.query(
          `UPDATE discount_codes
           SET times_used = times_used + 1
           WHERE event_id = $1 AND code = $2`,
          [tx.event_id, tx.discount_code]
        )
      }

      // Get event title for QR + SMS
      const evRes = await client.query('SELECT title FROM events WHERE id=$1', [tx.event_id])
      const catRes = await client.query('SELECT name FROM ticket_categories WHERE id=$1', [tx.ticket_category_id])
      const eventTitle    = evRes.rows[0]?.title  || 'Event'
      const categoryName  = catRes.rows[0]?.name  || 'Ticket'
      const eventCode     = eventTitle.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 3) || 'EVT'

      // Generate one QR code per ticket
      const generatedTickets: Array<{ ticketNumber: string; qrCodeImage: string }> = []
      for (let i = 0; i < tx.quantity; i++) {
        const ticketNumber = generateTicketNumber(eventCode)
        const qrToken      = generateQrToken(ticketNumber, transaction_id, tx.event_id)
        const qrImage      = await generateQrImage(qrToken)

        await client.query(
          `INSERT INTO qr_codes (
             transaction_id, ticket_number, code, is_used,
             ticket_category_name, buyer_name, event_id
           ) VALUES ($1,$2,$3,FALSE,$4,$5,$6)`,
          [transaction_id, ticketNumber, qrToken, categoryName, tx.buyer_name, tx.event_id]
        )
        generatedTickets.push({ ticketNumber, qrCodeImage: qrImage })
      }

      // Send SMS confirmation
      if (tx.buyer_phone) {
        await sendTicketConfirmation(
          tx.buyer_phone,
          eventTitle,
          generatedTickets[0].ticketNumber,
          tx.quantity
        )
      }

      return generatedTickets
    })

    res.json({
      success: true,
      data: {
        transactionId: transaction_id,
        tickets,
        message: `${tickets.length} ticket(s) confirmed. SMS sent to ${tx.buyer_phone}.`,
      },
    })
  } catch (err) { next(err) }
}

// ── POST /api/payments/webhook ────────────────────────────────────────────────
// Flutterwave server-to-server webhook (backup to redirect)
export async function handleWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const signature = req.headers['verif-hash'] as string
    if (!verifyWebhookSignature(signature)) {
      res.status(401).json({ success: false, message: 'Invalid webhook signature' }); return
    }

    const { event: flwEvent, data } = req.body

    if (flwEvent === 'charge.completed') {
      const txRes = await query<any>(
        "SELECT id, status FROM transactions WHERE id=$1",
        [data.tx_ref]
      )
      if (txRes.rows.length > 0 && txRes.rows[0].status === 'pending') {
        // Reuse verify logic
        req.body = {
          transaction_id:     data.tx_ref,
          flw_transaction_id: String(data.id),
          status:             data.status === 'successful' ? 'successful' : 'failed',
        }
        await verifyTransaction(req as AuthRequest, res, next)
        return
      }
    }
    res.json({ success: true, received: true })
  } catch (err) { next(err) }
}

// ── POST /api/payments/validate-discount ─────────────────────────────────────
export async function validateDiscount(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { event_id, code } = req.body
    if (!event_id || !code) {
      res.status(400).json({ success: false, message: 'event_id and code required' }); return
    }

    const dcRes = await query<any>(
      `SELECT id, discount_pct, max_uses, times_used
       FROM discount_codes
       WHERE event_id=$1 AND code=$2 AND is_active=TRUE
         AND (expires_at IS NULL OR expires_at > NOW())`,
      [event_id, code.toUpperCase()]
    )

    if (dcRes.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Invalid or expired discount code' }); return
    }
    const dc = dcRes.rows[0]
    if (dc.max_uses && dc.times_used >= dc.max_uses) {
      res.status(400).json({ success: false, message: 'Discount code has reached its limit' }); return
    }

    res.json({ success: true, data: { discountPct: Number(dc.discount_pct) } })
  } catch (err) { next(err) }
}

// ── POST /api/payments/payout ─────────────────────────────────────────────────
// Organizer requests a payout of their pending balance
export async function requestPayout(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { amount, method, account_number, account_name, bank_code } = req.body

    // Get organizer
    const orgRes = await query<any>(
      'SELECT id, pending_balance, org_name FROM organizers WHERE user_id=$1',
      [req.user!.userId]
    )
    if (orgRes.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Organizer profile not found' }); return
    }
    const org = orgRes.rows[0]

    const requestedAmount = Number(amount)
    if (requestedAmount <= 0) {
      res.status(400).json({ success: false, message: 'Amount must be greater than zero' }); return
    }
    if (requestedAmount > Number(org.pending_balance)) {
      res.status(400).json({
        success: false,
        message: `Insufficient balance. Available: NLe ${Number(org.pending_balance).toFixed(2)}`,
      }); return
    }

    const reference = `BTXPAY-${Date.now()}-${org.id.slice(0, 8).toUpperCase()}`

    // Create payout record
    const payoutRes = await query<any>(
      `INSERT INTO payouts (organizer_id, amount, method, account_details, status, reference)
       VALUES ($1,$2,$3,$4,'pending',$5)
       RETURNING *`,
      [
        org.id, requestedAmount, method,
        JSON.stringify({ account_number, account_name, bank_code }),
        reference,
      ]
    )

    // Initiate transfer via Flutterwave
    const flwPayout = await initiatePayout({
      reference,
      amount:        requestedAmount,
      currency:      'SLE',
      accountNumber: account_number,
      accountName:   account_name,
      bankCode:      bank_code,
      narration:     `Beatix payout — ${org.org_name}`,
    })

    if (flwPayout.success) {
      // Deduct from pending balance
      await query(
        `UPDATE organizers
         SET pending_balance = pending_balance - $1,
             total_payouts   = total_payouts   + $1
         WHERE id = $2`,
        [requestedAmount, org.id]
      )
      await query(
        "UPDATE payouts SET status='processing' WHERE id=$1",
        [payoutRes.rows[0].id]
      )
    }

    res.status(201).json({
      success: true,
      data: {
        payoutId:  payoutRes.rows[0].id,
        reference,
        amount:    requestedAmount,
        status:    flwPayout.success ? 'processing' : 'pending',
        message:   flwPayout.message,
      },
    })
  } catch (err) { next(err) }
}

// ── GET /api/payments/transaction/:id ────────────────────────────────────────
export async function getTransaction(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const txRes = await query<any>(
      `SELECT t.*, e.title AS event_title, tc.name AS category_name
       FROM transactions t
       JOIN events e ON e.id = t.event_id
       JOIN ticket_categories tc ON tc.id = t.ticket_category_id
       WHERE t.id=$1 AND (t.user_id=$2 OR $3='admin')`,
      [req.params.id, req.user!.userId, req.user!.role]
    )
    if (txRes.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Transaction not found' }); return
    }

    const qrRes = await query(
      'SELECT ticket_number, is_used, scanned_at FROM qr_codes WHERE transaction_id=$1',
      [req.params.id]
    )

    res.json({ success: true, data: { ...txRes.rows[0], tickets: qrRes.rows } })
  } catch (err) { next(err) }
}
