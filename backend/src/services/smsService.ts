import twilio from 'twilio'
import dotenv from 'dotenv'
dotenv.config()

let client: twilio.Twilio | null = null

function getClient(): twilio.Twilio {
  if (!client) {
    client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!)
  }
  return client
}

export async function sendSms(to: string, body: string): Promise<void> {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[SMS DEV] To: ${to} | Message: ${body}`)
    return
  }
  try {
    await getClient().messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER!,
      to,
    })
  } catch (err: any) {
    console.error('SMS send failed:', err.message)
    // Don't throw — SMS failure should not block the main flow
  }
}

export async function sendTicketConfirmation(phone: string, eventTitle: string, ticketNumber: string): Promise<void> {
  await sendSms(phone, `BEATIX: Your ticket for "${eventTitle}" is confirmed! Ticket: ${ticketNumber}. Show QR code at the entrance.`)
}

export async function sendPaymentFailed(phone: string, eventTitle: string): Promise<void> {
  await sendSms(phone, `BEATIX: Payment failed for "${eventTitle}". No ticket was issued. Please try again at beatix.sl`)
}

export async function sendEventReminder(phone: string, eventTitle: string, startsAt: string): Promise<void> {
  await sendSms(phone, `BEATIX Reminder: "${eventTitle}" starts ${startsAt}. Don't forget your QR ticket!`)
}

export async function sendEventCancellation(phone: string, eventTitle: string): Promise<void> {
  await sendSms(phone, `BEATIX: "${eventTitle}" has been cancelled. You will receive a full refund within 3-5 business days.`)
}
