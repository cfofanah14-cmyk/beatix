export type UserRole = 'buyer' | 'organizer' | 'admin' | 'staff'
export type OrganizerStatus = 'pending' | 'approved' | 'suspended'
export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed'
export type TicketStatus = 'active' | 'used' | 'refunded' | 'cancelled'
export type TransactionStatus = 'pending' | 'success' | 'failed' | 'refunded'
export type PaymentMethod = 'afrimoney' | 'orange_money' | 'card'

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
