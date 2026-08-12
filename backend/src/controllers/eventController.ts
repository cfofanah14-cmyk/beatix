import { Request, Response } from 'express';
import { query } from '../db/client';
import { AuthRequest, EventRow, CategoryRow } from '../types/index';

// ─── Public: list published events ───────────────────────────────────────────
export async function listEvents(req: Request, res: Response): Promise<void> {
  const { search, limit = '20', offset = '0' } = req.query as Record<string, string>;
  try {
    const params: unknown[] = [];
    let where = "WHERE e.status='published'";
    if (search) {
      params.push(`%${search}%`);
      where += ` AND (e.title ILIKE $${params.length} OR e.location ILIKE $${params.length})`;
    }
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const r = await query<EventRow & { organizer_name: string | null }>(
      `SELECT e.*, u.full_name AS organizer_name
       FROM events e LEFT JOIN users u ON u.id=e.organizer_id
       ${where} ORDER BY e.starts_at ASC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    res.json({ events: r.rows });
  } catch (err) {
    console.error('[listEvents]', err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
}

// ─── Public: single event with categories ────────────────────────────────────
export async function getEvent(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  try {
    const ev = await query<EventRow & { organizer_name: string | null }>(
      `SELECT e.*, u.full_name AS organizer_name
       FROM events e LEFT JOIN users u ON u.id=e.organizer_id WHERE e.id=$1`,
      [id]
    );
    if (!ev.rows[0]) { res.status(404).json({ error: 'Event not found' }); return; }
    const cats = await query<CategoryRow>(
      'SELECT id,name,price,quantity,sold FROM ticket_categories WHERE event_id=$1', [id]
    );
    res.json({ event: ev.rows[0], categories: cats.rows });
  } catch (err) {
    console.error('[getEvent]', err);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
}

// ─── Organizer: create event ──────────────────────────────────────────────────
export async function createEvent(req: AuthRequest, res: Response): Promise<void> {
  const { title, description, location, event_date, sales_end_date, banner_url, categories } =
    req.body as {
      title?: string; description?: string; location?: string;
      event_date?: string; sales_end_date?: string; banner_url?: string;
      categories?: Array<{ name: string; price: number; quantity: number }>;
    };
  if (!title || !event_date) {
    res.status(400).json({ error: 'title and event_date are required' }); return;
  }
  const client = await (await import('../db/client')).default.connect();
  try {
    await client.query('BEGIN');
    const ev = await client.query<EventRow>(
      `INSERT INTO events (organizer_id,title,description,location,starts_at,sales_end_date,
        banner_url,status,created_at,updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'published',NOW(),NOW()) RETURNING *`,
      [req.user!.userId, title, description ?? null, location ?? null,
       event_date, sales_end_date ?? null, banner_url ?? null]
    );
    const event = ev.rows[0];
    if (categories?.length) {
      for (const c of categories) {
        await client.query(
          'INSERT INTO ticket_categories (event_id,name,price,quantity) VALUES ($1,$2,$3,$4)',
          [event.id, c.name, c.price, c.quantity]
        );
      }
    }
    await client.query('COMMIT');
    res.status(201).json({ event });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[createEvent]', err);
    res.status(500).json({ error: 'Failed to create event' });
  } finally {
    client.release();
  }
}

// ─── Auth: update event (owner or admin) ────────────────────────────────────
export async function updateEvent(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { title, description, location, event_date, sales_end_date, banner_url, status } =
    req.body as Record<string, string | undefined>;
  try {
    const check = await query<{ organizer_id: number }>('SELECT organizer_id FROM events WHERE id=$1', [id]);
    if (!check.rows[0]) { res.status(404).json({ error: 'Event not found' }); return; }
    if (req.user!.role !== 'admin' && check.rows[0].organizer_id !== req.user!.userId) {
      res.status(403).json({ error: 'Not authorized' }); return;
    }
    const r = await query<EventRow>(
      `UPDATE events SET
         title=COALESCE($1,title), description=COALESCE($2,description),
         location=COALESCE($3,location), starts_at=COALESCE($4,event_date),
         sales_end_date=COALESCE($5,sales_end_date), banner_url=COALESCE($6,banner_url),
         status=COALESCE($7,status), updated_at=NOW()
       WHERE id=$8 RETURNING *`,
      [title ?? null, description ?? null, location ?? null, event_date ?? null,
       sales_end_date ?? null, banner_url ?? null, status ?? null, id]
    );
    res.json({ event: r.rows[0] });
  } catch (err) {
    console.error('[updateEvent]', err);
    res.status(500).json({ error: 'Failed to update event' });
  }
}

// ─── Auth: delete event ───────────────────────────────────────────────────────
export async function deleteEvent(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  try {
    const check = await query<{ organizer_id: number }>('SELECT organizer_id FROM events WHERE id=$1', [id]);
    if (!check.rows[0]) { res.status(404).json({ error: 'Event not found' }); return; }
    if (req.user!.role !== 'admin' && check.rows[0].organizer_id !== req.user!.userId) {
      res.status(403).json({ error: 'Not authorized' }); return;
    }
    await query('DELETE FROM events WHERE id=$1', [id]);
    res.json({ message: 'Event deleted' });
  } catch (err) {
    console.error('[deleteEvent]', err);
    res.status(500).json({ error: 'Failed to delete event' });
  }
}

// ─── Organizer: their own events ─────────────────────────────────────────────
export async function getMyEvents(req: AuthRequest, res: Response): Promise<void> {
  try {
    const r = await query<EventRow & { tickets_sold: string }>(
      `SELECT e.*, COUNT(t.id) AS tickets_sold
       FROM events e LEFT JOIN tickets t ON t.event_id=e.id
       WHERE e.organizer_id=$1 GROUP BY e.id ORDER BY e.created_at DESC`,
      [req.user!.userId]
    );
    res.json({ events: r.rows });
  } catch (err) {
    console.error('[getMyEvents]', err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
}
