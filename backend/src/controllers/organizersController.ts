import { Request, Response, NextFunction } from 'express'
import { query } from '../db/client'
import { AuthRequest } from '../middleware/auth'

// POST /api/organizers/apply  — apply to become an organizer
export async function applyOrganizer(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { org_name, description, website } = req.body
    if (!org_name) { res.status(400).json({ success: false, message: 'Organization name required' }); return }

    const existing = await query('SELECT id FROM organizers WHERE user_id=$1', [req.user!.userId])
    if (existing.rows.length > 0) { res.status(400).json({ success: false, message: 'Already applied' }); return }

    await query("UPDATE users SET role='organizer' WHERE id=$1", [req.user!.userId])
    const orgRes = await query(
      'INSERT INTO organizers (user_id, org_name, description, website) VALUES ($1,$2,$3,$4) RETURNING *',
      [req.user!.userId, org_name, description, website]
    )
    res.status(201).json({ success: true, data: orgRes.rows[0], message: 'Application submitted. Beatix will review within 24 hours.' })
  } catch (err) { next(err) }
}

// GET /api/organizers/dashboard  — organizer's own dashboard stats
export async function getDashboard(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgRes = await query('SELECT id, total_earnings, total_payouts FROM organizers WHERE user_id=$1', [req.user!.userId])
    if (orgRes.rows.length === 0) { res.status(404).json({ success: false, message: 'Organizer not found' }); return }
    const orgId = orgRes.rows[0].id

    const [eventsRes, salesRes, recentRes] = await Promise.all([
      query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='published') AS live FROM events WHERE organizer_id=$1", [orgId]),
      query("SELECT COUNT(*) AS total_tickets, SUM(total_amount) AS gross, SUM(service_fee) AS fees FROM transactions WHERE event_id IN (SELECT id FROM events WHERE organizer_id=$1) AND status='success'", [orgId]),
      query(`SELECT tx.id, tx.total_amount, tx.payment_method, tx.created_at, tx.buyer_name, e.title AS event_title, tt.name AS ticket_type
             FROM transactions tx JOIN events e ON e.id=tx.event_id JOIN ticket_types tt ON tt.id=tx.ticket_type_id
             WHERE e.organizer_id=$1 AND tx.status='success'
             ORDER BY tx.created_at DESC LIMIT 10`, [orgId]),
    ])

    res.json({
      success: true,
      data: {
        totalEarnings: orgRes.rows[0].total_earnings,
        totalPayouts: orgRes.rows[0].total_payouts,
        balance: Number(orgRes.rows[0].total_earnings) - Number(orgRes.rows[0].total_payouts),
        events: eventsRes.rows[0],
        sales: salesRes.rows[0],
        recentTransactions: recentRes.rows,
      },
    })
  } catch (err) { next(err) }
}

// GET /api/organizers/events  — list organizer's own events
export async function getMyEvents(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgRes = await query('SELECT id FROM organizers WHERE user_id=$1', [req.user!.userId])
    if (orgRes.rows.length === 0) { res.status(404).json({ success: false, message: 'Organizer not found' }); return }

    const eventsRes = await query(`
      SELECT e.*, COUNT(DISTINCT tt.id) AS ticket_type_count, COALESCE(SUM(tt.sold),0) AS total_sold
      FROM events e
      LEFT JOIN ticket_types tt ON tt.event_id = e.id
      WHERE e.organizer_id = $1
      GROUP BY e.id
      ORDER BY e.created_at DESC
    `, [orgRes.rows[0].id])

    res.json({ success: true, data: eventsRes.rows })
  } catch (err) { next(err) }
}

// GET /api/organizers/staff  — list staff members
export async function getStaff(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgRes = await query('SELECT id FROM organizers WHERE user_id=$1', [req.user!.userId])
    if (orgRes.rows.length === 0) { res.status(404).json({ success: false, message: 'Organizer not found' }); return }

    const staffRes = await query(`
      SELECT s.id, s.role, s.added_at, u.phone, u.name, u.avatar_url
      FROM staff s JOIN users u ON u.id = s.user_id
      WHERE s.organizer_id = $1
    `, [orgRes.rows[0].id])
    res.json({ success: true, data: staffRes.rows })
  } catch (err) { next(err) }
}

// POST /api/organizers/staff  — add a staff member
export async function addStaff(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { phone, role = 'scanner' } = req.body
    const orgRes = await query('SELECT id FROM organizers WHERE user_id=$1', [req.user!.userId])
    if (orgRes.rows.length === 0) { res.status(404).json({ success: false, message: 'Organizer not found' }); return }

    const userRes = await query('SELECT id FROM users WHERE phone=$1', [phone])
    if (userRes.rows.length === 0) { res.status(404).json({ success: false, message: 'User with this phone number not found' }); return }

    await query(
      'INSERT INTO staff (organizer_id, user_id, role) VALUES ($1,$2,$3) ON CONFLICT (organizer_id, user_id) DO UPDATE SET role=$3',
      [orgRes.rows[0].id, userRes.rows[0].id, role]
    )
    res.json({ success: true, message: 'Staff member added' })
  } catch (err) { next(err) }
}

// DELETE /api/organizers/staff/:staffId
export async function removeStaff(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgRes = await query('SELECT id FROM organizers WHERE user_id=$1', [req.user!.userId])
    if (orgRes.rows.length === 0) { res.status(404).json({ success: false, message: 'Organizer not found' }); return }
    await query('DELETE FROM staff WHERE id=$1 AND organizer_id=$2', [req.params.staffId, orgRes.rows[0].id])
    res.json({ success: true, message: 'Staff member removed' })
  } catch (err) { next(err) }
}

// POST /api/organizers/payout  — request a payout
export async function requestPayout(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { amount, method, account_details } = req.body
    const orgRes = await query('SELECT id, total_earnings, total_payouts FROM organizers WHERE user_id=$1', [req.user!.userId])
    if (orgRes.rows.length === 0) { res.status(404).json({ success: false, message: 'Organizer not found' }); return }

    const balance = Number(orgRes.rows[0].total_earnings) - Number(orgRes.rows[0].total_payouts)
    if (amount > balance) { res.status(400).json({ success: false, message: 'Insufficient balance' }); return }

    const payoutRes = await query(
      'INSERT INTO payouts (organizer_id, amount, method, account_details) VALUES ($1,$2,$3,$4) RETURNING *',
      [orgRes.rows[0].id, amount, method, JSON.stringify(account_details)]
    )
    res.status(201).json({ success: true, data: payoutRes.rows[0], message: 'Payout request submitted. Processing within 2-3 business days.' })
  } catch (err) { next(err) }
}

// PATCH /api/organizers/profile  — update organizer profile
export async function updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { org_name, description, logo_url, website, social_links, bank_name, bank_account, mobile_money_number } = req.body
    const updated = await query(`
      UPDATE organizers SET
        org_name = COALESCE($1, org_name),
        description = COALESCE($2, description),
        logo_url = COALESCE($3, logo_url),
        website = COALESCE($4, website),
        social_links = COALESCE($5, social_links),
        bank_name = COALESCE($6, bank_name),
        bank_account = COALESCE($7, bank_account),
        mobile_money_number = COALESCE($8, mobile_money_number)
      WHERE user_id = $9 RETURNING *
    `, [org_name, description, logo_url, website, social_links ? JSON.stringify(social_links) : null, bank_name, bank_account, mobile_money_number, req.user!.userId])
    res.json({ success: true, data: updated.rows[0] })
  } catch (err) { next(err) }
}
