/**
 * BEATIX — Flutterwave Payment Service
 * ─────────────────────────────────────
 * All calls use TEST keys. No real money moves.
 * To go live: swap FLW_PUBLIC_KEY / FLW_SECRET_KEY to live keys in .env
 */

import { env } from '../config/env'

const FLW_BASE = 'https://api.flutterwave.com/v3'

interface FlwHeaders {
  'Content-Type': string
  Authorization: string
}

function headers(): FlwHeaders {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${env.flutterwave.secretKey}`,
  }
}

// ── Initiate a payment ────────────────────────────────────────────────────────
export interface InitiatePaymentParams {
  transactionId: string        // our internal TX id — used as tx_ref
  amount: number               // total buyer pays (subtotal + buyer fee share)
  currency: string             // 'SLE' for Sierra Leone Leone
  paymentMethod: 'afrimoney' | 'orange_money' | 'card'
  buyerPhone: string
  buyerName: string
  buyerEmail?: string
  eventTitle: string
  ticketCategoryName: string
  quantity: number
  redirectUrl: string
}

export interface InitiatePaymentResult {
  paymentLink: string          // URL to redirect buyer to
  flwTxRef: string             // same as our transactionId
}

export async function initiatePayment(params: InitiatePaymentParams): Promise<InitiatePaymentResult> {
  const {
    transactionId, amount, currency, paymentMethod,
    buyerPhone, buyerName, buyerEmail,
    eventTitle, ticketCategoryName, quantity,
    redirectUrl,
  } = params

  // In test mode Flutterwave uses test card numbers / mobile numbers
  const body: Record<string, any> = {
    tx_ref:       transactionId,
    amount:       amount.toFixed(2),
    currency,
    redirect_url: redirectUrl,
    meta: {
      transaction_id: transactionId,
      event_title:    eventTitle,
      category:       ticketCategoryName,
      quantity,
    },
    customer: {
      phone_number: buyerPhone,
      name:         buyerName,
      email:        buyerEmail || `${buyerPhone.replace('+', '')}@beatix.sl`,
    },
    customizations: {
      title:       'Beatix — Ticket Payment',
      description: `${quantity}× ${ticketCategoryName} — ${eventTitle}`,
      logo:        'https://beatix.sl/logo.png',
    },
  }

  // Payment-method-specific fields
  if (paymentMethod === 'card') {
    body.payment_options = 'card'
  } else if (paymentMethod === 'afrimoney') {
    body.payment_options = 'mobilemoneysierraleone'
    body.network         = 'AFRIMONEY'
  } else {
    body.payment_options = 'mobilemoneysierraleone'
    body.network         = 'ORANGE'
  }

  if (env.isDev) {
    // In dev: skip the real API call, return a fake hosted link
    console.log('\n💳 [FLW TEST] Payment initiated:', {
      tx_ref:  transactionId,
      amount,
      method:  paymentMethod,
      buyer:   buyerName,
    })
    return {
      paymentLink: `${env.frontendUrl}/checkout/verify?tx_ref=${transactionId}&status=successful&transaction_id=TEST_${Date.now()}`,
      flwTxRef:    transactionId,
    }
  }

  const res = await fetch(`${FLW_BASE}/payments`, {
    method:  'POST',
    headers: headers(),
    body:    JSON.stringify(body),
  })
  const data = await res.json()

  if (data.status !== 'success') {
    throw new Error(`Flutterwave initiation failed: ${data.message}`)
  }

  return {
    paymentLink: data.data.link,
    flwTxRef:    transactionId,
  }
}

// ── Verify a completed payment ────────────────────────────────────────────────
export interface VerifyPaymentResult {
  verified: boolean
  flwTransactionId: string
  amount: number
  currency: string
  status: string
  customerPhone: string
  txRef: string
}

export async function verifyPayment(flwTransactionId: string): Promise<VerifyPaymentResult> {
  if (env.isDev || flwTransactionId.startsWith('TEST_')) {
    console.log(`\n✅ [FLW TEST] Verifying transaction: ${flwTransactionId} → SUCCESSFUL`)
    return {
      verified:         true,
      flwTransactionId,
      amount:           0,    // not checked in test mode
      currency:         'SLE',
      status:           'successful',
      customerPhone:    '',
      txRef:            '',
    }
  }

  const res = await fetch(`${FLW_BASE}/transactions/${flwTransactionId}/verify`, {
    method:  'GET',
    headers: headers(),
  })
  const data = await res.json()

  if (data.status !== 'success' || data.data.status !== 'successful') {
    return {
      verified:         false,
      flwTransactionId,
      amount:           data.data?.amount || 0,
      currency:         data.data?.currency || '',
      status:           data.data?.status || 'failed',
      customerPhone:    data.data?.customer?.phone_number || '',
      txRef:            data.data?.tx_ref || '',
    }
  }

  return {
    verified:         true,
    flwTransactionId,
    amount:           data.data.amount,
    currency:         data.data.currency,
    status:           data.data.status,
    customerPhone:    data.data.customer.phone_number,
    txRef:            data.data.tx_ref,
  }
}

// ── Initiate a payout to mobile money or bank ─────────────────────────────────
export interface InitiatePayoutParams {
  reference:     string      // unique payout reference
  amount:        number
  currency:      string
  accountNumber: string      // mobile money number or bank account
  accountName:   string
  bankCode?:     string      // required for bank transfers
  narration:     string
}

export interface PayoutResult {
  success:   boolean
  reference: string
  message:   string
}

export async function initiatePayout(params: InitiatePayoutParams): Promise<PayoutResult> {
  if (env.isDev) {
    console.log('\n💸 [FLW TEST] Payout initiated:', params)
    return { success: true, reference: params.reference, message: 'TEST payout queued' }
  }

  const body = {
    account_bank:    params.bankCode || 'MPS',   // MPS = mobile money
    account_number:  params.accountNumber,
    amount:          params.amount,
    narration:       params.narration,
    currency:        params.currency,
    reference:       params.reference,
    beneficiary_name: params.accountName,
    debit_currency:  params.currency,
  }

  const res = await fetch(`${FLW_BASE}/transfers`, {
    method:  'POST',
    headers: headers(),
    body:    JSON.stringify(body),
  })
  const data = await res.json()

  return {
    success:   data.status === 'success',
    reference: params.reference,
    message:   data.message || 'Payout submitted',
  }
}

// ── Verify Flutterwave webhook signature ──────────────────────────────────────
export function verifyWebhookSignature(receivedHash: string): boolean {
  return receivedHash === env.flutterwave.webhookSecret
}
