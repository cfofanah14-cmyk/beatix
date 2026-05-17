import { Response } from 'express';
import pool from '../db/client';
import { AuthRequest } from '../types';

// ─── Dashboard stats ──────────────────────────────────────────────────────────
export const getDashboardStats = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [users, events, tickets, revenue, activeToday] = await Promise.all([
      pool.query('SELECT COUNT(*) AS count FROM users'),
      pool.query('SELECT COUNT(*) AS count FROM events'),
      pool.query('SELECT COUNT(*) AS count FROM tickets'),
      pool.query("SELECT COALESCE(SUM(amount),0) AS total FROM payments WHERE status='successful'"),
      pool.query(
        "SELECT COUNT(*) AS count FROM users WHERE DATE(created_at) = CURRENT_DATE"
      ),
    ]);

    res.json({
      totalUsers: parseInt(users.rows[0].count, 10),
      totalEvents: parseInt(events.rows[0].count, 10),
      totalTickets: parseInt(tickets.rows[0].count, 10),
      totalRevenue: parseFloat(revenue.rows[0].total),
      activeToday: parseInt(activeToday.rows[0].count, 10),
    });
  } catch (err) {
    console.error('[getDashboardStats]', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

// ─── List all users ───────────────────────────────────────────────────────────
export const listUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, limit = '50', offset = '0' } = req.query as {
      search?: string;
      limit?: string;
      offset?: string;
    };

    let query = `
      SELECT id, full_name, email, phone, role, auth_provider, created_at
      FROM users
    `;
    const params: (string | number)[] = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` WHERE (full_name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1)`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const result = await pool.query(query, params);
    const countResult = await pool.query('SELECT COUNT(*) AS count FROM users');

    res.json({ users: result.rows, total: parseInt(countResult.rows[0].count, 10) });
  } catch (err) {
    console.error('[listUsers]', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// ─── Update user role ─────────────────────────────────────────────────────────
export const updateUserRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { role } = req.body as { role?: string };

    if (!role || !['user', 'organizer', 'admin'].includes(role)) {
      res.status(400).json({ error: 'role must be one of: user, organizer, admin' });
      return;
    }

    const result = await pool.query(
      'UPDATE users SET role=$1, updated_at=NOW() WHERE id=$2 RETURNING id, email, role',
      [role, id]
    );

    if (!result.rows[0]) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('[updateUserRole]', err);
    res.status(500).json({ error: 'Failed to update user role' });
  }
};

// ─── List all events (admin view) ─────────────────────────────────────────────
export const listAllEvents = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT e.*, u.full_name AS organizer_name, COUNT(t.id) AS tickets_sold
       FROM events e
       LEFT JOIN users u ON u.id = e.organizer_id
       LEFT JOIN tickets t ON t.event_id = e.id
       GROUP BY e.id, u.full_name
       ORDER BY e.created_at DESC`
    );
    res.json({ events: result.rows });
  } catch (err) {
    console.error('[listAllEvents]', err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
};

// ─── Delete any event ─────────────────────────────────────────────────────────
export const adminDeleteEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM events WHERE id=$1 RETURNING id', [id]);

    if (!result.rows[0]) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    res.json({ message: 'Event deleted' });
  } catch (err) {
    console.error('[adminDeleteEvent]', err);
    res.status(500).json({ error: 'Failed to delete event' });
  }
};
