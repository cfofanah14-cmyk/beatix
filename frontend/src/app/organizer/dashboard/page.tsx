'use client'

import { useState } from 'react'
import Link from 'next/link'
import BottomNav from '../../../components/BottomNav'

const S = {
  page:       { background: '#0D0B2B', minHeight: '100vh', maxWidth: 430, margin: '0 auto', paddingBottom: 90, fontFamily: "'DM Sans', sans-serif", color: '#fff' },
  topbar:     { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 16px', position: 'sticky' as const, top: 0, background: '#0D0B2B', zIndex: 10 },
  logo:       { fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: '#F5C842' },
  avatar:     { width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#6B2FA0,#A855D4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer' },
  section:    { padding: '0 20px 20px' },
  heading:    { fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, marginBottom: 4 },
  sub:        { fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 20 },
  card:       { background: '#13113A', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16 },
  gold:       { color: '#F5C842' },
  purple:     { color: '#A855D4' },
  muted:      { color: 'rgba(255,255,255,0.45)' },
  label:      { fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.4)', marginBottom: 4 },
  bigNum:     { fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800 },
  divider:    { height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 20px' },
  btnGold:    { width: '100%', background: '#F5C842', color: '#0D0B2B', border: 'none', borderRadius: 14, padding: '16px', fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, cursor: 'pointer' },
  btnOutline: { width: '100%', background: 'transparent', color: '#F5C842', border: '1.5px solid #F5C842', borderRadius: 14, padding: '14px', fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 600, cursor: 'pointer' },
}

const STATS = [
  { label: 'Total Revenue',   value: 'NLe 48,250', change: '+12%', up: true,  icon: '💰' },
  { label: 'Tickets Sold',    value: '1,042',       change: '+8%',  up: true,  icon: '🎟️' },
  { label: 'Live Events',     value: '3',           change: '',     up: true,  icon: '🔴' },
  { label: 'Balance',         value: 'NLe 41,280',  change: 'Ready', up: true, icon: '🏦' },
]

const TRANSACTIONS = [
  { name: 'Aminata K.',    event: 'Freetown Vibes Fest', type: 'VIP',     amount: 157.50, method: 'Afrimoney', time: '2m ago' },
  { name: 'Mohamed S.',    event: 'Freetown Vibes Fest', type: 'Regular', amount: 52.50,  method: 'Orange Money', time: '8m ago' },
  { name: 'Fatmata J.',    event: 'Big Afrobeats Night', type: 'VIP Table', amount: 210,  method: 'Card',      time: '15m ago' },
  { name: 'Ibrahim B.',    event: 'Freetown Vibes Fest', type: 'Regular', amount: 105,    method: 'Afrimoney', time: '22m ago' },
  { name: 'Mariama C.',    event: 'Krio Comedy Show',   type: 'VIP',     amount: 84,     method: 'Orange Money', time: '1h ago' },
]

// Mini bar chart data (last 7 days)
const CHART = [
  { day: 'Mon', tickets: 42,  revenue: 3800 },
  { day: 'Tue', tickets: 68,  revenue: 6200 },
  { day: 'Wed', tickets: 55,  revenue: 4900 },
  { day: 'Thu', tickets: 91,  revenue: 8400 },
  { day: 'Fri', tickets: 134, revenue: 12100 },
  { day: 'Sat', tickets: 210, revenue: 19500 },
  { day: 'Sun', tickets: 88,  revenue: 8200 },
]
const maxRevenue = Math.max(...CHART.map(d => d.revenue))

const EVENTS = [
  { title: 'Freetown Vibes Fest 2025', sold: 312,  cap: 1200, pct: 26, status: 'live' },
  { title: 'Big Afrobeats Night',       sold: 198,  cap: 350,  pct: 57, status: 'live' },
  { title: 'Krio Comedy Show',          sold: 89,   cap: 500,  pct: 18, status: 'live' },
]

export default function OrganizerDashboard() {
  const [activeTab, setActiveTab] = useState<'overview'|'transactions'>('overview')

  return (
    <div style={S.page}>

      {/* Top bar */}
      <div style={S.topbar}>
        <div>
          <div style={S.logo}>BEATIX</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>Organizer Portal</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link href="/organizer/create-event" style={{ textDecoration: 'none' }}>
            <div style={{ background: '#F5C842', color: '#0D0B2B', borderRadius: 10, padding: '7px 14px', fontFamily: "'Syne', sans-serif", fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' as const }}>+ New Event</div>
          </Link>
          <div style={S.avatar}>SL</div>
        </div>
      </div>

      {/* Greeting */}
      <div style={{ padding: '4px 20px 20px' }}>
        <div style={{ ...S.heading }}>Good evening 👋</div>
        <div style={S.sub}>Sierra Live Entertainment · <span style={{ color: '#A855D4' }}>✓ Verified</span></div>
      </div>

      {/* Stats grid */}
      <div style={{ padding: '0 20px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {STATS.map(stat => (
          <div key={stat.label} style={{ ...S.card, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ fontSize: 22 }}>{stat.icon}</div>
              {stat.change && (
                <div style={{ background: stat.up ? 'rgba(245,200,66,0.12)' : 'rgba(255,80,80,0.12)', color: stat.up ? '#F5C842' : '#FF6B6B', fontSize: 10, fontWeight: 600, padding: '3px 7px', borderRadius: 20 }}>
                  {stat.change}
                </div>
              )}
            </div>
            <div style={{ ...S.bigNum, fontSize: 18 }}>{stat.value}</div>
            <div style={S.label}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div style={{ ...S.section }}>
        <div style={{ ...S.card, padding: '16px 16px 12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700 }}>Sales This Week</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>NLe 63,100 total</div>
          </div>
          {/* Bar chart */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80, marginBottom: 8 }}>
            {CHART.map((d, i) => {
              const h = Math.round((d.revenue / maxRevenue) * 72)
              const isToday = i === 5
              return (
                <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: '100%', height: h, borderRadius: '4px 4px 0 0', background: isToday ? '#F5C842' : 'rgba(168,85,212,0.4)', position: 'relative' as const, transition: 'height 0.3s' }} />
                  <div style={{ fontSize: 9, color: isToday ? '#F5C842' : 'rgba(255,255,255,0.35)', fontWeight: isToday ? 700 : 400 }}>{d.day}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Live events progress */}
      <div style={S.section}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Live Events</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {EVENTS.map(ev => (
            <div key={ev.title} style={{ ...S.card, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 500, flex: 1, marginRight: 8, whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.title}</div>
                <div style={{ background: 'rgba(80,220,100,0.12)', color: '#50DC64', fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 20, flexShrink: 0 }}>● LIVE</div>
              </div>
              <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden', marginBottom: 6 }}>
                <div style={{ height: '100%', width: `${ev.pct}%`, background: 'linear-gradient(90deg,#6B2FA0,#F5C842)', borderRadius: 4 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
                <span>{ev.sold} sold</span>
                <span>{ev.pct}% of {ev.cap}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ padding: '0 20px 14px', display: 'flex', gap: 10 }}>
        {(['overview','transactions'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '8px 18px', borderRadius: 40, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none', background: activeTab === tab ? '#F5C842' : '#1A1845', color: activeTab === tab ? '#0D0B2B' : 'rgba(255,255,255,0.5)', fontFamily: "'DM Sans', sans-serif", textTransform: 'capitalize' as const }}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'transactions' && (
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {TRANSACTIONS.map((tx, i) => (
            <div key={i} style={{ ...S.card, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: tx.method === 'Afrimoney' ? '#FF6B00' : tx.method === 'Orange Money' ? '#FF7900' : 'linear-gradient(135deg,#6B2FA0,#A855D4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {tx.method === 'Afrimoney' ? 'AFR' : tx.method === 'Orange Money' ? 'OM' : 'CARD'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 2, whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' }}>{tx.name} · {tx.type}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{tx.event} · {tx.time}</div>
              </div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, color: '#F5C842', flexShrink: 0 }}>NLe {tx.amount}</div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'overview' && (
        <div style={S.section}>
          {/* Earnings panel */}
          <div style={{ ...S.card, padding: 20, marginBottom: 12 }}>
            <div style={S.label}>Available Balance</div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 32, fontWeight: 800, color: '#F5C842', marginBottom: 4 }}>NLe 41,280</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>After Beatix service fees · Updated live</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 12 }}>
                <div style={S.label}>Total Earned</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700 }}>NLe 48,250</div>
              </div>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 12 }}>
                <div style={S.label}>Paid Out</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700 }}>NLe 6,970</div>
              </div>
            </div>
          </div>
          <button style={S.btnGold}>Request Payout</button>
          <div style={{ height: 10 }} />
          <Link href="/organizer/team" style={{ textDecoration: 'none', display: 'block' }}>
            <button style={S.btnOutline}>Manage Team</button>
          </Link>
        </div>
      )}

      <div style={{ height: 20 }} />

      <BottomNav />
    </div>
  )
}
