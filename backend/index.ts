// ============================================================
// BEATIX — Shared TypeScript Types
// ============================================================

export type UserRole = 'buyer' | 'organizer' | 'admin' | 'staff'
export type OrganizerStatus = 'pending' | 'approved' | 'suspended'
export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed'
export type TicketStatus = 'active' | 'used' | 'refunded' | 'cancelled'
export type TransactionStatus = 'pending' | 'success' | 'failed' | 'refunded'
export type PaymentMethod = 'afrimoney' | 'orange_money' | 'card'
export type PayoutStatus = 'pending' | 'processing' | 'paid' | 'failed'

export interface User {
  id: string
  phone: string
  name?: string
  email?: string
  role: UserRole
  avatar_url?: string
  language: string
  is_active: boolean
  phone_verified: boolean
  last_login_at?: Date
  created_at: Date
  updated_at: Date
}

export interface Organizer {
  id: string
  user_id: string
  org_name: string
  description?: string
  logo_url?: string
  website?: string
  social_links: Record<string, string>
  status: OrganizerStatus
  verified_at?: Date
  bank_name?: string
  bank_account?: string
  mobile_money_number?: string
  total_earnings: number
  total_payouts: number
  created_at: Date
  updated_at: Date
}

export interface Event {
  id: string
  organizer_id: string
  title: string
  description?: string
  category: string
  cover_image_url?: string
  venue_name: string
  venue_address?: string
  city: string
  latitude?: number
  longitude?: number
  starts_at: Date
  ends_at?: Date
  sales_end_at?: Date
  status: EventStatus
  is_boosted: boolean
  boosted_until?: Date
  total_capacity?: number
  tickets_sold: number
  refund_policy?: string
  tags: string[]
  created_at: Date
  updated_at: Date
}

export interface TicketType {
  id: string
  event_id: string
  name: string
  description?: string
  price: number
  capacity: number
  sold: number
  sale_starts_at?: Date
  sale_ends_at?: Date
  sort_order: number
  is_active: boolean
  created_at: Date
}

export interface Transaction {
  id: string
  user_id?: string
  event_id: string
  ticket_type_id: string
  quantity: number
  unit_price: number
  subtotal: number
  service_fee: number
  discount_amount: number
  total_amount: number
  payment_method: PaymentMethod
  payment_reference?: string
  flw_transaction_id?: string
  status: TransactionStatus
  buyer_phone?: string
  buyer_name?: string
  paid_at?: Date
  created_at: Date
  updated_at: Date
}

export interface Ticket {
  id: string
  transaction_id: string
  event_id: string
  ticket_type_id: string
  user_id?: string
  ticket_number: string
  qr_code_data: string
  qr_code_image?: string
  status: TicketStatus
  scanned_at?: Date
  scanned_by?: string
  buyer_name?: string
  buyer_phone?: string
  created_at: Date
}

export interface JWTPayload {
  userId: string
  phone: string
  role: UserRole
  organizerId?: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
