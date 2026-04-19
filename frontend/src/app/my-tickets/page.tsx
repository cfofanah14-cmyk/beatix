'use client'

import Link from 'next/link'

const SAMPLE_TICKETS = [
  { id: 'BTX-2025-FVF-00847', event: 'Freetown Vibes Fest 2025', date: 'Sat, 14 Dec 2025', venue: 'Lumley Beach', type: 'VIP', status: 'active', emoji: '🎵' },
  { id: 'BTX-2025-AFR-00231', event: 'Big Afrobeats Night', date: 'Fri, 20 Dec 2025', venue: 'Aberdeen, Freetown', type: 'Regular', status: 'active', emoji: '🎤' },
  { id: 'BTX-2025-KCS-00109', event: 'Krio Comedy Show', date: 'Fri, 3 Jan 2026', venue: 'City Hall', type: 'VIP', status: 'used', emoji: '😂' },
]

export default function MyTicketsPage() {
  return (
    <div style={{ background: '#0D0B2B', minHeight: '100vh', maxWidth: 430, margin: '0 auto', paddingBottom: 80, fontFamily: "'DM Sans', sans-serif", color: '#fff' }}>

      {/* Header */}
      <div style={{ padding: '20px 20px 16px', position: 'sticky', top: 0, background: '#0D0B2B', zIndex: 10 }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800 }}>My Tickets</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>{SAMPLE_TICKETS.length} tickets total</div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 10, padding: '0 20px 20px' }}>
        {['Upcoming', 'Past'].map((tab, i) => (
          <button key={tab} style={{ padding: '8px 20px', borderRadius: 40, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none', background: i === 0 ? '#F5C842' : '#1A1845', color: i === 0 ? '#0D0B2B' : 'rgba(255,255,255,0.6)', fontFamily: "'DM Sans', sans-serif" }}>
            {tab}
          </button>
        ))}
      </div>

      {/* Ticket List */}
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {SAMPLE_TICKETS.map(ticket => (
          <Link key={ticket.id} href={`/tickets/${ticket.id}`} style={{ textDecoration: 'none' }}>
            <div style={{ background: '#13113A', border: `1px solid ${ticket.status === 'used' ? 'rgba(255,255,255,0.04)' : 'rgba(245,200,66,0.15)'}`, borderRadius: 16, overflow: 'hidden', opacity: ticket.status === 'used' ? 0.6 : 1, cursor: 'pointer' }}>

              {/* Card top */}
              <div style={{ display: 'flex', gap: 14, padding: 14, alignItems: 'center' }}>
                <div style={{ width: 52, height: 52, borderRadius: 12, background: 'linear-gradient(135deg,#6B2FA0,#1A1845)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>{ticket.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ticket.event}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 3 }}>🗓 {ticket.date} · 📍 {ticket.venue}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                    <span style={{ background: '#6B2FA0', color: '#fff', fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20 }}>{ticket.type}</span>
                    <span style={{ background: ticket.status === 'used' ? 'rgba(255,255,255,0.1)' : 'rgba(245,200,66,0.15)', color: ticket.status === 'used' ? 'rgba(255,255,255,0.4)' : '#F5C842', fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase' as const }}>
                      {ticket.status === 'used' ? 'Used' : 'Active'}
                    </span>
                  </div>
                </div>
                {ticket.status === 'active' && (
                  <div style={{ flexShrink: 0, width: 32, height: 32, background: 'rgba(245,200,66,0.1)', border: '1px solid rgba(245,200,66,0.3)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>▦</div>
                )}
              </div>

              {/* Ticket ID */}
              <div style={{ borderTop: '1px dashed rgba(255,255,255,0.07)', padding: '8px 14px', fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', letterSpacing: '0.06em' }}>
                {ticket.id}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Bottom Nav */}
      <nav style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, background: 'rgba(13,11,43,0.96)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '10px 0 18px', zIndex: 100 }}>
        {[
          { href: '/', label: 'Home' },
          { href: '/explore', label: 'Explore' },
          { href: '/my-tickets', label: 'My Tickets', active: true },
          { href: '/profile', label: 'Profile' },
        ].map(item => (
          <Link key={item.href} href={item.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textDecoration: 'none', padding: '4px 16px' }}>
            <span style={{ fontSize: 20 }}>{item.label === 'Home' ? '🏠' : item.label === 'Explore' ? '🔍' : item.label === 'My Tickets' ? '🎟️' : '👤'}</span>
            <span style={{ fontSize: 10, fontWeight: 500, color: item.active ? '#F5C842' : 'rgba(255,255,255,0.35)' }}>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
