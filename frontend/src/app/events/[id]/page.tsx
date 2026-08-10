'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

interface TicketCategory {
  id: string
  name: string
  description: string
  price: number
  remaining: number
}

const EVENT = {
  id: '1',
  title: 'Freetown Vibes Fest 2025',
  organizer: 'Sierra Live Entertainment',
  date: 'Sat, 14 Dec 2025',
  time: '8:00 PM',
  venue: 'Lumley Beach',
  description:
    "Sierra Leone's biggest music festival returns with top Afrobeats, Afropop, and local artists. A night of culture, rhythm, and good vibes on the shores of Lumley Beach. Food, drinks and full stage show. All welcome.",
  ticketCategories: [
    { id: 'vip',     name: 'VIP',     description: 'Front zone · Lounge access · 1 drink',       price: 150, remaining: 48  },
    { id: 'regular', name: 'Regular', description: 'General admission · Full show access',         price: 50,  remaining: 312 },
    { id: 'vvip',    name: 'VVIP',    description: 'Backstage pass · Meet & greet · 3 drinks',     price: 300, remaining: 10  },
  ] as TicketCategory[],
}

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string

  // Initialise to the FIRST category's id — never a hardcoded string
  const [selectedId, setSelectedId] = useState<string>(
    EVENT.ticketCategories[0]?.id ?? ''
  )

  const selectedCategory = EVENT.ticketCategories.find(tc => tc.id === selectedId)!
  const isSoldOut = selectedCategory?.remaining === 0

  // ── THE FIX: encode name + price into the URL so Checkout can read them ──
  function handleBuyClick() {
    if (isSoldOut || !selectedCategory) return
    const params = new URLSearchParams({
      categoryId:   selectedCategory.id,
      categoryName: selectedCategory.name,
      price:        String(selectedCategory.price),
    })
    router.push(`/checkout/${eventId}?${params.toString()}`)
  }

  return (
    <div style={{ background: '#0D0B2B', minHeight: '100vh', maxWidth: 430, margin: '0 auto', paddingBottom: 100, fontFamily: "'DM Sans', sans-serif", color: '#fff' }}>

      {/* Hero */}
      <div style={{ height: 280, position: 'relative', background: 'linear-gradient(135deg,#6B2FA0 0%,#2D1B4E 50%,#1A1845 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Link href="/" style={{ position: 'absolute', top: 20, left: 20, width: 38, height: 38, borderRadius: '50%', background: 'rgba(13,11,43,0.65)', border: '1px solid rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: '#fff', fontSize: 18 }}>←</Link>
        <div style={{ position: 'absolute', top: 20, right: 20, width: 38, height: 38, borderRadius: '50%', background: 'rgba(13,11,43,0.65)', border: '1px solid rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, cursor: 'pointer' }}>↑</div>
        <span style={{ fontSize: 64 }}>🎵</span>
      </div>

      {/* Body */}
      <div style={{ padding: 20 }}>

        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, marginBottom: 6, lineHeight: 1.2 }}>{EVENT.title}</div>
        <div style={{ fontSize: 13, color: '#A855D4', fontWeight: 500, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 14, height: 14, borderRadius: '50%', background: '#A855D4', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 8 }}>✓</span>
          {EVENT.organizer}
        </div>

        {/* Info chips */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          {[['Date', EVENT.date], ['Time', EVENT.time], ['Venue', EVENT.venue]].map(([label, val]) => (
            <div key={label} style={{ flex: 1, background: '#1A1845', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 12 }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 600 }}>{val}</div>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.65, marginBottom: 24 }}>{EVENT.description}</p>

        {/* Ticket category selector */}
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Choose Your Ticket</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {EVENT.ticketCategories.map(tc => {
            const isSelected = tc.id === selectedId   // ← compare to state, not a hardcoded string
            const soldOut    = tc.remaining === 0

            return (
              <div
                key={tc.id}
                onClick={() => { if (!soldOut) setSelectedId(tc.id) }}  // ← always update state on click
                role="radio"
                aria-checked={isSelected}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: isSelected ? 'rgba(245,200,66,0.06)' : '#13113A',
                  border: `1.5px solid ${isSelected ? '#F5C842' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: 14, padding: '14px 16px',
                  cursor: soldOut ? 'not-allowed' : 'pointer',
                  opacity: soldOut ? 0.5 : 1,
                  transition: 'border-color 0.15s, background 0.15s',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {/* Left */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {/* Radio dot */}
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                    border: `2px solid ${isSelected ? '#F5C842' : 'rgba(255,255,255,0.25)'}`,
                    background: isSelected ? '#F5C842' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}>
                    {isSelected && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0D0B2B' }} />}
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700 }}>{tc.name}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{tc.description}</div>
                    <div style={{ fontSize: 10, marginTop: 3, color: soldOut ? '#FF6B6B' : tc.remaining < 20 ? '#FF8C42' : 'rgba(255,255,255,0.3)' }}>
                      {soldOut ? 'Sold out' : tc.remaining < 20 ? `Only ${tc.remaining} left!` : `${tc.remaining} available`}
                    </div>
                  </div>
                </div>

                {/* Right: price */}
                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: '#F5C842' }}>NLe {tc.price}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>/ ticket</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Buy button — label updates to reflect selection */}
        <button
          onClick={handleBuyClick}
          disabled={isSoldOut}
          style={{
            width: '100%',
            background: isSoldOut ? 'rgba(245,200,66,0.3)' : '#F5C842',
            color: '#0D0B2B', border: 'none', borderRadius: 16, padding: 18,
            fontFamily: "'Syne', sans-serif", fontSize: 17, fontWeight: 700,
            cursor: isSoldOut ? 'not-allowed' : 'pointer', letterSpacing: '0.02em',
          }}
        >
          {isSoldOut
            ? 'Sold Out'
            : `Buy ${selectedCategory?.name} Ticket — NLe ${selectedCategory?.price}`}
        </button>

      </div>

      {/* Bottom Nav */}
      <nav style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, background: 'rgba(13,11,43,0.96)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '10px 0 18px', zIndex: 100 }}>
        {[
          { href: '/',           label: 'Home',       icon: '🏠' },
          { href: '/explore',    label: 'Explore',    icon: '🔍' },
          { href: '/my-tickets', label: 'My Tickets', icon: '🎟️' },
          { href: '/profile',    label: 'Profile',    icon: '👤' },
        ].map(item => (
          <Link key={item.href} href={item.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textDecoration: 'none', padding: '4px 16px' }}>
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.35)' }}>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
