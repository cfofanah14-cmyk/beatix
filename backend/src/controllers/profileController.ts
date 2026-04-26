import { Request, Response } from 'express';
import { pool } from '../config/db';

// ─── Get Profile ──────────────────────────────────────────────────────────────
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, phone, avatar_url, role, created_at FROM users WHERE id = $1',
      [(req as any).user.id]
    );
    if (!result.rows.length) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── Update Profile ───────────────────────────────────────────────────────────
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, phone, email } = req.body;
    const result = await pool.query(
      `UPDATE users SET
        name = COALESCE($1, name),
        phone = COALESCE($2, phone),
        email = COALESCE($3, email),
        last_active = NOW()
       WHERE id = $4 RETURNING id, name, email, phone, avatar_url, role`,
      [name, phone, email, (req as any).user.id]
    );
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── Get Ticket History ───────────────────────────────────────────────────────
export const getTicketHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT t.id, t.qr_code, t.status, t.purchased_at, t.ticket_category,
              e.title AS event_title, e.date AS event_date,
              e.location AS event_location, e.image_url AS event_image
       FROM tickets t
       JOIN events e ON t.event_id = e.id
       WHERE t.user_id = $1
       ORDER BY t.purchased_at DESC`,
      [(req as any).user.id]
    );
    res.json({ success: true, tickets: result.rows });
  } catch (err) {
    console.error('Ticket history error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
