import { v4 as uuidv4 } from 'uuid';

/** Generate a unique, URL-safe QR code string for a ticket. */
export function generateQRCode(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = uuidv4().replace(/-/g, '').toUpperCase().slice(0, 10);
  return `BX-${ts}-${rand}`;
}
