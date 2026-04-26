import { Request, Response } from 'express';
import { pool } from '../config/db';

// ─── Get All Users ────────────────────────────────────────────────────────────
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search } = req.query;
    let query = `
      SELECT id, name, email, phone, role, created_at, last_active, avatar_url
      FROM users
    `;
    const params: string[] = [];

    if (search && typeof search === 'string') {
      query += ` WHERE name ILIKE $1 OR phone ILIKE $1`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY created_at DESC`;
    const result = await pool.query(query, params);
    res.json({ success: true, users: result.rows });
  } catch (err) {
    console.error('Admin get users error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
export const getDashboardStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [totalUsers, activeToday, newThisWeek, totalTickets] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query(`SELECT COUNT(*) FROM users WHERE last_active >= NOW() - INTERVAL '24 hours'`),
      pool.query(`SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '7 days'`),
      pool.query('SELECT COUNT(*) FROM tickets'),
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers: parseInt(totalUsers.rows[0].count, 10),
        activeToday: parseInt(activeToday.rows[0].count, 10),
        newThisWeek: parseInt(newThisWeek.rows[0].count, 10),
        totalTickets: parseInt(totalTickets.rows[0].count, 10),
      },
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
