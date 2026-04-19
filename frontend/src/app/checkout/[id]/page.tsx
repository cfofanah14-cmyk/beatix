'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const PAYMENT_METHODS = [
  { id: 'afrimoney', label: 'Afrimoney', sub: 'Mobile money · Instant', color: '#FF6B00' },
  { id: 'orange', label: 'Orange Money', sub: 'Mobile money · Instant', color: '#FF7900' },
  { id: 'card', label: 'Debit / Credit Card', sub: 'Visa, Mastercard · via Flutterwave', color: '#6B2FA0' },
]

const UNIT_PRICE = 150
const FEE_RATE = 0.05

export default function CheckoutPage() {
  const router = useRouter()
  const [qty, setQty] = useState(1)
  const [payMethod, setPayMethod] = useState('afrimoney')

  const subtotal = qty * UNIT_PRICE
  const fee = subtotal * FEE_RATE
  const total = subtotal + fee

  return (
    <div style={{ background: '#0D0B2B', minHeight: '100vh', maxWidth: 430, margin: '0 auto', paddingBottom: 40, fontFamily: "'DM Sans', sans-serif", color: '#fff' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '20px 20px 16px' }}>
        <Link href="/events/1" style={{ width: 38, height: 38, borderRadius: '50%', background: '#1A1845', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: '#fff', fontSize: 18 }}>←</Link>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700 }}>Checkout</div>
      </div>

      {/* Progress bar */}
      <div style={{ padding: '0 20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          {['Choose', 'Quantity & Pay', 'Confirm'].map((step, i) => (
            <span key={step} style={{ fontSize: 11, fontWeight: 500, color: i === 0 ? '#A855D4' : i === 1 ? '#F5C842' : 'rgba(255,255,255,0.35)' }}>{step}</span>
          ))}
        </div>
        <div style={{ height: 4, background: '#1A1845', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: '66%', background: 'linear-gradient(90deg,#6B2FA0,#F5C842)', borderRadius: 4, transition: 'width 0.4s' }} />
        </div>
      </div>

      {/* Quantity */}
      <div style={{ padding: '0 20px 20px' }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Ticket Quantity</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 500 }}>VIP Ticket</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>NLe {UNIT_PRICE} each</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: 36, height: 36, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.15)', background: '#1A1845', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
            <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 700, minWidth: 24, textAlign: 'center' }}>{qty}</span>
            <button onClick={() => setQty(q => Math.min(10, q + 1))} style={{ width: 36, height: 36, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.15)', background: '#1A1845', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
          </div>
        </div>
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 20px 20px' }} />

      {/* Payment Methods */}
      <div style={{ padding: '0 20px 20px' }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Payment Method</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {PAYMENT_METHODS.map(pm => (
            <div key={pm.id} onClick={() => setPayMethod(pm.id)} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              background: payMethod === pm.id ? 'rgba(245,200,66,0.04)' : '#13113A',
              border: `1.5px solid ${payMethod === pm.id ? '#F5C842' : 'rgba(255,255,255,0.06)'}`,
              borderRadius: 14, padding: '14px 16px', cursor: 'pointer', transition: 'all 0.2s',
            }}>
              <div style={{ width: 46, height: 30, borderRadius: 6, background: pm.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff', letterSpacing: '0.04em' }}>
                {pm.id === 'afrimoney' ? 'AFRI' : pm.id === 'orange' ? 'OM' : 'CARD'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#fff' }}>{pm.label}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{pm.sub}</div>
              </div>
              <div style={{
                width: 20, height: 20, borderRadius: '50%',
                border: `1.5px solid ${payMethod === pm.id ? '#F5C842' : 'rgba(255,255,255,0.2)'}`,
                background: payMethod === pm.id ? '#F5C842' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {payMethod === pm.id && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0D0B2B' }} />}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Summary */}
      <div style={{ padding: '0 20px 20px' }}>
        <div style={{ background: '#13113A', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 16, marginBottom: 20 }}>
          {[
            [`VIP × ${qty}`, `NLe ${subtotal}`],
            ['Beatix service fee', `NLe ${fee.toFixed(2)}`],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{k}</span>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{v}</span>
            </div>
          ))}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '10px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700 }}>Total</span>
            <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: '#F5C842' }}>NLe {total.toFixed(2)}</span>
          </div>
        </div>

        <Link href="/tickets/BTX-2025-FVF-00847" style={{ textDecoration: 'none', display: 'block' }}>
          <button style={{ width: '100%', background: '#F5C842', color: '#0D0B2B', border: 'none', borderRadius: 16, padding: 18, fontFamily: "'Syne', sans-serif", fontSize: 17, fontWeight: 700, cursor: 'pointer' }}>
            Pay Now
          </button>
        </Link>
      </div>
    </div>
  )
}
