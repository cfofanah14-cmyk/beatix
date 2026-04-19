import { Request, Response, NextFunction } from 'express'
import { query } from '../db/client'
import { AuthRequest } from '../middleware/auth'

// PATCH /api/users/me  — update profile
export async function updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, email, language, avatar_url } = req.body
    const updated = await query(
      `UPDATE users SET
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        language = COALESCE($3, language),
        avatar_url = COALESCE($4, avatar_url)
       WHERE id = $5
       RETURNING id, phone, name, email, language, avatar_url, role`,
      [name, email, language, avatar_url, req.user!.userId]
    )
    res.json({ success: true, data: updated.rows[0] })
  } catch (err) { next(err) }
}

// GET /api/users/wishlist
export async function getWishlist(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const res2 = await query(`
      SELECT e.id, e.title, e.cover_image_url, e.starts_at, e.venue_name, e.city,
             MIN(tt.price) AS min_price
      FROM wishlists w
      JOIN events e ON e.id = w.event_id
      LEFT JOIN ticket_types tt ON tt.event_id = e.id AND tt.is_active = TRUE
      WHERE w.user_id = $1
      GROUP BY e.id
      ORDER BY w.created_at DESC
    `, [req.user!.userId])
    res.json({ success: true, data: res2.rows })
  } catch (err) { next(err) }
}

// POST /api/users/wishlist/:eventId
export async function addToWishlist(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await query(
      'INSERT INTO wishlists (user_id, event_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [req.user!.userId, req.params.eventId]
    )
    res.json({ success: true, message: 'Added to wishlist' })
  } catch (err) { next(err) }
}

// DELETE /api/users/wishlist/:eventId
export async function removeFromWishlist(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await query('DELETE FROM wishlists WHERE user_id=$1 AND event_id=$2', [req.user!.userId, req.params.eventId])
    res.json({ success: true, message: 'Removed from wishlist' })
  } catch (err) { next(err) }
}

// POST /api/users/report
export async function submitReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { target_type, target_id, reason } = req.body
    await query(
      'INSERT INTO reports (reporter_id, target_type, target_id, reason) VALUES ($1,$2,$3,$4)',
      [req.user?.userId || null, target_type, target_id, reason]
    )
    res.json({ success: true, message: 'Report submitted. Our team will review it.' })
  } catch (err) { next(err) }
}

// GET /api/users/notifications
export async function getNotifications(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const res2 = await query(
      'SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50',
      [req.user!.userId]
    )
    res.json({ success: true, data: res2.rows })
  } catch (err) { next(err) }
}

// PATCH /api/users/notifications/:id/read
export async function markNotificationRead(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await query('UPDATE notifications SET read=true WHERE id=$1 AND user_id=$2', [req.params.id, req.user!.userId])
    res.json({ success: true })
  } catch (err) { next(err) }
}
