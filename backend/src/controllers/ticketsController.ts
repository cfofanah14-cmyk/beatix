import { Request, Response, NextFunction } from 'express'
import { query } from '../db/client'
import { AuthRequest } from '../middleware/auth'

// GET /api/tickets/my  — buyer's ticket history
export async function getMyTickets(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const ticketsRes = await query(`
      SELECT
        t.id, t.ticket_number, t.status, t.qr_code_image, t.created_at, t.scanned_at,
        e.title AS event_title, e.starts_at, e.venue_name, e.city, e.cover_image_url,
        tt.name AS ticket_type_name,
        tx.total_amount, tx.payment_method, tx.buyer_name, tx.buyer_phone,
        tx.unit_price, tx.quantity
      FROM tickets t
      JOIN transactions tx ON tx.id = t.transaction_id
      JOIN events e ON e.id = t.event_id
      JOIN ticket_types tt ON tt.id = t.ticket_type_id
      WHERE t.user_id = $1
      ORDER BY t.created_at DESC
    `, [req.user!.userId])

    res.json({ success: true, data: ticketsRes.rows })
  } catch (err) { next(err) }
}

// GET /api/tickets/:id  — single ticket detail with QR
export async function getTicket(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const ticketRes = await query(`
      SELECT
        t.*, e.title AS event_title, e.starts_at, e.ends_at, e.venue_name,
        e.venue_address, e.city, e.cover_image_url,
        tt.name AS ticket_type_name, tt.description AS ticket_type_desc,
        tx.total_amount, tx.payment_method, tx.buyer_name, tx.buyer_phone,
        tx.service_fee, tx.discount_amount, tx.paid_at,
        o.org_name AS organizer_name
      FROM tickets t
      JOIN transactions tx ON tx.id = t.transaction_id
      JOIN events e ON e.id = t.event_id
      JOIN ticket_types tt ON tt.id = t.ticket_type_id
      JOIN organizers o ON o.id = e.organizer_id
      WHERE t.id = $1 AND (t.user_id = $2 OR $3 = 'admin')
    `, [req.params.id, req.user!.userId, req.user!.role])

    if (ticketRes.rows.length === 0) { res.status(404).json({ success: false, message: 'Ticket not found' }); return }
    res.json({ success: true, data: ticketRes.rows[0] })
  } catch (err) { next(err) }
}

// GET /api/tickets/transaction/:txId  — all tickets for a transaction
export async function getTicketsByTransaction(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const ticketsRes = await query(`
      SELECT t.*, tt.name AS ticket_type_name, e.title AS event_title, e.starts_at, e.venue_name
      FROM tickets t
      JOIN ticket_types tt ON tt.id = t.ticket_type_id
      JOIN events e ON e.id = t.event_id
      WHERE t.transaction_id = $1 AND (t.user_id = $2 OR $3 = 'admin')
      ORDER BY t.created_at ASC
    `, [req.params.txId, req.user!.userId, req.user!.role])

    res.json({ success: true, data: ticketsRes.rows })
  } catch (err) { next(err) }
}
