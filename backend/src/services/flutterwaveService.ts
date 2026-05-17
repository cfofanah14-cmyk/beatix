import { FlutterwavePaymentPayload, FlutterwaveVerifyResponse } from '../types';

const FLW_BASE_URL = 'https://api.flutterwave.com/v3';

function getSecretKey(): string {
  const key = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!key) throw new Error('FLUTTERWAVE_SECRET_KEY is not set');
  return key;
}

// ─── Initiate a payment ───────────────────────────────────────────────────────
export async function initiatePayment(payload: FlutterwavePaymentPayload): Promise<{
  status: string;
  message: string;
  data: { link: string } | null;
}> {
  const response = await fetch(`${FLW_BASE_URL}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getSecretKey()}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Flutterwave initiate failed: ${response.status} — ${error}`);
  }

  const json = (await response.json()) as {
    status: string;
    message: string;
    data: { link: string } | null;
  };

  return json;
}

// ─── Verify a completed transaction by ID ────────────────────────────────────
export async function verifyTransaction(transactionId: string | number): Promise<FlutterwaveVerifyResponse> {
  const response = await fetch(`${FLW_BASE_URL}/transactions/${transactionId}/verify`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Flutterwave verify failed: ${response.status} — ${error}`);
  }

  const json = (await response.json()) as FlutterwaveVerifyResponse;
  return json;
}

// ─── Verify webhook signature ────────────────────────────────────────────────
export function verifyWebhookSignature(signature: string | undefined): boolean {
  const secret = process.env.FLUTTERWAVE_WEBHOOK_SECRET;
  if (!secret) {
    console.warn('[flutterwaveService] FLUTTERWAVE_WEBHOOK_SECRET not set — skipping verification');
    return true;
  }
  return signature === secret;
}

// ─── Build a standard payment payload for Beatix ticket purchase ─────────────
export function buildPaymentPayload(params: {
  amount: number;
  currency: string;
  email: string;
  fullName: string;
  phone?: string;
  txRef: string;
  redirectUrl: string;
  eventTitle: string;
}): FlutterwavePaymentPayload {
  return {
    amount: params.amount,
    currency: params.currency,
    email: params.email,
    phone_number: params.phone,
    fullname: params.fullName,
    tx_ref: params.txRef,
    redirect_url: params.redirectUrl,
    payment_options: 'card,mobilemoney',
    customer: {
      email: params.email,
      phonenumber: params.phone,
      name: params.fullName,
    },
    customizations: {
      title: 'Beatix',
      description: `Ticket for ${params.eventTitle}`,
      logo: 'https://beatix.vercel.app/logo.png',
    },
  };
}
