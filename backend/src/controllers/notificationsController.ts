import { Request, Response, NextFunction } from 'express'
import { query } from '../config/database'
import { AuthRequest } from '../middleware/auth'
import { sendEventReminder } from '../services/smsService'

// GET /api/notifications — user's notifications
export async function getMyNotifications(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const res2 = await query(
      `SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50`,
      [req.user!.userId]
    )
    res.json({ success: true, data: res2.rows })
  } catch (err) { next(err) }
}

// PATCH /api/notifications/:id/read
export async function markRead(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await query('UPDATE notifications SET read=TRUE WHERE id=$1 AND user_id=$2', [req.params.id, req.user!.userId])
    res.json({ success: true })
  } catch (err) { next(err) }
}

// PATCH /api/notifications/read-all
export async function markAllRead(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await query('UPDATE notifications SET read=TRUE WHERE user_id=$1', [req.user!.userId])
    res.json({ success: true, message: 'All notifications marked as read' })
  } catch (err) { next(err) }
}

// POST /api/notifications/send-reminders — cron/admin trigger to send reminders
export async function sendEventReminders(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    // Find events starting in 24 hours whose buyers haven't been reminded
    const buyersRes = await query<any>(`
      SELECT DISTINCT t.buyer_phone, e.title, e.starts_at
      FROM transactions t
      JOIN events e ON e.id = t.event_id
      WHERE t.status = 'success'
        AND t.buyer_phone IS NOT NULL
        AND e.starts_at BETWEEN NOW() + INTERVAL '23 hours'
                             AND NOW() + INTERVAL '25 hours'
        AND NOT EXISTS (
          SELECT 1 FROM notifications n
          WHERE n.user_id = t.user_id
            AND n.type    = 'reminder'
            AND n.data->>'event_id' = e.id::text
        )
    `)

    let sent = 0
    for (const b of buyersRes.rows) {
      await sendEventReminder(b.buyer_phone, b.title, 'tomorrow')
      sent++
    }

    res.json({ success: true, data: { remindersSent: sent } })
  } catch (err) { next(err) }
}

// GET /api/notifications/social-settings — Phase 6 social config
export async function getSocialSettings(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const res2 = await query(
      `SELECT key, value FROM platform_settings WHERE key IN ('instagram_url','facebook_url','tiktok_url','social_follow_prompt')`
    )
    const settings: Record<string, string> = {}
    res2.rows.forEach((r: any) => { settings[r.key] = r.value })
    res.json({ success: true, data: settings })
  } catch (err) { next(err) }
}

// POST /api/notifications/social-follow — record user followed a platform
export async function recordSocialFollow(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { platform } = req.body
    if (!['instagram', 'facebook', 'tiktok'].includes(platform)) {
      res.status(400).json({ success: false, message: 'Platform must be instagram, facebook, or tiktok' }); return
    }
    await query(
      `INSERT INTO social_follows (user_id, platform) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      [req.user!.userId, platform]
    )
    res.json({ success: true, message: `${platform} follow recorded` })
  } catch (err) { next(err) }
}
