import { FlwPaymentPayload, FlwVerifyResponse } from '../types/index';

const BASE = 'https://api.flutterwave.com/v3';

function secretKey(): string {
  const k = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!k) throw new Error('FLUTTERWAVE_SECRET_KEY not set');
  return k;
}

export async function initiatePayment(
  payload: FlwPaymentPayload
): Promise<{ link: string | null; status: string; message: string }> {
  const res = await fetch(`${BASE}/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secretKey()}` },
    body: JSON.stringify(payload),
  });
  const json = (await res.json()) as { status: string; message: string; data?: { link: string } };
  if (!res.ok) throw new Error(`Flutterwave error ${res.status}: ${json.message}`);
  return { link: json.data?.link ?? null, status: json.status, message: json.message };
}

export async function verifyTransaction(txId: string | number): Promise<FlwVerifyResponse> {
  const res = await fetch(`${BASE}/transactions/${txId}/verify`, {
    headers: { Authorization: `Bearer ${secretKey()}` },
  });
  const json = (await res.json()) as FlwVerifyResponse;
  if (!res.ok) throw new Error(`Flutterwave verify error ${res.status}: ${json.message}`);
  return json;
}

export function checkWebhookSignature(signature: string | undefined): boolean {
  const secret = process.env.FLUTTERWAVE_WEBHOOK_SECRET;
  if (!secret) return true; // skip check if not configured
  return signature === secret;
}
