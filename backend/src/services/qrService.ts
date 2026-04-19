import QRCode from 'qrcode'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
dotenv.config()

// Generate a signed QR token that encodes the ticket data
export function generateQrToken(ticketId: string, eventId: string, ticketNumber: string): string {
  return jwt.sign(
    { ticketId, eventId, ticketNumber, type: 'beatix-ticket' },
    process.env.JWT_SECRET!,
    { noTimestamp: true } // QR codes don't expire — status is managed in DB
  )
}

// Generate QR code as base64 PNG image
export async function generateQrImage(token: string): Promise<string> {
  const url = `${process.env.QR_BASE_URL || 'https://beatix.sl/scan'}?t=${token}`
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 400,
    color: { dark: '#0D0B2B', light: '#FFFFFF' },
  })
}

// Verify and decode a QR token
export function verifyQrToken(token: string): { ticketId: string; eventId: string; ticketNumber: string } | null {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as any
    if (payload.type !== 'beatix-ticket') return null
    return { ticketId: payload.ticketId, eventId: payload.eventId, ticketNumber: payload.ticketNumber }
  } catch {
    return null
  }
}

// Generate unique ticket number: BTX-YYYY-XXX-NNNNN
export function generateTicketNumber(eventCode = 'EVT'): string {
  const year = new Date().getFullYear()
  const rand = Math.floor(10000 + Math.random() * 90000)
  return `BTX-${year}-${eventCode.toUpperCase().slice(0, 3)}-${rand}`
}
