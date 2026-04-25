/**
 * BEATIX — SMS Service (Twilio)
 * ─────────────────────────────
 * Uses Twilio TEST credentials in development.
 * Test magic numbers:
 *   Valid "sent":  +15005550006
 *   Invalid:       +15005550001
 * No real SMS is sent in test mode.
 * To go live: set real TWILIO_ACCOUNT_SID / AUTH_TOKEN / PHONE_NUMBER in .env
 */

import twilio from 'twilio'
import { env } from '../config/env'

let _client: twilio.Twilio | null = null

function getClient(): twilio.Twilio {
  if (!_client) {
    if (!env.twilio.accountSid || !env.twilio.authToken) {
      throw new Error('Twilio credentials not configured in .env')
    }
    _client = twilio(env.twilio.accountSid, env.twilio.authToken)
  }
  return _client
}

export async function sendSms(to: string, body: string): Promise<void> {
  if (env.isDev) {
    console.log(`\n📱 [SMS TEST] To: ${to}\n   Msg: ${body}\n`)
    return
  }
  try {
    await getClient().messages.create({
      body,
      from: env.twilio.phoneNumber,
      to,
    })
  } catch (err: any) {
    // Never throw — SMS failure must not break the purchase flow
    console.error(`SMS failed to ${to}:`, err.message)
  }
}

// ── Specific message templates ────────────────────────────────────────────────

export async function sendOtpSms(phone: string, code: string, expiryMins: number): Promise<void> {
  await sendSms(phone,
    `Your Beatix code: ${code}. Valid ${expiryMins} mins. Do not share.`
  )
}

export async function sendTicketConfirmation(
  phone: string, eventTitle: string, ticketNumber: string, quantity: number
): Promise<void> {
  await sendSms(phone,
    `BEATIX ✅ ${quantity}x "${eventTitle}" confirmed! Ref: ${ticketNumber}. Show QR at entrance. beatix.sl`
  )
}

export async function sendPaymentFailed(phone: string, eventTitle: string): Promise<void> {
  await sendSms(phone,
    `BEATIX: Payment for "${eventTitle}" failed. No ticket issued. Try again at beatix.sl`
  )
}

export async function sendEventReminder(
  phone: string, eventTitle: string, timeDesc: string
): Promise<void> {
  await sendSms(phone,
    `BEATIX 🎉 Reminder: "${eventTitle}" is ${timeDesc}! Have your QR code ready. See you there!`
  )
}

export async function sendEventCancellation(phone: string, eventTitle: string): Promise<void> {
  await sendSms(phone,
    `BEATIX: "${eventTitle}" has been cancelled. Full refund in 3-5 business days. Help: support@beatix.sl`
  )
}

export async function sendPayoutNotification(phone: string, amount: number): Promise<void> {
  await sendSms(phone,
    `BEATIX 💰 Payout of NLe ${amount.toFixed(2)} is being processed to your account. beatix.sl`
  )
}
