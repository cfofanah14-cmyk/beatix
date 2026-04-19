'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

const TICKET_TYPES = [
  { id: 'vip', name: 'VIP', desc: 'Front zone · Lounge access · 1 drink', price: 150 },
  { id: 'regular', name: 'Regular', desc: 'General admission · Full show access', price: 50 },
]

export default function EventDetailPage() {
  const params = useParams()
  const eventId = params.id
  const [selected, setSelected] = useState('vip')

  return (
    <div style={{ background: '#0D0B2B', minHeight: '100vh', maxWidth: 430, margin: '0 auto', paddingBottom: 100, fontFamily: "'DM Sans', sans-serif", color: '#fff' }}>

      {/* Hero */}
      <div style={{ height: 280, position: 'relative', background: 'linear-gradient(135deg,#6B2FA0 0%,#2D1B4E 50%,#1A1845 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Link href="/" style={{ position: 'absolute', top: 20, left: 20, width: 38, height: 38, borderRadius: '50%', background: 'rgba(13,11,43,0.6)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: '#fff', fontSize: 18 }}>←</Link>
        <div style={{ position: 'absolute', top: 20, right: 20, width: 38, height: 38, borderRadius: '50%', background: 'rgba(13,11,43,0.6)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16 }}>↑</div>
        <span style={{ fontSize: 64 }}>🎵</span>
      </div>

      {/* Body */}
      <div style={{ padding: 20 }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, marginBottom: 6, lineHeight: 1.2 }}>Freetown Vibes Fest 2025</div>
        <div style={{ fontSize: 13, color: '#A855D4', fontWeight: 500, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 14, height: 14, borderRadius: '50%', background: '#A855D4', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 8 }}>✓</span>
          Sierra Live Entertainment
        </div>

        {/* Info chips */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          {[['Date', 'Sat, 14 Dec 2025'], ['Time', '8:00 PM'], ['Venue', 'Lumley Beach']].map(([label, val]) => (
            <div key={label} style={{ flex: 1, background: '#1A1845', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 12 }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 600 }}>{val}</div>
            </div>
          ))}
        </div>

        {/* Description */}
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: 24 }}>
          Sierra Leone's biggest music festival returns with top Afrobeats, Afropop, and local artists. A night of culture, rhythm, and good vibes on the shores of Lumley Beach.
        </p>

        {/* Ticket Types */}
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Choose Your Ticket</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {TICKET_TYPES.map(tt => (
            <div key={tt.id} onClick={() => setSelected(tt.id)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: selected === tt.id ? 'rgba(245,200,66,0.05)' : '#13113A',
              border: `1.5px solid ${selected === tt.id ? '#F5C842' : 'rgba(255,255,255,0.06)'}`,
              borderRadius: 14, padding: '14px 16px', cursor: 'pointer', transition: 'all 0.2s',
            }}>
              <div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700 }}>{tt.name}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{tt.desc}</div>
              </div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: '#F5C842' }}>
                NLe {tt.price} <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: "'DM Sans', sans-serif", fontWeight: 400 }}>/ ticket</span>
              </div>
            </div>
          ))}
        </div>

        {/* Buy CTA */}
        <Link href={`/checkout/${eventId}?type=${selected}`} style={{ textDecoration: 'none', display: 'block' }}>
          <button style={{ width: '100%', background: '#F5C842', color: '#0D0B2B', border: 'none', borderRadius: 16, padding: 18, fontFamily: "'Syne', sans-serif", fontSize: 17, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.02em' }}>
            Buy Ticket
          </button>
        </Link>
      </div>

      {/* Bottom Nav */}
      <nav style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, background: 'rgba(13,11,43,0.96)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '10px 0 18px', zIndex: 100 }}>
        {[
          { href: '/', label: 'Home' },
          { href: '/explore', label: 'Explore' },
          { href: '/my-tickets', label: 'My Tickets' },
          { href: '/profile', label: 'Profile', active: true },
        ].map(item => (
          <Link key={item.href} href={item.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textDecoration: 'none', padding: '4px 16px' }}>
            <span style={{ fontSize: 20 }}>{item.label === 'Home' ? '🏠' : item.label === 'Explore' ? '🔍' : item.label === 'My Tickets' ? '🎟️' : '👤'}</span>
            <span style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.35)' }}>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
