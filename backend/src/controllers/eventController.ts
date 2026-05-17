import { Request, Response } from 'express';
import pool from '../db/client';
import { AuthRequest } from '../types';

// ─── List published events (public) ──────────────────────────────────────────
export const listEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, limit = '20', offset = '0' } = req.query as {
      search?: string;
      limit?: string;
      offset?: string;
    };

    let query = `
      SELECT e.*, u.full_name AS organizer_name,
             COUNT(tc.id) AS category_count
      FROM events e
      LEFT JOIN users u ON u.id = e.organizer_id
      LEFT JOIN ticket_categories tc ON tc.event_id = e.id
      WHERE e.status = 'published'
    `;
    const params: (string | number)[] = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (e.title ILIKE $${params.length} OR e.location ILIKE $${params.length})`;
    }

    query += ` GROUP BY e.id, u.full_name ORDER BY e.event_date ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const result = await pool.query(query, params);
    res.json({ events: result.rows });
  } catch (err) {
    console.error('[listEvents]', err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
};

// ─── Get single event (public) ────────────────────────────────────────────────
export const getEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const eventResult = await pool.query(
      `SELECT e.*, u.full_name AS organizer_name, u.email AS organizer_email
       FROM events e
       LEFT JOIN users u ON u.id = e.organizer_id
       WHERE e.id=$1`,
      [id]
    );

    if (!eventResult.rows[0]) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    const categoriesResult = await pool.query(
      'SELECT id, name, price, quantity, sold FROM ticket_categories WHERE event_id=$1',
      [id]
    );

    res.json({ event: eventResult.rows[0], categories: categoriesResult.rows });
  } catch (err) {
    console.error('[getEvent]', err);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
};

// ─── Create event (organizer/admin) ──────────────────────────────────────────
export const createEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, location, event_date, sales_end_date, banner_url, categories } =
      req.body as {
        title?: string;
        description?: string;
        location?: string;
        event_date?: string;
        sales_end_date?: string;
        banner_url?: string;
        categories?: Array<{ name: string; price: number; quantity: number }>;
      };

    if (!title || !event_date) {
      res.status(400).json({ error: 'title and event_date are required' });
      return;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const eventResult = await client.query(
        `INSERT INTO events (organizer_id, title, description, location, event_date, sales_end_date, banner_url, status, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'published',NOW(),NOW()) RETURNING *`,
        [req.user!.userId, title, description ?? null, location ?? null, event_date, sales_end_date ?? null, banner_url ?? null]
      );

      const event = eventResult.rows[0];

      if (categories && categories.length > 0) {
        for (const cat of categories) {
          await client.query(
            'INSERT INTO ticket_categories (event_id, name, price, quantity) VALUES ($1,$2,$3,$4)',
            [event.id, cat.name, cat.price, cat.quantity]
          );
        }
      }

      await client.query('COMMIT');
      res.status(201).json({ event });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('[createEvent]', err);
    res.status(500).json({ error: 'Failed to create event' });
  }
};

// ─── Update event (organizer who owns it, or admin) ───────────────────────────
export const updateEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, location, event_date, sales_end_date, banner_url, status } =
      req.body as {
        title?: string;
        description?: string;
        location?: string;
        event_date?: string;
        sales_end_date?: string;
        banner_url?: string;
        status?: string;
      };

    const check = await pool.query('SELECT organizer_id FROM events WHERE id=$1', [id]);
    if (!check.rows[0]) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    if (req.user!.role !== 'admin' && check.rows[0].organizer_id !== req.user!.userId) {
      res.status(403).json({ error: 'Not authorized to edit this event' });
      return;
    }

    const result = await pool.query(
      `UPDATE events SET
        title=COALESCE($1,title),
        description=COALESCE($2,description),
        location=COALESCE($3,location),
        event_date=COALESCE($4,event_date),
        sales_end_date=COALESCE($5,sales_end_date),
        banner_url=COALESCE($6,banner_url),
        status=COALESCE($7,status),
        updated_at=NOW()
       WHERE id=$8 RETURNING *`,
      [title ?? null, description ?? null, location ?? null, event_date ?? null, sales_end_date ?? null, banner_url ?? null, status ?? null, id]
    );

    res.json({ event: result.rows[0] });
  } catch (err) {
    console.error('[updateEvent]', err);
    res.status(500).json({ error: 'Failed to update event' });
  }
};

// ─── Delete event ─────────────────────────────────────────────────────────────
export const deleteEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const check = await pool.query('SELECT organizer_id FROM events WHERE id=$1', [id]);
    if (!check.rows[0]) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    if (req.user!.role !== 'admin' && check.rows[0].organizer_id !== req.user!.userId) {
      res.status(403).json({ error: 'Not authorized to delete this event' });
      return;
    }

    await pool.query('DELETE FROM events WHERE id=$1', [id]);
    res.json({ message: 'Event deleted' });
  } catch (err) {
    console.error('[deleteEvent]', err);
    res.status(500).json({ error: 'Failed to delete event' });
  }
};

// ─── Get organizer's own events ───────────────────────────────────────────────
export const getMyEvents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT e.*, COUNT(t.id) AS tickets_sold
       FROM events e
       LEFT JOIN tickets t ON t.event_id = e.id
       WHERE e.organizer_id=$1
       GROUP BY e.id
       ORDER BY e.created_at DESC`,
      [req.user!.userId]
    );
    res.json({ events: result.rows });
  } catch (err) {
    console.error('[getMyEvents]', err);
    res.status(500).json({ error: 'Failed to fetch your events' });
  }
};
