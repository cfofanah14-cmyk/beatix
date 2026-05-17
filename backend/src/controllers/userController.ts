import { Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db/client';
import { AuthRequest } from '../types';

// ─── Get profile ──────────────────────────────────────────────────────────────
export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT id, full_name, email, phone, avatar_url, role, created_at FROM users WHERE id=$1',
      [req.user!.userId]
    );
    if (!result.rows[0]) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('[getProfile]', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

// ─── Update profile ───────────────────────────────────────────────────────────
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { full_name, phone } = req.body as { full_name?: string; phone?: string };

    const result = await pool.query(
      `UPDATE users SET full_name=COALESCE($1, full_name), phone=COALESCE($2, phone), updated_at=NOW()
       WHERE id=$3 RETURNING id, full_name, email, phone, avatar_url, role`,
      [full_name ?? null, phone ?? null, req.user!.userId]
    );

    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('[updateProfile]', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// ─── Change password ──────────────────────────────────────────────────────────
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body as {
      currentPassword?: string;
      newPassword?: string;
    };

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'currentPassword and newPassword are required' });
      return;
    }

    const result = await pool.query('SELECT password_hash FROM users WHERE id=$1', [req.user!.userId]);
    const user = result.rows[0];

    if (!user?.password_hash) {
      res.status(400).json({ error: 'No password set on this account' });
      return;
    }

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) {
      res.status(401).json({ error: 'Current password is incorrect' });
      return;
    }

    const hash = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE users SET password_hash=$1, updated_at=NOW() WHERE id=$2', [hash, req.user!.userId]);

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('[changePassword]', err);
    res.status(500).json({ error: 'Failed to change password' });
  }
};

// ─── Get user's ticket history ────────────────────────────────────────────────
export const getMyTickets = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT t.id, t.qr_code, t.status, t.amount_paid, t.purchased_at,
              e.title AS event_title, e.event_date, e.location AS event_location,
              e.sales_end_date, tc.name AS category_name
       FROM tickets t
       JOIN events e ON e.id = t.event_id
       JOIN ticket_categories tc ON tc.id = t.category_id
       WHERE t.user_id=$1
       ORDER BY t.purchased_at DESC`,
      [req.user!.userId]
    );
    res.json({ tickets: result.rows });
  } catch (err) {
    console.error('[getMyTickets]', err);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
};
