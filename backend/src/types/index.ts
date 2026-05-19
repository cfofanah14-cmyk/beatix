import { Request } from 'express';

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthRequest extends Request {
  user?: TokenUser;
}

export interface TokenUser {
  userId: number;
  email: string;
  role: string;
}

export interface JwtPayload {
  userId: number;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// ─── DB row shapes ────────────────────────────────────────────────────────────

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
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface CategoryRow {
  id: number;
  event_id: number;
  name: string;
  price: string; // pg returns NUMERIC as string
  quantity: number;
  sold: number;
}

export interface TicketRow {
  id: number;
  user_id: number;
  event_id: number;
  category_id: number;
  qr_code: string;
  status: string;
  payment_ref: string | null;
  amount_paid: string; // pg NUMERIC -> string
  purchased_at: Date;
}

export interface PaymentRow {
  id: number;
  user_id: number;
  ticket_id: number | null;
  flutterwave_ref: string | null;
  amount: string;
  currency: string;
  status: string;
  created_at: Date;
}

export interface FeeSettingRow {
  id: number;
  fee_percent: string;
  min_fee: string;
  currency: string;
  updated_at: Date;
}

// ─── API shapes ───────────────────────────────────────────────────────────────

export interface PublicUser {
  id: number;
  full_name: string | null;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  role: string;
}

export interface FeeBreakdown {
  basePrice: number;
  platformFee: number;
  total: number;
  currency: string;
}

// ─── Flutterwave ──────────────────────────────────────────────────────────────

export interface FlwPaymentPayload {
  tx_ref: string;
  amount: number;
  currency: string;
  redirect_url: string;
  payment_options: string;
  customer: { email: string; phonenumber?: string; name?: string };
  customizations: { title: string; description?: string; logo?: string };
  meta?: Record<string, unknown>;
}

export interface FlwVerifyResponse {
  status: string;
  message: string;
  data: {
    id: number;
    tx_ref: string;
    flw_ref: string;
    amount: number;
    charged_amount: number;
    currency: string;
    status: string;
    payment_type: string;
    customer: { id: number; email: string; phone_number: string; name: string };
  };
}
