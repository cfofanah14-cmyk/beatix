import { Request, Response, NextFunction } from 'express'
import { query } from '../db/client'
import { AuthRequest } from '../middleware/auth'

// GET /api/admin/organizers  — list all organizer applications
export async function listOrganizers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status } = req.query
    const params: any[] = []
    const where = status ? `WHERE o.status=$${params.push(status)}` : ''
    const res2 = await query(`
      SELECT o.*, u.phone, u.name, u.email
      FROM organizers o JOIN users u ON u.id = o.user_id
      ${where} ORDER BY o.created_at DESC
    `, params)
    res.json({ success: true, data: res2.rows })
  } catch (err) { next(err) }
}

// PATCH /api/admin/organizers/:id/approve
export async function approveOrganizer(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await query(
      "UPDATE organizers SET status='approved', verified_at=NOW(), verified_by=$1 WHERE id=$2",
      [req.user!.userId, req.params.id]
    )
    res.json({ success: true, message: 'Organizer approved' })
  } catch (err) { next(err) }
}

// PATCH /api/admin/organizers/:id/suspend
export async function suspendOrganizer(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await query("UPDATE organizers SET status='suspended' WHERE id=$1", [req.params.id])
    res.json({ success: true, message: 'Organizer suspended' })
  } catch (err) { next(err) }
}

// GET /api/admin/fraud-flags  — list unresolved fraud flags
export async function listFraudFlags(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const res2 = await query(`
      SELECT ff.*, tx.buyer_phone, tx.total_amount, tx.event_id, e.title AS event_title
      FROM fraud_flags ff
      JOIN transactions tx ON tx.id = ff.transaction_id
      JOIN events e ON e.id = tx.event_id
      WHERE ff.resolved = false
      ORDER BY ff.created_at DESC
    `, [])
    res.json({ success: true, data: res2.rows })
  } catch (err) { next(err) }
}

// PATCH /api/admin/fraud-flags/:id/resolve
export async function resolveFraudFlag(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await query('UPDATE fraud_flags SET resolved=true, resolved_by=$1 WHERE id=$2', [req.user!.userId, req.params.id])
    res.json({ success: true, message: 'Flag resolved' })
  } catch (err) { next(err) }
}

// GET /api/admin/reports
export async function listReports(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const res2 = await query("SELECT * FROM reports ORDER BY created_at DESC", [])
    res.json({ success: true, data: res2.rows })
  } catch (err) { next(err) }
}

// GET /api/admin/stats  — platform-wide stats
export async function getPlatformStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const [users, events, transactions, revenue] = await Promise.all([
      query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE role='organizer') AS organizers, COUNT(*) FILTER (WHERE role='buyer') AS buyers FROM users", []),
      query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='published') AS live FROM events", []),
      query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='success') AS successful FROM transactions", []),
      query("SELECT SUM(service_fee) AS total_fees FROM transactions WHERE status='success'", []),
    ])
    res.json({
      success: true,
      data: {
        users: users.rows[0],
        events: events.rows[0],
        transactions: transactions.rows[0],
        revenue: revenue.rows[0],
      },
    })
  } catch (err) { next(err) }
}

// PATCH /api/admin/payouts/:id  — process a payout
export async function processPayout(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status, reference } = req.body
    await query(
      "UPDATE payouts SET status=$1, reference=$2, processed_at=NOW() WHERE id=$3",
      [status, reference, req.params.id]
    )
    if (status === 'paid') {
      const payoutRes = await query('SELECT organizer_id, amount FROM payouts WHERE id=$1', [req.params.id])
      if (payoutRes.rows.length > 0) {
        await query('UPDATE organizers SET total_payouts = total_payouts + $1 WHERE id=$2',
          [payoutRes.rows[0].amount, payoutRes.rows[0].organizer_id])
      }
    }
    res.json({ success: true, message: `Payout marked as ${status}` })
  } catch (err) { next(err) }
}
