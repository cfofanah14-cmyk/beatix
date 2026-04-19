'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function TicketPage() {
  const params = useParams()
  const ticketId = params.id

  return (
    <div style={{ background: '#0D0B2B', minHeight: '100vh', maxWidth: 430, margin: '0 auto', paddingBottom: 40, fontFamily: "'DM Sans', sans-serif", color: '#fff' }}>

      {/* Top */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 20px 0' }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: '#F5C842' }}>BEATIX</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Your Ticket</div>
      </div>

      {/* Success icon */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 20px 16px' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(245,200,66,0.12)', border: '2px solid #F5C842', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>✓</div>
      </div>

      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, textAlign: 'center', padding: '0 20px 4px' }}>Payment Successful!</div>
      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center', padding: '0 20px 24px' }}>Your ticket is ready. Show QR at the door.</div>

      {/* Ticket Card */}
      <div style={{ padding: '0 20px 20px' }}>
        <div style={{ background: 'linear-gradient(160deg,#6B2FA0 0%,#2D1B4E 50%,#1A1845 100%)', border: '1.5px solid rgba(245,200,66,0.3)', borderRadius: 24, overflow: 'hidden' }}>

          {/* Top section */}
          <div style={{ padding: '20px 20px 0' }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Freetown Vibes Fest 2025</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 16 }}>Sierra Live Entertainment</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const, marginBottom: 16 }}>
              {['🗓 Sat, 14 Dec 2025', '⏰ 8:00 PM', '👑 VIP', '📍 Lumley Beach'].map(chip => (
                <div key={chip} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 20, padding: '5px 12px', fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>{chip}</div>
              ))}
            </div>
          </div>

          {/* Tear line */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', margin: '0 -1px' }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#0D0B2B', border: '1.5px solid rgba(245,200,66,0.3)', marginLeft: -11, flexShrink: 0 }} />
            <div style={{ flex: 1, borderTop: '1.5px dashed rgba(245,200,66,0.3)' }} />
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#0D0B2B', border: '1.5px solid rgba(245,200,66,0.3)', marginRight: -11, flexShrink: 0 }} />
          </div>

          {/* QR section */}
          <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: 160, height: 160, background: '#fff', borderRadius: 12, padding: 10, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="0 0 100 100" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <rect x="10" y="10" width="30" height="30" fill="none" stroke="#0D0B2B" strokeWidth="3"/>
                <rect x="15" y="15" width="20" height="20" fill="#0D0B2B"/>
                <rect x="60" y="10" width="30" height="30" fill="none" stroke="#0D0B2B" strokeWidth="3"/>
                <rect x="65" y="15" width="20" height="20" fill="#0D0B2B"/>
                <rect x="10" y="60" width="30" height="30" fill="none" stroke="#0D0B2B" strokeWidth="3"/>
                <rect x="15" y="65" width="20" height="20" fill="#0D0B2B"/>
                <rect x="50" y="50" width="6" height="6" fill="#0D0B2B"/>
                <rect x="60" y="50" width="6" height="6" fill="#0D0B2B"/>
                <rect x="70" y="50" width="6" height="6" fill="#0D0B2B"/>
                <rect x="80" y="50" width="6" height="6" fill="#0D0B2B"/>
                <rect x="50" y="60" width="6" height="6" fill="#0D0B2B"/>
                <rect x="70" y="60" width="6" height="6" fill="#0D0B2B"/>
                <rect x="50" y="70" width="6" height="6" fill="#0D0B2B"/>
                <rect x="60" y="70" width="6" height="6" fill="#0D0B2B"/>
                <rect x="80" y="70" width="6" height="6" fill="#0D0B2B"/>
                <rect x="60" y="80" width="6" height="6" fill="#0D0B2B"/>
                <rect x="70" y="80" width="6" height="6" fill="#0D0B2B"/>
                <rect x="80" y="80" width="6" height="6" fill="#0D0B2B"/>
              </svg>
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', fontFamily: 'monospace' }}>
              {String(ticketId)} · VIP × 1
            </div>
          </div>
        </div>
      </div>

      {/* Warning */}
      <div style={{ margin: '0 20px 20px', background: 'rgba(245,200,66,0.08)', border: '1px solid rgba(245,200,66,0.2)', borderRadius: 12, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <span style={{ color: '#F5C842', fontSize: 16, flexShrink: 0, marginTop: 1 }}>⚠</span>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
          <strong style={{ color: '#F5C842' }}>Single-use QR code.</strong> This ticket scans once and immediately invalidates. Do not share screenshots with others.
        </div>
      </div>

      {/* Back button */}
      <div style={{ padding: '0 20px' }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'block' }}>
          <button style={{ width: '100%', background: '#1A1845', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 16, fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
            Back to Home
          </button>
        </Link>
      </div>
    </div>
  )
}
