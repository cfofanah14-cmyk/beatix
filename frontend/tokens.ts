// ============================================
// BEATIX DESIGN TOKENS
// Single source of truth for all design values
// ============================================

export const colors = {
  navy: {
    DEFAULT: '#0D0B2B',
    mid:     '#1A1845',
    card:    '#13113A',
  },
  purple: {
    DEFAULT: '#6B2FA0',
    light:   '#A855D4',
  },
  gold: {
    DEFAULT: '#F5C842',
    dim:     '#D4A017',
  },
  white: '#FFFFFF',
  text: {
    primary:   'rgba(255,255,255,1)',
    secondary: 'rgba(255,255,255,0.6)',
    muted:     'rgba(255,255,255,0.35)',
  },
  border: {
    subtle: 'rgba(255,255,255,0.07)',
    dim:    'rgba(255,255,255,0.12)',
  },
} as const

export const fonts = {
  heading: "'Syne', sans-serif",
  body:    "'DM Sans', sans-serif",
} as const

export const radius = {
  sm:  '8px',
  md:  '12px',
  lg:  '16px',
  xl:  '20px',
  '2xl': '24px',
} as const

export const spacing = {
  pagePadding: '20px',
  cardPadding: '16px',
  gap:         '14px',
  navHeight:   '80px',
} as const

// Ticket categories
export const TICKET_CATEGORIES = ['VIP', 'Regular', 'Student', 'VVIP', 'Table'] as const
export type TicketCategory = typeof TICKET_CATEGORIES[number]

// Event categories
export const EVENT_CATEGORIES = ['All', 'Music', 'Sports', 'Comedy', 'Culture', 'Food', 'Business', 'Fashion', 'Tech'] as const
export type EventCategory = typeof EVENT_CATEGORIES[number]

// Payment methods
export const PAYMENT_METHODS = [
  { id: 'afrimoney',   label: 'Afrimoney',           sub: 'Mobile money · Instant' },
  { id: 'orange',      label: 'Orange Money',         sub: 'Mobile money · Instant' },
  { id: 'card',        label: 'Debit / Credit Card',  sub: 'Visa, Mastercard · via Flutterwave' },
] as const

// Sharing platforms
export const SHARE_PLATFORMS = ['WhatsApp', 'Instagram', 'Facebook', 'Snapchat', 'LinkedIn', 'X', 'TikTok', 'Telegram'] as const

// Beatix service fee rate (5%)
export const SERVICE_FEE_RATE = 0.05

// Currency
export const CURRENCY = 'NLe'
