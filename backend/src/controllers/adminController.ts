import { Response } from 'express';
import { query } from '../db/client';
import { AuthRequest, UserRow, EventRow, FeeSettingRow } from '../types/index';

// ─── Dashboard stats ──────────────────────────────────────────────────────────
export async function getStats(_req: AuthRequest, res: Response): Promise<void> {
  try {
    const [users, events, tickets, revenue, today] = await Promise.all([
      query('SELECT COUNT(*) AS n FROM users'),
      query('SELECT COUNT(*) AS n FROM events'),
      query('SELECT COUNT(*) AS n FROM tickets'),
      query("SELECT COALESCE(SUM(amount),0) AS total FROM payments WHERE status='successful'"),
      query("SELECT COUNT(*) AS n FROM users WHERE created_at >= CURRENT_DATE"),
    ]);
    res.json({
      totalUsers:   parseInt(users.rows[0].n, 10),
      totalEvents:  parseInt(events.rows[0].n, 10),
      totalTickets: parseInt(tickets.rows[0].n, 10),
      totalRevenue: parseFloat(revenue.rows[0].total),
      newUsersToday: parseInt(today.rows[0].n, 10),
    });
  } catch (err) {
    console.error('[getStats]', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
}

// ─── User activity (last 30 days, daily count) ───────────────────────────────
export async function getUserActivity(_req: AuthRequest, res: Response): Promise<void> {
  try {
    const r = await query<{ day: Date; count: string }>(
      `SELECT DATE(created_at) AS day, COUNT(*) AS count
       FROM users WHERE created_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(created_at) ORDER BY day ASC`
    );
    res.json({ activity: r.rows });
  } catch (err) {
    console.error('[getUserActivity]', err);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
}

// ─── List all users ───────────────────────────────────────────────────────────
export async function listUsers(req: AuthRequest, res: Response): Promise<void> {
  const { search, limit = '50', offset = '0' } = req.query as Record<string, string>;
  try {
    const params: unknown[] = [];
    let where = '';
    if (search) {
      params.push(`%${search}%`);
      where = `WHERE full_name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1`;
    }
    params.push(parseInt(limit, 10), parseInt(offset, 10));
    const r = await query<UserRow>(
      `SELECT id,full_name,email,phone,role,auth_provider,created_at
       FROM users ${where} ORDER BY created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    const total = await query('SELECT COUNT(*) AS n FROM users');
    res.json({ users: r.rows, total: parseInt(total.rows[0].n, 10) });
  } catch (err) {
    console.error('[listUsers]', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
}

// ─── Set user role ────────────────────────────────────────────────────────────
export async function setUserRole(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { role } = req.body as { role?: string };
  if (!role || !['user','organizer','admin'].includes(role)) {
    res.status(400).json({ error: 'role must be user | organizer | admin' }); return;
  }
  try {
    const r = await query<UserRow>(
      'UPDATE users SET role=$1, updated_at=NOW() WHERE id=$2 RETURNING id,email,role',
      [role, id]
    );
    if (!r.rows[0]) { res.status(404).json({ error: 'User not found' }); return; }
    res.json({ success: true, user: r.rows[0] });
  } catch (err) {
    console.error('[setUserRole]', err);
    res.status(500).json({ error: 'Failed to update role' });
  }
}

// ─── List all events ──────────────────────────────────────────────────────────
export async function listAllEvents(_req: AuthRequest, res: Response): Promise<void> {
  try {
    const r = await query<EventRow & { organizer_name: string | null; tickets_sold: string }>(
      `SELECT e.*, u.full_name AS organizer_name, COUNT(t.id) AS tickets_sold
       FROM events e LEFT JOIN users u ON u.id=e.organizer_id LEFT JOIN tickets t ON t.event_id=e.id
       GROUP BY e.id, u.full_name ORDER BY e.created_at DESC`
    );
    res.json({ success: true, events: r.rows });
  } catch (err) {
    console.error('[listAllEvents]', err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
}

// ─── Delete any event ─────────────────────────────────────────────────────────
export async function deleteAnyEvent(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  try {
    const r = await query('DELETE FROM events WHERE id=$1 RETURNING id', [id]);
    if (!r.rows[0]) { res.status(404).json({ error: 'Event not found' }); return; }
    res.json({ message: 'Event deleted' });
  } catch (err) {
    console.error('[deleteAnyEvent]', err);
    res.status(500).json({ error: 'Failed to delete event' });
  }
}

// ─── Get fee settings ─────────────────────────────────────────────────────────
export async function getFeeSettings(_req: AuthRequest, res: Response): Promise<void> {
  try {
    const r = await query<FeeSettingRow>('SELECT * FROM fee_settings ORDER BY id ASC LIMIT 1');
    res.json({ settings: r.rows[0] ?? null });
  } catch (err) {
    console.error('[getFeeSettings]', err);
    res.status(500).json({ error: 'Failed to fetch fee settings' });
  }
}

// ─── Update fee settings ──────────────────────────────────────────────────────
export async function updateFeeSettings(req: AuthRequest, res: Response): Promise<void> {
  const { fee_percent, min_fee, currency } =
    req.body as { fee_percent?: number; min_fee?: number; currency?: string };
  if (fee_percent === undefined && min_fee === undefined && !currency) {
    res.status(400).json({ error: 'Provide at least one of: fee_percent, min_fee, currency' }); return;
  }
  try {
    const r = await query<FeeSettingRow>(
      `UPDATE fee_settings
       SET fee_percent=COALESCE($1,fee_percent), min_fee=COALESCE($2,min_fee),
           currency=COALESCE($3,currency), updated_at=NOW()
       WHERE id=(SELECT id FROM fee_settings ORDER BY id ASC LIMIT 1)
       RETURNING *`,
      [fee_percent ?? null, min_fee ?? null, currency ?? null]
    );
    res.json({ settings: r.rows[0] });
  } catch (err) {
    console.error('[updateFeeSettings]', err);
    res.status(500).json({ error: 'Failed to update fee settings' });
  }
}
