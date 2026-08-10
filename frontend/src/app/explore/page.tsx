'use client'

import { useState, useMemo } from 'react'

// ── Types ────────────────────────────────────────────────────
interface Event {
  id: string
  title: string
  category: string
  date: string
  location: string
  price: number
  image: string
  organizer: string
  tag?: string
}

// ── Mock data ────────────────────────────────────────────────
const MOCK_EVENTS: Event[] = [
  { id: '1', title: 'Freetown Jazz Night',      category: 'Music',   date: '2025-08-10', location: 'Freetown',   price: 50000,  image: '🎷', organizer: 'Jazz SL',       tag: 'Tonight' },
  { id: '2', title: 'Sierra Leone Comedy Fest', category: 'Comedy',  date: '2025-08-15', location: 'Bo',         price: 30000,  image: '😂', organizer: 'Laugh Factory', tag: 'Hot' },
  { id: '3', title: 'Afrobeats Massive',        category: 'Music',   date: '2025-08-20', location: 'Freetown',   price: 75000,  image: '🎵', organizer: 'Stage SL' },
  { id: '4', title: 'Tech for Good Summit',     category: 'Tech',    date: '2025-08-22', location: 'Freetown',   price: 0,      image: '💻', organizer: 'TechSL',        tag: 'Free' },
  { id: '5', title: 'Fashion Week SL',          category: 'Fashion', date: '2025-09-01', location: 'Makeni',     price: 40000,  image: '👗', organizer: 'Mode SL' },
  { id: '6', title: 'Beach Football Tournament',category: 'Sports',  date: '2025-09-05', location: 'Lumley Beach',price: 10000, image: '⚽', organizer: 'Sports SL',     tag: 'Popular' },
  { id: '7', title: 'Gospel Night Live',        category: 'Music',   date: '2025-09-10', location: 'Bo',         price: 20000,  image: '🎤', organizer: 'Grace Events' },
  { id: '8', title: 'Street Food Festival',     category: 'Food',    date: '2025-09-12', location: 'Freetown',   price: 0,      image: '🍲', organizer: 'Chop Chop SL',  tag: 'Free' },
]

const CATEGORIES = ['All', 'Music', 'Comedy', 'Sports', 'Tech', 'Fashion', 'Food']
const LOCATIONS  = ['All Locations', 'Freetown', 'Bo', 'Makeni', 'Lumley Beach']

const fmt = (n: number) => n === 0 ? 'Free' : `Le ${n.toLocaleString()}`
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

export default function ExplorePage() {
  const [search,   setSearch]   = useState('')
  const [category, setCategory] = useState('All')
  const [location, setLocation] = useState('All Locations')
  const [maxPrice, setMaxPrice] = useState(200000)
  const [dateFrom, setDateFrom] = useState('')

  const filtered = useMemo(() => {
    return MOCK_EVENTS.filter(e => {
      if (search && !e.title.toLowerCase().includes(search.toLowerCase()) &&
          !e.organizer.toLowerCase().includes(search.toLowerCase())) return false
      if (category !== 'All' && e.category !== category) return false
      if (location !== 'All Locations' && !e.location.includes(location)) return false
      if (e.price > maxPrice) return false
      if (dateFrom && e.date < dateFrom) return false
      return true
    })
  }, [search, category, location, maxPrice, dateFrom])

  const s = { fontFamily: "'DM Sans', sans-serif" }

  return (
    <div style={{ ...s, background: '#0D0B2B', minHeight: '100vh', color: '#fff', paddingBottom: 60 }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(180deg,rgba(107,47,160,0.4),transparent)', padding: '40px 20px 24px' }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, marginBottom: 4 }}>
          Discover Events 🇸🇱
        </div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>Browse without signing in</div>

        {/* Search */}
        <div style={{ position: 'relative', marginTop: 20 }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, opacity: 0.4 }}>🔍</span>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search events or organizers…"
            style={{ width: '100%', background: '#1A1845', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '14px 16px 14px 42px', color: '#fff', fontSize: 15, outline: 'none', boxSizing: 'border-box', fontFamily: "'DM Sans', sans-serif" }}
          />
        </div>
      </div>

      {/* Filters */}
      <div style={{ padding: '0 20px 20px' }}>

        {/* Category pills */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 16, scrollbarWidth: 'none' }}>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              style={{ flexShrink: 0, background: category === c ? '#A855D4' : 'rgba(255,255,255,0.06)', border: `1px solid ${category === c ? '#A855D4' : 'rgba(255,255,255,0.1)'}`, borderRadius: 20, padding: '8px 16px', color: category === c ? '#fff' : 'rgba(255,255,255,0.55)', fontSize: 13, cursor: 'pointer', fontFamily: "'Syne', sans-serif", fontWeight: 600 }}>
              {c}
            </button>
          ))}
        </div>

        {/* Location + Date row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          <select value={location} onChange={e => setLocation(e.target.value)}
            style={{ background: '#1A1845', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 12px', color: '#fff', fontSize: 13, outline: 'none', fontFamily: "'DM Sans', sans-serif" }}>
            {LOCATIONS.map(l => <option key={l}>{l}</option>)}
          </select>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            style={{ background: '#1A1845', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 12px', color: dateFrom ? '#fff' : 'rgba(255,255,255,0.4)', fontSize: 13, outline: 'none', fontFamily: "'DM Sans', sans-serif', colorScheme: 'dark" }} />
        </div>

        {/* Price slider */}
        <div style={{ marginBottom: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>
            <span>Max price</span>
            <span style={{ color: '#F5C842', fontWeight: 600 }}>{fmt(maxPrice)}</span>
          </div>
          <input type="range" min={0} max={200000} step={5000} value={maxPrice} onChange={e => setMaxPrice(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#F5C842' }} />
        </div>
      </div>

      {/* Results count */}
      <div style={{ padding: '0 20px 16px', fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
        {filtered.length} event{filtered.length !== 1 ? 's' : ''} found
      </div>

      {/* Event cards */}
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(255,255,255,0.3)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 15 }}>No events match your filters</div>
          </div>
        ) : filtered.map(event => (
          <div key={event.id}
            style={{ background: '#13113A', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, padding: '18px 16px', display: 'flex', gap: 16, alignItems: 'flex-start', cursor: 'pointer', transition: 'border-color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(168,85,212,0.4)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}>

            {/* Emoji thumbnail */}
            <div style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg,#6B2FA0,#1A1845)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>
              {event.image}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, lineHeight: 1.3 }}>{event.title}</div>
                {event.tag && (
                  <div style={{ background: event.tag === 'Free' ? 'rgba(34,197,94,0.15)' : 'rgba(245,200,66,0.15)', color: event.tag === 'Free' ? '#22C55E' : '#F5C842', border: `1px solid ${event.tag === 'Free' ? '#22C55E' : '#F5C842'}30`, borderRadius: 20, padding: '2px 8px', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                    {event.tag}
                  </div>
                )}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{fmtDate(event.date)} · {event.location}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                <span style={{ fontSize: 13, color: '#A855D4' }}>{event.category}</span>
                <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, color: event.price === 0 ? '#22C55E' : '#F5C842' }}>{fmt(event.price)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
