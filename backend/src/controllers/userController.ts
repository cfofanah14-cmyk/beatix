import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db/client';
import { AuthRequest, UserRow, TicketRow } from '../types/index';

export async function getProfile(req: AuthRequest, res: Response): Promise<void> {
  try {
    const r = await query<UserRow>(
      'SELECT id,full_name,email,phone,avatar_url,role,created_at FROM users WHERE id=$1',
      [req.user!.userId]
    );
    if (!r.rows[0]) { res.status(404).json({ error: 'User not found' }); return; }
    res.json({ success: true, user: r.rows[0] });
  } catch (err) {
    console.error('[getProfile]', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
}

export async function updateProfile(req: AuthRequest, res: Response): Promise<void> {
  const { full_name, phone } = req.body as { full_name?: string; phone?: string };
  try {
    const r = await query<UserRow>(
      `UPDATE users SET full_name=COALESCE($1,full_name), phone=COALESCE($2,phone), updated_at=NOW()
       WHERE id=$3 RETURNING id,full_name,email,phone,avatar_url,role`,
      [full_name ?? null, phone ?? null, req.user!.userId]
    );
    res.json({ success: true, user: r.rows[0] });
  } catch (err) {
    console.error('[updateProfile]', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
}

export async function changePassword(req: AuthRequest, res: Response): Promise<void> {
  const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'currentPassword and newPassword required' }); return;
  }
  try {
    const r = await query<UserRow>('SELECT password_hash FROM users WHERE id=$1', [req.user!.userId]);
    const user = r.rows[0];
    if (!user?.password_hash) { res.status(400).json({ error: 'No password on this account' }); return; }
    if (!await bcrypt.compare(currentPassword, user.password_hash)) {
      res.status(401).json({ error: 'Current password incorrect' }); return;
    }
    await query('UPDATE users SET password_hash=$1, updated_at=NOW() WHERE id=$2',
      [await bcrypt.hash(newPassword, 12), req.user!.userId]);
    res.json({ message: 'Password updated' });
  } catch (err) {
    console.error('[changePassword]', err);
    res.status(500).json({ error: 'Failed to change password' });
  }
}

export async function getMyTickets(req: AuthRequest, res: Response): Promise<void> {
  try {
    const r = await query<TicketRow & {
      event_title: string; event_date: Date; event_location: string | null;
      sales_end_date: Date | null; category_name: string;
    }>(
      `SELECT t.id, t.qr_code, t.status, t.amount_paid, t.purchased_at,
              e.title AS event_title, e.event_date, e.location AS event_location,
              e.sales_end_date, tc.name AS category_name
       FROM tickets t
       JOIN events e ON e.id=t.event_id
       JOIN ticket_categories tc ON tc.id=t.category_id
       WHERE t.user_id=$1
       ORDER BY t.purchased_at DESC`,
      [req.user!.userId]
    );
    res.json({ success: true, tickets: r.rows });
  } catch (err) {
    console.error('[getMyTickets]', err);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
}
