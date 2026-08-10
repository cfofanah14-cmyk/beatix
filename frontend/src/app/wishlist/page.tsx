'use client'

import { useState } from 'react'

interface WishlistEvent {
  id: string
  title: string
  date: string
  location: string
  price: number
  image: string
  reminder: boolean
}

const INITIAL: WishlistEvent[] = [
  { id: '1', title: 'Freetown Jazz Night',       date: '2025-08-10', location: 'Freetown',    price: 50000, image: '🎷', reminder: true  },
  { id: '2', title: 'Sierra Leone Comedy Fest',  date: '2025-08-15', location: 'Bo',          price: 30000, image: '😂', reminder: false },
  { id: '3', title: 'Afrobeats Massive',          date: '2025-08-20', location: 'Freetown',    price: 75000, image: '🎵', reminder: true  },
]

const fmt     = (n: number) => n === 0 ? 'Free' : `Le ${n.toLocaleString()}`
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistEvent[]>(INITIAL)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  const toggleReminder = (id: string) => {
    setItems(prev => prev.map(e =>
      e.id === id ? { ...e, reminder: !e.reminder } : e
    ))
    const item = items.find(e => e.id === id)!
    showToast(item.reminder ? 'Reminder removed' : '🔔 Reminder set!')
  }

  const remove = (id: string) => {
    setItems(prev => prev.filter(e => e.id !== id))
    showToast('Removed from wishlist')
  }

  const s = { fontFamily: "'DM Sans', sans-serif" }

  return (
    <div style={{ ...s, background: '#0D0B2B', minHeight: '100vh', color: '#fff', maxWidth: 480, margin: '0 auto', paddingBottom: 60 }}>

      {/* Header */}
      <div style={{ padding: '40px 20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, marginBottom: 4 }}>My Wishlist 🤍</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)' }}>{items.length} saved event{items.length !== 1 ? 's' : ''}</div>
      </div>

      <div style={{ padding: '20px' }}>
        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0', color: 'rgba(255,255,255,0.3)' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🤍</div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Nothing saved yet</div>
            <div style={{ fontSize: 14 }}>Browse events and tap the heart to save them here.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {items.map(event => (
              <div key={event.id} style={{ background: '#13113A', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, padding: 16 }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>

                  {/* Thumb */}
                  <div style={{ width: 52, height: 52, borderRadius: 12, background: 'linear-gradient(135deg,#6B2FA0,#1A1845)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>
                    {event.image}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700 }}>{event.title}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>
                      {fmtDate(event.date)} · {event.location}
                    </div>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, color: '#F5C842', marginTop: 6 }}>
                      {fmt(event.price)}
                    </div>
                  </div>

                  {/* Remove */}
                  <button onClick={() => remove(event.id)}
                    style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', fontSize: 18, cursor: 'pointer', padding: 4, lineHeight: 1 }}>
                    ✕
                  </button>
                </div>

                {/* Action bar */}
                <div style={{ display: 'flex', gap: 10, marginTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14 }}>

                  {/* Reminder toggle */}
                  <button onClick={() => toggleReminder(event.id)}
                    style={{ flex: 1, background: event.reminder ? 'rgba(168,85,212,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${event.reminder ? 'rgba(168,85,212,0.5)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 10, padding: '9px 12px', color: event.reminder ? '#A855D4' : 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: "'DM Sans', sans-serif" }}>
                    {event.reminder ? '🔔 Reminder on' : '🔕 Set reminder'}
                  </button>

                  {/* Buy now */}
                  <button style={{ flex: 1, background: '#F5C842', border: 'none', borderRadius: 10, padding: '9px 12px', color: '#0D0B2B', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Syne', sans-serif" }}>
                    Buy Tickets →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', background: '#1A1845', border: '1px solid rgba(168,85,212,0.4)', borderRadius: 40, padding: '10px 22px', fontSize: 14, color: '#fff', fontWeight: 600, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', whiteSpace: 'nowrap', zIndex: 999 }}>
          {toast}
        </div>
      )}
    </div>
  )
}
