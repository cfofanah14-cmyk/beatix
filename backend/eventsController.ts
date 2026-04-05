import { Request, Response, NextFunction } from 'express'
import { validationResult } from 'express-validator'
import { query, withTransaction } from '../db/client'
import { AuthRequest } from '../middleware/auth'
import { sendSms } from '../services/smsService'

// GET /api/events
export async function listEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      page = '1',
      limit = '20',
      category,
      city,
      search,
      from,
      to,
      minPrice,
      maxPrice,
    } = req.query as Record<string, string>

    const offset = (Number(page) - 1) * Number(limit)
    const params: any[] = []
    const conditions: string[] = ["e.status = 'published'", 'e.starts_at > NOW()']

    if (category && category !== 'All') {
      params.push(category)
      conditions.push(`e.category = $${params.length}`)
    }
    if (city) {
      params.push(`%${city}%`)
      conditions.push(`e.city ILIKE $${params.length}`)
    }
    if (search) {
      params.push(`%${search}%`)
      conditions.push(`(e.title ILIKE $${params.length} OR e.description ILIKE $${params.length})`)
    }
    if (from) {
      params.push(from)
      conditions.push(`e.starts_at >= $${params.length}`)
    }
    if (to) {
      params.push(to)
      conditions.push(`e.starts_at <= $${params.length}`)
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const countRes = await query(
      `SELECT COUNT(*) FROM events e ${whereClause}`,
      params
    )
    const total = Number(countRes.rows[0].count)

    params.push(Number(limit), offset)
    const eventsRes = await query(`
      SELECT
        e.id, e.title, e.category, e.cover_image_url,
        e.venue_name, e.city, e.starts_at, e.status,
        e.is_boosted, e.tickets_sold, e.total_capacity,
        o.org_name AS organizer_name, o.id AS organizer_id,
        MIN(tt.price) AS min_price,
        MAX(tt.price) AS max_price
      FROM events e
      JOIN organizers o ON o.id = e.organizer_id
      LEFT JOIN ticket_types tt ON tt.event_id = e.id AND tt.is_active = TRUE
      ${whereClause}
      GROUP BY e.id, o.id, o.org_name
      ORDER BY e.is_boosted DESC, e.starts_at ASC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params)

    res.json({
      success: true,
      data: eventsRes.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    })
  } catch (err) {
    next(err)
  }
}

// GET /api/events/:id
export async function getEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params
    const eventRes = await query(`
      SELECT
        e.*,
        o.org_name AS organizer_name,
        o.id AS organizer_id,
        o.logo_url AS organizer_logo,
        o.status AS organizer_status
      FROM events e
      JOIN organizers o ON o.id = e.organizer_id
      WHERE e.id = $1
    `, [id])

    if (eventRes.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Event not found' })
      return
    }

    const ticketTypesRes = await query(
      'SELECT * FROM ticket_types WHERE event_id = $1 AND is_active = TRUE ORDER BY sort_order ASC',
      [id]
    )

    res.json({
      success: true,
      data: { ...eventRes.rows[0], ticket_types: ticketTypesRes.rows },
    })
  } catch (err) {
    next(err)
  }
}

// GET /api/events/:id/ticket-types
export async function getTicketTypes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const res2 = await query(
      'SELECT * FROM ticket_types WHERE event_id = $1 AND is_active = TRUE ORDER BY sort_order ASC',
      [req.params.id]
    )
    res.json({ success: true, data: res2.rows })
  } catch (err) {
    next(err)
  }
}

// POST /api/events
export async function createEvent(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() })
      return
    }

    const orgRes = await query(
      'SELECT id, status FROM organizers WHERE user_id = $1',
      [req.user!.userId]
    )
    if (orgRes.rows.length === 0 || orgRes.rows[0].status !== 'approved') {
      res.status(403).json({ success: false, message: 'Organizer not approved' })
      return
    }

    const {
      title, description, category, cover_image_url,
      venue_name, venue_address, city, latitude, longitude,
      starts_at, ends_at, sales_end_at, total_capacity, refund_policy, tags,
    } = req.body

    const evRes = await query(`
      INSERT INTO events (
        organizer_id, title, description, category, cover_image_url,
        venue_name, venue_address, city, latitude, longitude,
        starts_at, ends_at, sales_end_at, total_capacity, refund_policy, tags
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      RETURNING *
    `, [
      orgRes.rows[0].id, title, description, category, cover_image_url,
      venue_name, venue_address, city || 'Freetown', latitude, longitude,
      starts_at, ends_at, sales_end_at, total_capacity, refund_policy, tags || [],
    ])

    res.status(201).json({ success: true, data: evRes.rows[0] })
  } catch (err) {
    next(err)
  }
}

// PUT /api/events/:id
export async function updateEvent(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params

    // Ensure organizer owns this event
    const check = await query(
      'SELECT e.id FROM events e JOIN organizers o ON o.id = e.organizer_id WHERE e.id = $1 AND (o.user_id = $2 OR $3 = \'admin\')',
      [id, req.user!.userId, req.user!.role]
    )
    if (check.rows.length === 0) {
      res.status(403).json({ success: false, message: 'Not authorized' })
      return
    }

    const fields = [
      'title','description','category','cover_image_url',
      'venue_name','venue_address','city','starts_at','ends_at',
      'sales_end_at','total_capacity','refund_policy','tags',
    ]
    const updates: string[] = []
    const params: any[] = []
    fields.forEach(f => {
      if (req.body[f] !== undefined) {
        params.push(req.body[f])
        updates.push(`${f} = $${params.length}`)
      }
    })

    if (updates.length === 0) {
      res.status(400).json({ success: false, message: 'No fields to update' })
      return
    }

    params.push(id)
    const updated = await query(
      `UPDATE events SET ${updates.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    )
    res.json({ success: true, data: updated.rows[0] })
  } catch (err) {
    next(err)
  }
}

// POST /api/events/:id/publish
export async function publishEvent(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params
    await query(
      "UPDATE events SET status = 'published' WHERE id = $1",
      [id]
    )
    res.json({ success: true, message: 'Event published' })
  } catch (err) {
    next(err)
  }
}

// POST /api/events/:id/cancel
export async function cancelEvent(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params

    await withTransaction(async (client) => {
      await client.query("UPDATE events SET status = 'cancelled' WHERE id = $1", [id])

      // Notify all buyers via SMS
      const buyersRes = await client.query(`
        SELECT DISTINCT t.buyer_phone, e.title
        FROM transactions t
        JOIN events e ON e.id = t.event_id
        WHERE t.event_id = $1 AND t.status = 'success'
        AND t.buyer_phone IS NOT NULL
      `, [id])

      for (const buyer of buyersRes.rows) {
        await sendSms(
          buyer.buyer_phone,
          `BEATIX: "${buyer.title}" has been cancelled. You will receive a full refund within 3-5 business days.`
        )
      }
    })

    res.json({ success: true, message: 'Event cancelled and buyers notified' })
  } catch (err) {
    next(err)
  }
}

// POST /api/events/:id/ticket-types
export async function addTicketType(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() })
      return
    }

    const { name, description, price, capacity, sale_starts_at, sale_ends_at, sort_order } = req.body
    const ttRes = await query(`
      INSERT INTO ticket_types (event_id, name, description, price, capacity, sale_starts_at, sale_ends_at, sort_order)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *
    `, [req.params.id, name, description, price, capacity, sale_starts_at, sale_ends_at, sort_order || 0])

    res.status(201).json({ success: true, data: ttRes.rows[0] })
  } catch (err) {
    next(err)
  }
}

// PUT /api/events/:id/ticket-types/:typeId
export async function updateTicketType(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { typeId } = req.params
    const { name, description, price, capacity, is_active } = req.body
    const updated = await query(`
      UPDATE ticket_types SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        price = COALESCE($3, price),
        capacity = COALESCE($4, capacity),
        is_active = COALESCE($5, is_active)
      WHERE id = $6 RETURNING *
    `, [name, description, price, capacity, is_active, typeId])
    res.json({ success: true, data: updated.rows[0] })
  } catch (err) {
    next(err)
  }
}

// POST /api/events/:id/discount-codes
export async function createDiscountCode(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { code, discount_pct, max_uses, expires_at } = req.body
    const dcRes = await query(`
      INSERT INTO discount_codes (event_id, code, discount_pct, max_uses, expires_at)
      VALUES ($1,$2,$3,$4,$5) RETURNING *
    `, [req.params.id, code.toUpperCase(), discount_pct, max_uses, expires_at])
    res.status(201).json({ success: true, data: dcRes.rows[0] })
  } catch (err) {
    next(err)
  }
}

// POST /api/events/:id/boost
export async function boostEvent(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { days = 7 } = req.body
    const boostedUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
    await query(
      'UPDATE events SET is_boosted = true, boosted_until = $1 WHERE id = $2',
      [boostedUntil, req.params.id]
    )
    res.json({ success: true, message: `Event boosted for ${days} days` })
  } catch (err) {
    next(err)
  }
}
