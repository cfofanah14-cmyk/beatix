'use client'

import { useState } from 'react'
import Link from 'next/link'

type TicketType = { id: string; name: string; price: string; capacity: string; description: string }

const CATEGORIES = ['Music', 'Sports', 'Comedy', 'Culture', 'Food', 'Business', 'Fashion', 'Tech', 'Other']

const S = {
  page:    { background: '#0D0B2B', minHeight: '100vh', maxWidth: 430, margin: '0 auto', paddingBottom: 100, fontFamily: "'DM Sans', sans-serif", color: '#fff' },
  header:  { display: 'flex', alignItems: 'center', gap: 14, padding: '20px 20px 16px', position: 'sticky' as const, top: 0, background: '#0D0B2B', zIndex: 10 },
  backBtn: { width: 38, height: 38, borderRadius: '50%', background: '#1A1845', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', textDecoration: 'none' as const, color: '#fff', fontSize: 18, flexShrink: 0 },
  title:   { fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700 },
  section: { padding: '0 20px 24px' },
  label:   { fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: 8, letterSpacing: '0.04em', display: 'block' },
  input:   { width: '100%', background: '#1A1845', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 16px', color: '#fff', fontFamily: "'DM Sans', sans-serif", fontSize: 15, outline: 'none', boxSizing: 'border-box' as const },
  textarea:{ width: '100%', background: '#1A1845', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 16px', color: '#fff', fontFamily: "'DM Sans', sans-serif", fontSize: 15, outline: 'none', resize: 'vertical' as const, minHeight: 90, boxSizing: 'border-box' as const },
  row:     { display: 'flex', gap: 12, marginBottom: 16 },
  card:    { background: '#13113A', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16 },
  divider: { height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 0 24px' },
  sectionHead: { fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, marginBottom: 14 },
}

function InputField({ label, placeholder, value, onChange, type = 'text' }: { label: string; placeholder: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={S.label}>{label}</label>
      <input type={type} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)}
        style={{ ...S.input, color: value ? '#fff' : 'rgba(255,255,255,0.3)' }}
        onFocus={e => { e.target.style.borderColor = 'rgba(168,85,212,0.6)' }}
        onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
      />
    </div>
  )
}

export default function CreateEventPage() {
  const [step, setStep] = useState<'details'|'tickets'|'preview'>('details')
  const [form, setForm] = useState({
    title: '', description: '', category: '', venue: '', city: 'Freetown',
    date: '', time: '', salesEndDate: '', capacity: '', refundPolicy: '',
  })
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([
    { id: '1', name: 'VIP', price: '', capacity: '', description: 'Front zone · Premium experience' },
    { id: '2', name: 'Regular', price: '', capacity: '', description: 'General admission' },
  ])
  const [bannerSet, setBannerSet] = useState(false)
  const [publishing, setPublishing] = useState(false)

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  function addTicketType() {
    setTicketTypes(tt => [...tt, { id: Date.now().toString(), name: '', price: '', capacity: '', description: '' }])
  }

  function removeTicketType(id: string) {
    setTicketTypes(tt => tt.filter(t => t.id !== id))
  }

  function updateTicket(id: string, field: keyof TicketType, value: string) {
    setTicketTypes(tt => tt.map(t => t.id === id ? { ...t, [field]: value } : t))
  }

  const stepPct = step === 'details' ? 33 : step === 'tickets' ? 66 : 100

  return (
    <div style={S.page}>

      {/* Header */}
      <div style={S.header}>
        <Link href="/organizer/dashboard" style={S.backBtn}>←</Link>
        <div style={{ flex: 1 }}>
          <div style={S.title}>Create Event</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>
            {step === 'details' ? 'Step 1 of 3 — Event Details' : step === 'tickets' ? 'Step 2 of 3 — Ticket Categories' : 'Step 3 of 3 — Preview & Publish'}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ padding: '0 20px 24px' }}>
        <div style={{ height: 4, background: '#1A1845', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${stepPct}%`, background: 'linear-gradient(90deg,#6B2FA0,#F5C842)', borderRadius: 4, transition: 'width 0.4s ease' }} />
        </div>
      </div>

      {/* ── STEP 1: EVENT DETAILS ── */}
      {step === 'details' && (
        <div style={S.section}>
          {/* Banner upload */}
          <div style={{ marginBottom: 20 }}>
            <label style={S.label}>Event Banner</label>
            <div
              onClick={() => setBannerSet(!bannerSet)}
              style={{ height: 160, borderRadius: 16, border: `2px dashed ${bannerSet ? '#F5C842' : 'rgba(255,255,255,0.12)'}`, background: bannerSet ? 'linear-gradient(135deg,#6B2FA0 0%,#2D1B4E 50%,#1A1845 100%)' : '#1A1845', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: 8, transition: 'all 0.2s', marginBottom: 4 }}>
              {bannerSet ? (
                <>
                  <span style={{ fontSize: 36 }}>🎵</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Tap to change</span>
                </>
              ) : (
                <>
                  <span style={{ fontSize: 32, opacity: 0.4 }}>🖼️</span>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Tap to upload banner image</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>JPG or PNG · Max 5MB</span>
                </>
              )}
            </div>
          </div>

          <InputField label="Event Name" placeholder="e.g. Freetown Vibes Fest 2025" value={form.title} onChange={v => set('title', v)} />
          <InputField label="Venue Name" placeholder="e.g. Lumley Beach, City Hall" value={form.venue} onChange={v => set('venue', v)} />
          <InputField label="City" placeholder="Freetown" value={form.city} onChange={v => set('city', v)} />

          <div style={S.row}>
            <div style={{ flex: 1 }}>
              <label style={S.label}>Date</label>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
                style={{ ...S.input, colorScheme: 'dark' }}
                onFocus={e => { e.target.style.borderColor = 'rgba(168,85,212,0.6)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={S.label}>Time</label>
              <input type="time" value={form.time} onChange={e => set('time', e.target.value)}
                style={{ ...S.input, colorScheme: 'dark' }}
                onFocus={e => { e.target.style.borderColor = 'rgba(168,85,212,0.6)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={S.label}>Sales End Date (Optional)</label>
            <input type="date" value={form.salesEndDate} onChange={e => set('salesEndDate', e.target.value)}
              style={{ ...S.input, colorScheme: 'dark' }}
              onFocus={e => { e.target.style.borderColor = 'rgba(168,85,212,0.6)' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
            />
          </div>

          {/* Category selector */}
          <div style={{ marginBottom: 16 }}>
            <label style={S.label}>Category</label>
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8 }}>
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => set('category', cat)} style={{ padding: '7px 14px', borderRadius: 30, fontSize: 13, cursor: 'pointer', border: 'none', background: form.category === cat ? '#F5C842' : '#1A1845', color: form.category === cat ? '#0D0B2B' : 'rgba(255,255,255,0.55)', fontFamily: "'DM Sans', sans-serif", fontWeight: form.category === cat ? 600 : 400 }}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={S.label}>Description</label>
            <textarea placeholder="Tell people what to expect at your event…" value={form.description} onChange={e => set('description', e.target.value)}
              style={{ ...S.textarea }}
              onFocus={e => { e.target.style.borderColor = 'rgba(168,85,212,0.6)' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={S.label}>Refund & Cancellation Policy</label>
            <textarea placeholder="e.g. No refunds within 48 hours of event…" value={form.refundPolicy} onChange={e => set('refundPolicy', e.target.value)}
              style={{ ...S.textarea, minHeight: 70 }}
              onFocus={e => { e.target.style.borderColor = 'rgba(168,85,212,0.6)' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
            />
          </div>

          <button onClick={() => setStep('tickets')} style={{ width: '100%', background: '#F5C842', color: '#0D0B2B', border: 'none', borderRadius: 14, padding: 17, fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
            Continue to Tickets →
          </button>
        </div>
      )}

      {/* ── STEP 2: TICKET TYPES ── */}
      {step === 'tickets' && (
        <div style={S.section}>
          <div style={S.sectionHead}>Ticket Categories</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 20 }}>Set pricing and capacity for each ticket type.</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 16 }}>
            {ticketTypes.map((tt, idx) => (
              <div key={tt.id} style={{ ...S.card, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700 }}>Ticket Type {idx + 1}</div>
                  {ticketTypes.length > 1 && (
                    <button onClick={() => removeTicketType(tt.id)} style={{ background: 'rgba(255,80,80,0.12)', border: 'none', color: '#FF6B6B', borderRadius: 8, padding: '5px 10px', fontSize: 11, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Remove</button>
                  )}
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={S.label}>Name (e.g. VIP, Regular, Student)</label>
                  <input value={tt.name} onChange={e => updateTicket(tt.id, 'name', e.target.value)} placeholder="Ticket name"
                    style={{ ...S.input }}
                    onFocus={e => { e.target.style.borderColor = 'rgba(168,85,212,0.6)' }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label style={S.label}>Price (NLe)</label>
                    <input type="number" value={tt.price} onChange={e => updateTicket(tt.id, 'price', e.target.value)} placeholder="0"
                      style={{ ...S.input }}
                      onFocus={e => { e.target.style.borderColor = 'rgba(168,85,212,0.6)' }}
                      onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={S.label}>Capacity</label>
                    <input type="number" value={tt.capacity} onChange={e => updateTicket(tt.id, 'capacity', e.target.value)} placeholder="100"
                      style={{ ...S.input }}
                      onFocus={e => { e.target.style.borderColor = 'rgba(168,85,212,0.6)' }}
                      onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={S.label}>Description (optional)</label>
                  <input value={tt.description} onChange={e => updateTicket(tt.id, 'description', e.target.value)} placeholder="e.g. Front zone · Lounge access"
                    style={{ ...S.input }}
                    onFocus={e => { e.target.style.borderColor = 'rgba(168,85,212,0.6)' }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Add ticket type button */}
          <button onClick={addTicketType} style={{ width: '100%', background: 'transparent', border: '1.5px dashed rgba(168,85,212,0.5)', borderRadius: 14, padding: 14, color: '#A855D4', fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 20 }}>
            + Add Another Ticket Type
          </button>

          {/* Discount code section */}
          <div style={{ ...S.card, padding: 16, marginBottom: 24 }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Discount Codes</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 12 }}>Create promo codes for your audience after publishing.</div>
            <div style={{ background: 'rgba(245,200,66,0.08)', border: '1px solid rgba(245,200,66,0.2)', borderRadius: 10, padding: '10px 12px', fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
              💡 Discount codes can be added from your dashboard after the event is published.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setStep('details')} style={{ flex: 1, background: '#1A1845', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: 15, fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>← Back</button>
            <button onClick={() => setStep('preview')} style={{ flex: 2, background: '#F5C842', color: '#0D0B2B', border: 'none', borderRadius: 14, padding: 15, fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Preview →</button>
          </div>
        </div>
      )}

      {/* ── STEP 3: PREVIEW & PUBLISH ── */}
      {step === 'preview' && (
        <div style={S.section}>
          {/* Preview card */}
          <div style={{ borderRadius: 20, overflow: 'hidden', marginBottom: 20 }}>
            {/* Hero */}
            <div style={{ height: 180, background: 'linear-gradient(135deg,#6B2FA0 0%,#2D1B4E 50%,#1A1845 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' as const }}>
              <span style={{ fontSize: 56 }}>🎵</span>
              <div style={{ position: 'absolute', top: 12, right: 12, background: '#F5C842', color: '#0D0B2B', fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>DRAFT</div>
            </div>
            {/* Info */}
            <div style={{ background: '#13113A', padding: 16 }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, marginBottom: 6 }}>{form.title || 'Your Event Title'}</div>
              <div style={{ fontSize: 13, color: '#A855D4', marginBottom: 14 }}>✓ Sierra Live Entertainment</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' as const }}>
                <div style={{ background: '#1A1845', borderRadius: 10, padding: '8px 12px', fontSize: 12 }}>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, marginBottom: 2 }}>DATE</div>
                  <div style={{ fontWeight: 600 }}>{form.date || 'TBD'}</div>
                </div>
                <div style={{ background: '#1A1845', borderRadius: 10, padding: '8px 12px', fontSize: 12 }}>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, marginBottom: 2 }}>TIME</div>
                  <div style={{ fontWeight: 600 }}>{form.time || 'TBD'}</div>
                </div>
                <div style={{ background: '#1A1845', borderRadius: 10, padding: '8px 12px', fontSize: 12 }}>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, marginBottom: 2 }}>VENUE</div>
                  <div style={{ fontWeight: 600 }}>{form.venue || 'TBD'}</div>
                </div>
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 16, lineHeight: 1.5 }}>{form.description || 'Your event description will appear here.'}</div>

              {/* Ticket preview */}
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Tickets</div>
              {ticketTypes.filter(tt => tt.name).map(tt => (
                <div key={tt.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0D0B2B', borderRadius: 10, padding: '10px 14px', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{tt.name}</div>
                    {tt.description && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{tt.description}</div>}
                  </div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, color: '#F5C842' }}>
                    {tt.price ? `NLe ${tt.price}` : 'Free'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <button onClick={() => setStep('tickets')} style={{ flex: 1, background: '#1A1845', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: 14, fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>← Edit</button>
            <button style={{ flex: 1, background: 'transparent', color: '#A855D4', border: '1.5px solid rgba(168,85,212,0.5)', borderRadius: 14, padding: 14, fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Save Draft</button>
          </div>

          <button
            onClick={() => { setPublishing(true); setTimeout(() => setPublishing(false), 2000) }}
            style={{ width: '100%', background: publishing ? 'rgba(245,200,66,0.5)' : '#F5C842', color: '#0D0B2B', border: 'none', borderRadius: 14, padding: 17, fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s' }}>
            {publishing ? '⏳ Publishing…' : '🚀 Publish Event'}
          </button>

          <div style={{ marginTop: 14, background: 'rgba(168,85,212,0.08)', border: '1px solid rgba(168,85,212,0.2)', borderRadius: 12, padding: '12px 14px', fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>
            ℹ️ Your event will be reviewed by Beatix before going live. This usually takes under 1 hour.
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <nav style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, background: 'rgba(13,11,43,0.96)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '10px 0 18px', zIndex: 100 }}>
        {[
          { href: '/organizer/dashboard', label: 'Dashboard', icon: '📊' },
          { href: '/organizer/create-event', label: 'Create', icon: '➕', active: true },
          { href: '/organizer/team', label: 'Team', icon: '👥' },
          { href: '/profile', label: 'Profile', icon: '👤' },
        ].map(item => (
          <Link key={item.href} href={item.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textDecoration: 'none', padding: '4px 14px' }}>
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 500, color: (item as any).active ? '#F5C842' : 'rgba(255,255,255,0.35)' }}>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
