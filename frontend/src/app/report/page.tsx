'use client'

import { useState } from 'react'

type Category = 'payment' | 'ticket' | 'event' | 'account' | 'other' | ''

const CATEGORIES = [
  { id: 'payment', label: 'Payment Issue',     icon: '💳' },
  { id: 'ticket',  label: 'Ticket Problem',    icon: '🎟️' },
  { id: 'event',   label: 'Event Complaint',   icon: '📅' },
  { id: 'account', label: 'Account Help',      icon: '👤' },
  { id: 'other',   label: 'Something Else',    icon: '❓' },
] as const

type Step = 'category' | 'details' | 'submitted'

export default function ReportPage() {
  const [step,        setStep]        = useState<Step>('category')
  const [category,    setCategory]    = useState<Category>('')
  const [description, setDescription] = useState('')
  const [contact,     setContact]     = useState('')
  const [submitting,  setSubmitting]  = useState(false)
  const [refNum,      setRefNum]      = useState('')

  const handleSubmit = async () => {
    if (!description.trim()) return
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 1200)) // simulate API
    const ref = 'BX-' + Math.random().toString(36).slice(2, 8).toUpperCase()
    setRefNum(ref)
    setSubmitting(false)
    setStep('submitted')
  }

  const s = { fontFamily: "'DM Sans', sans-serif" }
  const selectedCat = CATEGORIES.find(c => c.id === category)

  return (
    <div style={{ ...s, background: '#0D0B2B', minHeight: '100vh', color: '#fff', maxWidth: 480, margin: '0 auto', padding: '0 0 60px' }}>

      {/* Header */}
      <div style={{ padding: '40px 20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {step !== 'submitted' && (
          <button onClick={() => step === 'details' ? setStep('category') : window.history.back()}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 22, cursor: 'pointer', padding: 0, marginBottom: 16, lineHeight: 1 }}>
            ←
          </button>
        )}
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800 }}>Report a Problem 🚨</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>
          We'll look into it and get back to you.
        </div>

        {/* Progress bar */}
        {step !== 'submitted' && (
          <div style={{ marginTop: 20, display: 'flex', gap: 6 }}>
            {(['category', 'details'] as Step[]).map(s2 => (
              <div key={s2} style={{ flex: 1, height: 3, borderRadius: 2, background: step === s2 || (step === 'details' && s2 === 'category') ? '#A855D4' : 'rgba(255,255,255,0.1)', transition: 'background 0.3s' }} />
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: '24px 20px' }}>

        {/* ── Step 1: Category ── */}
        {step === 'category' && (
          <>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: 'rgba(255,255,255,0.7)' }}>
              What's the issue about?
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {CATEGORIES.map(c => (
                <button key={c.id} onClick={() => setCategory(c.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, background: category === c.id ? 'rgba(168,85,212,0.15)' : '#13113A', border: `1.5px solid ${category === c.id ? '#A855D4' : 'rgba(255,255,255,0.07)'}`, borderRadius: 14, padding: '16px', cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.2s', color: '#fff' }}>
                  <span style={{ fontSize: 24, width: 36, textAlign: 'center' }}>{c.icon}</span>
                  <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 600 }}>{c.label}</span>
                  {category === c.id && <span style={{ marginLeft: 'auto', color: '#A855D4', fontSize: 18 }}>✓</span>}
                </button>
              ))}
            </div>

            <button onClick={() => category && setStep('details')} disabled={!category}
              style={{ marginTop: 24, width: '100%', background: category ? '#F5C842' : 'rgba(245,200,66,0.2)', color: '#0D0B2B', border: 'none', borderRadius: 14, padding: 16, fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, cursor: category ? 'pointer' : 'not-allowed' }}>
              Continue →
            </button>
          </>
        )}

        {/* ── Step 2: Details ── */}
        {step === 'details' && (
          <>
            {/* Category chip */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(168,85,212,0.12)', border: '1px solid rgba(168,85,212,0.3)', borderRadius: 20, padding: '6px 14px', fontSize: 13, color: '#A855D4', fontWeight: 600, marginBottom: 24 }}>
              {selectedCat?.icon} {selectedCat?.label}
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 8 }}>
                Describe the problem <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Tell us exactly what happened, including any error messages you saw…"
                rows={6}
                style={{ width: '100%', background: '#1A1845', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '14px', color: '#fff', fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box', lineHeight: 1.6 }}
                onFocus={e => { e.target.style.borderColor = 'rgba(168,85,212,0.5)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }}
              />
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 6, textAlign: 'right' }}>
                {description.length}/500
              </div>
            </div>

            <div style={{ marginBottom: 28 }}>
              <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 8 }}>
                Your phone or email (so we can follow up)
              </label>
              <input value={contact} onChange={e => setContact(e.target.value)}
                placeholder="+232 76 000 000 or you@email.com"
                style={{ width: '100%', background: '#1A1845', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '13px 14px', color: '#fff', fontSize: 14, outline: 'none', fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box' }}
                onFocus={e => { e.target.style.borderColor = 'rgba(168,85,212,0.5)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }}
              />
            </div>

            <button onClick={handleSubmit} disabled={!description.trim() || submitting}
              style={{ width: '100%', background: description.trim() ? '#F5C842' : 'rgba(245,200,66,0.2)', color: '#0D0B2B', border: 'none', borderRadius: 14, padding: 16, fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, cursor: description.trim() ? 'pointer' : 'not-allowed' }}>
              {submitting ? 'Submitting…' : 'Submit Report'}
            </button>
          </>
        )}

        {/* ── Step 3: Success ── */}
        {step === 'submitted' && (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(34,197,94,0.12)', border: '2px solid #22C55E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, margin: '0 auto 24px' }}>
              ✓
            </div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, marginBottom: 10 }}>
              Report Received
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 24 }}>
              We'll review your report and get back to you within 24 hours.
            </div>

            {/* Ref number */}
            <div style={{ background: '#13113A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '16px 20px', marginBottom: 32, display: 'inline-block' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Reference number</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: '#F5C842', letterSpacing: 2 }}>{refNum}</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <a href="/help" style={{ display: 'block', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: 14, color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none', fontFamily: "'Syne', sans-serif" }}>
                Back to Help Center
              </a>
              <a href="/" style={{ display: 'block', background: '#F5C842', borderRadius: 14, padding: 14, color: '#0D0B2B', fontSize: 14, fontWeight: 700, textDecoration: 'none', fontFamily: "'Syne', sans-serif" }}>
                Go to Home
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
