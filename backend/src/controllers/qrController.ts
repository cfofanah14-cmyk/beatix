import { Request, Response, NextFunction } from 'express'
import { query } from '../db/client'
import { AuthRequest } from '../middleware/auth'
import { verifyQrToken } from '../services/qrService'

// POST /api/qr/scan  — scan a QR code at the door (staff/admin only)
export async function scanTicket(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token } = req.body
    if (!token) { res.status(400).json({ success: false, message: 'QR token required' }); return }

    // Decode and verify the QR token
    const decoded = verifyQrToken(token)
    if (!decoded) { res.status(400).json({ success: false, message: 'Invalid QR code' }); return }

    // Look up the ticket in the database
    const ticketRes = await query(`
      SELECT t.*, e.title AS event_title, e.id AS event_id_check,
             tt.name AS ticket_type_name,
             e.starts_at, e.ends_at
      FROM tickets t
      JOIN events e ON e.id = t.event_id
      JOIN ticket_types tt ON tt.id = t.ticket_type_id
      WHERE t.qr_code_data = $1
    `, [token])

    if (ticketRes.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Ticket not found', scanResult: 'INVALID' }); return
    }

    const ticket = ticketRes.rows[0]

    // Check if already scanned
    if (ticket.status === 'used') {
      res.status(400).json({
        success: false,
        message: 'Ticket already scanned',
        scanResult: 'ALREADY_USED',
        scannedAt: ticket.scanned_at,
      }); return
    }

    // Check if ticket is cancelled/refunded
    if (ticket.status !== 'active') {
      res.status(400).json({
        success: false,
        message: `Ticket is ${ticket.status}`,
        scanResult: 'INVALID',
      }); return
    }

    // Verify the scanner has access to this event
    const staffCheck = await query(`
      SELECT s.id FROM staff s
      JOIN organizers o ON o.id = s.organizer_id
      JOIN events e ON e.organizer_id = o.id
      WHERE s.user_id = $1 AND e.id = $2
      UNION
      SELECT id FROM users WHERE id = $1 AND role = 'admin'
    `, [req.user!.userId, ticket.event_id])

    if (staffCheck.rows.length === 0) {
      res.status(403).json({ success: false, message: 'Not authorized to scan for this event' }); return
    }

    // Mark ticket as used — single use only
    await query(
      "UPDATE tickets SET status='used', scanned_at=NOW(), scanned_by=$1 WHERE id=$2",
      [req.user!.userId, ticket.id]
    )

    res.json({
      success: true,
      scanResult: 'VALID',
      data: {
        ticketNumber: ticket.ticket_number,
        eventTitle: ticket.event_title,
        ticketType: ticket.ticket_type_name,
        buyerName: ticket.buyer_name,
        scannedAt: new Date().toISOString(),
      },
    })
  } catch (err) { next(err) }
}

// GET /api/qr/ticket/:ticketNumber  — look up ticket by number (for manual entry)
export async function lookupByNumber(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const ticketRes = await query(`
      SELECT t.id, t.ticket_number, t.status, t.buyer_name, t.buyer_phone, t.scanned_at,
             e.title AS event_title, tt.name AS ticket_type_name
      FROM tickets t
      JOIN events e ON e.id = t.event_id
      JOIN ticket_types tt ON tt.id = t.ticket_type_id
      WHERE t.ticket_number = $1
    `, [req.params.ticketNumber.toUpperCase()])

    if (ticketRes.rows.length === 0) { res.status(404).json({ success: false, message: 'Ticket not found' }); return }
    res.json({ success: true, data: ticketRes.rows[0] })
  } catch (err) { next(err) }
}
