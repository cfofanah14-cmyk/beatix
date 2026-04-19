'use client'

import { useState } from 'react'
import Link from 'next/link'

const CATEGORIES = ['All', 'Music', 'Sports', 'Comedy', 'Culture', 'Food', 'Business']

const SAMPLE_EVENTS = [
  { id: '1', title: 'Big Afrobeats Night', date: '20 Dec', venue: 'Aberdeen, Freetown', price: 'NLe 80', emoji: '🎤', gradient: 'linear-gradient(135deg,#A855D4,#6B2FA0)' },
  { id: '2', title: 'Leone Stars vs Guinea', date: '28 Dec', venue: 'National Stadium', price: 'NLe 30', emoji: '🏆', gradient: 'linear-gradient(135deg,#D4A017,#F5C842)' },
  { id: '3', title: 'Krio Comedy Show', date: '3 Jan', venue: 'City Hall, Freetown', price: 'NLe 45', emoji: '😂', gradient: 'linear-gradient(135deg,#1A1845,#6B2FA0)' },
  { id: '4', title: 'Freetown Food Festival', date: '10 Jan', venue: 'Cotton Tree Square', price: 'Free', emoji: '🍽️', gradient: 'linear-gradient(135deg,#6B2FA0,#1A1845)' },
]

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState('All')

  return (
    <div style={{ background: '#0D0B2B', minHeight: '100vh', maxWidth: 430, margin: '0 auto', paddingBottom: 80, fontFamily: "'DM Sans', sans-serif", color: '#fff' }}>

      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 12px', position: 'sticky', top: 0, background: '#0D0B2B', zIndex: 10 }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: '#F5C842' }}>
          BEA<span style={{ color: '#A855D4' }}>TIX</span>
        </div>
        <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#1A1845', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </div>
      </div>

      {/* Greeting */}
      <div style={{ padding: '4px 20px 16px' }}>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 3 }}>Good evening 👋</div>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800 }}>
          Find <span style={{ color: '#F5C842' }}>Events</span> Near You
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ padding: '0 20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#1A1845', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '12px 16px' }}>
          <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)' }}>Search events, artists, venues…</span>
        </div>
      </div>

      {/* Categories */}
      <div style={{ display: 'flex', gap: 10, padding: '0 20px 20px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)} style={{
            flexShrink: 0, padding: '8px 18px', borderRadius: 40,
            fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none',
            background: activeCategory === cat ? '#F5C842' : '#1A1845',
            color: activeCategory === cat ? '#0D0B2B' : 'rgba(255,255,255,0.6)',
            fontFamily: "'DM Sans', sans-serif",
          }}>
            {cat}
          </button>
        ))}
      </div>

      {/* Featured Card */}
      <div style={{ padding: '0 20px 24px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12, fontFamily: "'Syne', sans-serif" }}>Featured Event</div>
        <Link href="/events/1" style={{ textDecoration: 'none' }}>
          <div style={{ borderRadius: 20, overflow: 'hidden', position: 'relative', height: 220, cursor: 'pointer' }}>
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#6B2FA0 0%,#2D1B4E 50%,#1A1845 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 64 }}>🎵</span>
            </div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top,rgba(13,11,43,0.97) 0%,rgba(13,11,43,0.6) 60%,transparent 100%)', padding: 20 }}>
              <div style={{ display: 'inline-block', background: '#F5C842', color: '#0D0B2B', fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 20, marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Tonight</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 6, color: '#fff' }}>Freetown Vibes Fest 2025</div>
              <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'rgba(255,255,255,0.6)', alignItems: 'center' }}>
                <span>🗓 Sat, 14 Dec · 8 PM</span>
                <span>📍 Lumley Beach</span>
                <span style={{ marginLeft: 'auto', color: '#F5C842', fontWeight: 700, fontFamily: "'Syne', sans-serif", fontSize: 14 }}>From NLe 50</span>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Upcoming Events */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px 14px' }}>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, color: '#fff' }}>Upcoming Events</h2>
        <Link href="/explore" style={{ fontSize: 13, color: '#A855D4', fontWeight: 500 }}>See all</Link>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {SAMPLE_EVENTS.map(ev => (
          <Link key={ev.id} href={`/events/${ev.id}`} style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', background: '#13113A', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 14, cursor: 'pointer' }}>
              <div style={{ width: 68, height: 68, borderRadius: 12, flexShrink: 0, background: ev.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
                {ev.emoji}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 5 }}>{ev.title}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 8, display: 'flex', gap: 10 }}>
                  <span>🗓 {ev.date}</span>
                  <span>📍 {ev.venue}</span>
                </div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, color: '#F5C842' }}>{ev.price} <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: "'DM Sans', sans-serif", fontWeight: 400 }}>/ ticket</span></div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ height: 24 }} />

      {/* Bottom Nav */}
      <nav style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, background: 'rgba(13,11,43,0.96)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '10px 0 18px', zIndex: 100 }}>
        {[
          { href: '/', label: 'Home', active: true },
          { href: '/explore', label: 'Explore', active: false },
          { href: '/my-tickets', label: 'My Tickets', active: false },
          { href: '/profile', label: 'Profile', active: false },
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
