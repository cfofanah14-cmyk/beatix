import { query } from '../config/database';
import { Event, CreateEventBody, UpdateEventBody, PaginationMeta } from '../types';
import { AppError } from '../middleware/error.middleware';

export const getEvents = async (params: {
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
  search?: string;
  organizer_id?: string;
}): Promise<{ events: Event[]; meta: PaginationMeta }> => {
  const page = params.page || 1;
  const limit = Math.min(params.limit || 20, 100);
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (params.status) {
    conditions.push(`e.status = $${idx++}`);
    values.push(params.status);
  } else {
    conditions.push(`e.status = 'published'`);
  }

  if (params.category) {
    conditions.push(`e.category = $${idx++}`);
    values.push(params.category);
  }

  if (params.search) {
    conditions.push(`(e.title ILIKE $${idx} OR e.description ILIKE $${idx})`);
    values.push(`%${params.search}%`);
    idx++;
  }

  if (params.organizer_id) {
    conditions.push(`e.organizer_id = $${idx++}`);
    values.push(params.organizer_id);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await query(
    `SELECT COUNT(*) FROM events e ${whereClause}`,
    values
  );
  const total = parseInt(countResult.rows[0].count);

  const result = await query(
    `SELECT e.*, v.name as venue_name, v.city as venue_city,
            op.org_name as organizer_name
     FROM events e
     LEFT JOIN venues v ON e.venue_id = v.id
     LEFT JOIN organizer_profiles op ON e.organizer_id = op.id
     ${whereClause}
     ORDER BY e.starts_at ASC
     LIMIT $${idx} OFFSET $${idx + 1}`,
    [...values, limit, offset]
  );

  return {
    events: result.rows,
    meta: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  };
};

export const getEventById = async (id: string): Promise<Event> => {
  const result = await query(
    `SELECT e.*, v.name as venue_name, v.city as venue_city, v.address as venue_address,
            op.org_name as organizer_name, op.logo_url as organizer_logo
     FROM events e
     LEFT JOIN venues v ON e.venue_id = v.id
     LEFT JOIN organizer_profiles op ON e.organizer_id = op.id
     WHERE e.id = $1`,
    [id]
  );

  if (!result.rows[0]) throw new AppError('Event not found', 404);
  return result.rows[0];
};

export const createEvent = async (
  organizerId: string,
  body: CreateEventBody
): Promise<Event> => {
  const result = await query(
    `INSERT INTO events
       (organizer_id, venue_id, title, description, category, cover_image_url,
        starts_at, ends_at, timezone, is_online, stream_url, max_attendees)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING *`,
    [
      organizerId,
      body.venue_id || null,
      body.title,
      body.description || null,
      body.category || null,
      body.cover_image_url || null,
      body.starts_at,
      body.ends_at || null,
      body.timezone || 'Africa/Freetown',
      body.is_online || false,
      body.stream_url || null,
      body.max_attendees || null,
    ]
  );
  return result.rows[0];
};

export const updateEvent = async (
  id: string,
  organizerId: string,
  body: UpdateEventBody
): Promise<Event> => {
  const event = await getEventById(id);
  if (event.organizer_id !== organizerId) {
    throw new AppError('You do not own this event', 403);
  }

  const fields = Object.entries(body)
    .filter(([, v]) => v !== undefined)
    .map(([k], i) => `${k} = $${i + 2}`);

  if (fields.length === 0) return event;

  const values = Object.values(body).filter((v) => v !== undefined);

  const result = await query(
    `UPDATE events SET ${fields.join(', ')} WHERE id = $1 RETURNING *`,
    [id, ...values]
  );
  return result.rows[0];
};

export const deleteEvent = async (id: string, organizerId: string): Promise<void> => {
  const event = await getEventById(id);
  if (event.organizer_id !== organizerId) {
    throw new AppError('You do not own this event', 403);
  }
  await query('UPDATE events SET status = $1 WHERE id = $2', ['cancelled', id]);
};

export const getTicketTiers = async (eventId: string) => {
  const result = await query(
    'SELECT * FROM ticket_tiers WHERE event_id = $1 AND is_active = TRUE ORDER BY price ASC',
    [eventId]
  );
  return result.rows;
};

export const createTicketTier = async (eventId: string, body: {
  name: string;
  description?: string;
  price: number;
  currency?: string;
  quantity_total: number;
  sale_starts_at?: string;
  sale_ends_at?: string;
}) => {
  const result = await query(
    `INSERT INTO ticket_tiers
       (event_id, name, description, price, currency, quantity_total, sale_starts_at, sale_ends_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING *`,
    [
      eventId,
      body.name,
      body.description || null,
      body.price,
      body.currency || 'SLL',
      body.quantity_total,
      body.sale_starts_at || null,
      body.sale_ends_at || null,
    ]
  );
  return result.rows[0];
};
