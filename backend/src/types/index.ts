import { Request } from 'express';

// ─── Authenticated request ────────────────────────────────────────────────────
export interface AuthRequest extends Request {
  user?: {
    userId: number;
    email: string;
    role?: string;
  };
}

// ─── Database row shapes ──────────────────────────────────────────────────────
export interface UserRow {
  id: number;
  full_name: string | null;
  email: string;
  phone: string | null;
  password_hash: string | null;
  google_id: string | null;
  avatar_url: string | null;
  auth_provider: string;
  role: string;
  created_at: Date;
  updated_at: Date;
}

export interface EventRow {
  id: number;
  organizer_id: number;
  title: string;
  description: string | null;
  location: string | null;
  event_date: Date;
  sales_end_date: Date | null;
  banner_url: string | null;
  status: 'draft' | 'published' | 'cancelled';
  created_at: Date;
  updated_at: Date;
}

export interface TicketCategoryRow {
  id: number;
  event_id: number;
  name: string;
  price: number;
  quantity: number;
  sold: number;
  created_at: Date;
}

export interface TicketRow {
  id: number;
  user_id: number;
  event_id: number;
  category_id: number;
  qr_code: string;
  status: 'active' | 'used' | 'refunded';
  payment_ref: string | null;
  amount_paid: number;
  purchased_at: Date;
}

export interface PaymentRow {
  id: number;
  user_id: number;
  ticket_id: number | null;
  flutterwave_ref: string | null;
  amount: number;
  currency: string;
  status: 'pending' | 'successful' | 'failed';
  payment_method: string | null;
  created_at: Date;
}

// ─── API response shapes ──────────────────────────────────────────────────────
export interface PublicUser {
  id: number;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: string;
}

export interface JwtPayload {
  userId: number;
  email: string;
  role?: string;
  iat?: number;
  exp?: number;
}

// ─── Flutterwave types ────────────────────────────────────────────────────────
export interface FlutterwavePaymentPayload {
  amount: number;
  currency: string;
  email: string;
  phone_number?: string;
  fullname?: string;
  tx_ref: string;
  redirect_url: string;
  payment_options?: string;
  meta?: Record<string, unknown>;
  customer: {
    email: string;
    phonenumber?: string;
    name?: string;
  };
  customizations: {
    title: string;
    description?: string;
    logo?: string;
  };
}

export interface FlutterwaveVerifyResponse {
  status: string;
  message: string;
  data: {
    id: number;
    tx_ref: string;
    flw_ref: string;
    amount: number;
    currency: string;
    charged_amount: number;
    status: string;
    payment_type: string;
    customer: {
      id: number;
      email: string;
      phone_number: string;
      name: string;
    };
  };
}

// ─── Fee calculation ──────────────────────────────────────────────────────────
export interface FeeBreakdown {
  basePrice: number;
  platformFee: number;
  total: number;
  currency: string;
}
