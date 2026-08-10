'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'

const SHARE_PLATFORMS = [
  { id: 'whatsapp',  label: 'WhatsApp',  color: '#25D366', icon: '💬',
    getUrl: (msg: string) => `https://wa.me/?text=${encodeURIComponent(msg)}` },
  { id: 'telegram',  label: 'Telegram',  color: '#2AABEE', icon: '✈️',
    getUrl: (msg: string) => `https://t.me/share/url?url=${encodeURIComponent(msg)}` },
  { id: 'x',         label: 'X',         color: '#000000', icon: '✖',
    getUrl: (msg: string) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(msg)}` },
  { id: 'facebook',  label: 'Facebook',  color: '#1877F2', icon: '👥',
    getUrl: (msg: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(msg)}` },
  { id: 'instagram', label: 'Instagram', color: '#E1306C', icon: '📸',
    getUrl: (_: string) => `https://instagram.com/beatixsl` },
  { id: 'tiktok',    label: 'TikTok',    color: '#010101', icon: '🎵',
    getUrl: (_: string) => `https://tiktok.com/@beatixsl` },
]

export default function TicketPage() {
  const params   = useParams()
  const ticketId = params.id as string

  const shareMessage = `I just got my ticket for Freetown Vibes Fest 2025 🎵 Get yours at beatix.sl`

  function handleShare(platform: typeof SHARE_PLATFORMS[0]) {
    window.open(platform.getUrl(shareMessage), '_blank', 'noopener,noreferrer')
  }

  return (
    <div style={{ background: '#0D0B2B', minHeight: '100vh', maxWidth: 430, margin: '0 auto', paddingBottom: 40, fontFamily: "'DM Sans', sans-serif", color: '#fff' }}>

      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 20px 0' }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: '#F5C842' }}>BEATIX</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Your Ticket</div>
      </div>

      {/* Success icon */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 20px 12px' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(245,200,66,0.12)', border: '2px solid #F5C842', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>✓</div>
      </div>

      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, textAlign: 'center', padding: '0 20px 4px' }}>Payment Successful!</div>
      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', textAlign: 'center', padding: '0 20px 20px' }}>Your ticket is ready. Show QR at the door.</div>

      {/* Ticket card */}
      <div style={{ padding: '0 20px 20px' }}>
        <div style={{ background: 'linear-gradient(160deg,#6B2FA0 0%,#2D1B4E 50%,#1A1845 100%)', border: '1.5px solid rgba(245,200,66,0.3)', borderRadius: 24, overflow: 'hidden' }}>

          {/* Card top */}
          <div style={{ padding: '20px 20px 0' }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Freetown Vibes Fest 2025</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 14 }}>Sierra Live Entertainment</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              {['🗓 Sat, 14 Dec 2025', '⏰ 8:00 PM', '👑 VIP', '📍 Lumley Beach'].map(chip => (
                <div key={chip} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 20, padding: '5px 12px', fontSize: 11, color: 'rgba(255,255,255,0.85)' }}>{chip}</div>
              ))}
            </div>
          </div>

          {/* Tear line */}
          <div style={{ display: 'flex', alignItems: 'center', margin: '0 -1px' }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#0D0B2B', border: '1.5px solid rgba(245,200,66,0.3)', marginLeft: -11, flexShrink: 0 }} />
            <div style={{ flex: 1, borderTop: '1.5px dashed rgba(245,200,66,0.3)' }} />
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#0D0B2B', border: '1.5px solid rgba(245,200,66,0.3)', marginRight: -11, flexShrink: 0 }} />
          </div>

          {/* QR code */}
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
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.1em', fontFamily: 'monospace' }}>{String(ticketId)} · VIP × 1</div>
          </div>
        </div>
      </div>

      {/* Single-use warning */}
      <div style={{ margin: '0 20px 20px', background: 'rgba(245,200,66,0.07)', border: '1px solid rgba(245,200,66,0.2)', borderRadius: 12, padding: '12px 14px', display: 'flex', gap: 10 }}>
        <span style={{ color: '#F5C842', flexShrink: 0, marginTop: 1 }}>⚠</span>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
          <strong style={{ color: '#F5C842' }}>Single-use QR code.</strong> Scans once then invalidates immediately. Do not share screenshots.
        </div>
      </div>

      {/* ── SOCIAL SHARING SECTION ── */}
      <div style={{ padding: '0 20px 20px' }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Share the vibes 🎉</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 14 }}>Let your people know you're going!</div>

        {/* Share grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {SHARE_PLATFORMS.map(platform => (
            <button
              key={platform.id}
              onClick={() => handleShare(platform)}
              style={{
                background: '#13113A', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 14, padding: '12px 8px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                cursor: 'pointer', transition: 'border-color 0.15s', WebkitTapHighlightColor: 'transparent',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${platform.color}60` }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)' }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 10, background: platform.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                {platform.icon}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>{platform.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Back to home */}
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
