'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

type VerifyState = 'verifying' | 'success' | 'failed'

export default function CheckoutVerifyPage() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const [state, setState] = useState<VerifyState>('verifying')
  const [ticketId, setTicketId] = useState<string>('')

  const txRef        = searchParams.get('tx_ref')        || ''
  const flwTxId      = searchParams.get('transaction_id')|| ''
  const status       = searchParams.get('status')        || ''

  useEffect(() => {
    async function verify() {
      await new Promise(r => setTimeout(r, 1500)) // simulate API call

      if (status === 'successful' || status === 'completed') {
        // In production: POST /api/payments/verify with txRef + flwTxId
        setTicketId('BTX-2025-FVF-' + Math.floor(10000 + Math.random() * 90000))
        setState('success')
      } else {
        setState('failed')
      }
    }
    if (txRef) verify()
  }, [txRef, status])

  // ── Verifying ──────────────────────────────────────────────────────────────
  if (state === 'verifying') {
    return (
      <div style={{ background: '#0D0B2B', minHeight: '100vh', maxWidth: 430, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif", color: '#fff', padding: 24 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', border: '3px solid rgba(245,200,66,0.3)', borderTop: '3px solid #F5C842', animation: 'spin 1s linear infinite', marginBottom: 24 }} />
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Confirming payment…</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', textAlign: 'center' }}>Please wait. Do not close this screen.</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // ── Failed ─────────────────────────────────────────────────────────────────
  if (state === 'failed') {
    return (
      <div style={{ background: '#0D0B2B', minHeight: '100vh', maxWidth: 430, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif", color: '#fff', padding: 24 }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,80,80,0.12)', border: '2px solid rgba(255,80,80,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, marginBottom: 20 }}>✗</div>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, marginBottom: 8, textAlign: 'center' }}>Payment Failed</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: 32, lineHeight: 1.6 }}>No ticket was issued and no money was charged. You can try again safely.</div>
        <button onClick={() => router.back()} style={{ width: '100%', background: '#F5C842', color: '#0D0B2B', border: 'none', borderRadius: 16, padding: 18, fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, cursor: 'pointer', marginBottom: 12 }}>
          Try Again
        </button>
        <button onClick={() => router.push('/')} style={{ background: 'transparent', color: 'rgba(255,255,255,0.4)', border: 'none', fontSize: 14, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
          Back to Home
        </button>
      </div>
    )
  }

  // ── Success ────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: '#0D0B2B', minHeight: '100vh', maxWidth: 430, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif", color: '#fff', padding: 24 }}>
      <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(245,200,66,0.12)', border: '2px solid #F5C842', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, marginBottom: 20 }}>✓</div>
      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, marginBottom: 8, textAlign: 'center' }}>Payment Confirmed!</div>
      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: 8 }}>Your ticket is ready. We also sent it to your phone via SMS.</div>
      <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#A855D4', letterSpacing: '0.08em', marginBottom: 36 }}>{ticketId}</div>
      <button onClick={() => router.push(`/tickets/${ticketId}`)} style={{ width: '100%', background: '#F5C842', color: '#0D0B2B', border: 'none', borderRadius: 16, padding: 18, fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
        View My Ticket →
      </button>
    </div>
  )
}
