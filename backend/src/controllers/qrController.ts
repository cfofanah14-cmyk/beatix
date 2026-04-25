import { Response, NextFunction } from 'express'
import { query } from '../config/database'
import { AuthRequest } from '../types'
import { AppError } from '../middleware/error.middleware'

// POST /api/qr/scan
export const scanTicket = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { qr_code } = req.body

    if (!qr_code || typeof qr_code !== 'string') {
      throw new AppError('qr_code is required', 400)
    }

    // Fetch ticket with event + tier + buyer info
    const result = await query(
      `SELECT
         t.id,
         t.qr_code,
         t.status,
         t.checked_in_at,
         u.first_name || ' ' || u.last_name AS buyer_name,
         e.title                             AS event_name,
         e.organizer_id,
         tt.name                             AS ticket_type
       FROM tickets t
       JOIN users        u  ON t.user_id        = u.id
       JOIN events       e  ON t.event_id        = e.id
       JOIN ticket_tiers tt ON t.ticket_tier_id  = tt.id
       WHERE t.qr_code = $1`,
      [qr_code.trim()]
    )

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        status: 'not_found',
        message: 'Ticket not found. Check the code and try again.',
      })
      return
    }

    const ticket = result.rows[0]

    // ── Access control — only organizer of this event or admin ──
    const scannerRole = req.user!.role
    const scannerId   = req.user!.userId

    if (scannerRole !== 'admin') {
      const orgCheck = await query(
        'SELECT id FROM organizer_profiles WHERE user_id = $1 AND id = $2',
        [scannerId, ticket.organizer_id]
      )
      if (orgCheck.rows.length === 0) {
        throw new AppError('You are not authorised to scan tickets for this event', 403)
      }
    }

    // ── Already used ─────────────────────────────────────────────
    if (ticket.status === 'used') {
      res.status(200).json({
        success: false,
        status: 'already_used',
        message: 'This ticket has already been scanned.',
        ticket: {
          eventName:    ticket.event_name,
          ticketType:   ticket.ticket_type,
          buyerName:    ticket.buyer_name,
          checkedInAt:  new Date(ticket.checked_in_at).toLocaleTimeString('en-GB', {
            hour: '2-digit', minute: '2-digit',
          }),
        },
      })
      return
    }

    // ── Cancelled / refunded ─────────────────────────────────────
    if (ticket.status !== 'valid') {
      res.status(200).json({
        success: false,
        status: 'rejected',
        message: `Ticket is ${ticket.status} and cannot be used for entry.`,
        ticket: {
          eventName:  ticket.event_name,
          ticketType: ticket.ticket_type,
          buyerName:  ticket.buyer_name,
        },
      })
      return
    }

    // ── Mark as used ─────────────────────────────────────────────
    await query(
      `UPDATE tickets
         SET status = 'used', checked_in_at = NOW()
       WHERE qr_code = $1`,
      [qr_code.trim()]
    )

    res.status(200).json({
      success: true,
      status: 'success',
      message: 'Entry approved!',
      ticket: {
        eventName:  ticket.event_name,
        ticketType: ticket.ticket_type,
        buyerName:  ticket.buyer_name,
      },
    })
  } catch (err) {
    next(err)
  }
}

// GET /api/qr/stats/:eventId  — live check-in stats for an event
export const getCheckInStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { eventId } = req.params

    const stats = await query(
      `SELECT
         COUNT(*)                                        AS total_tickets,
         COUNT(*) FILTER (WHERE status = 'used')        AS checked_in,
         COUNT(*) FILTER (WHERE status = 'valid')       AS remaining,
         COUNT(*) FILTER (WHERE status = 'cancelled')   AS cancelled
       FROM tickets
       WHERE event_id = $1`,
      [eventId]
    )

    res.json({ success: true, data: stats.rows[0] })
  } catch (err) {
    next(err)
  }
}
