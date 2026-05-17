import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a unique QR code string for a ticket.
 * Format: BEATIX-<timestamp>-<uuid>
 */
export function generateQRCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const unique = uuidv4().replace(/-/g, '').toUpperCase().slice(0, 12);
  return `BEATIX-${timestamp}-${unique}`;
}
