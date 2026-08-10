'use client'

import { useState } from 'react'

// ── TermsAccept ───────────────────────────────────────────────
// Reusable component for embedding at signup.
// Usage:
//   import TermsAccept from '@/components/TermsAccept'
//   <TermsAccept onAccept={() => proceedToNextStep()} />

interface TermsAcceptProps {
  onAccept: () => void
}

export default function TermsAccept({ onAccept }: TermsAcceptProps) {
  const [accepted, setAccepted] = useState(false)

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16, cursor: 'pointer' }}>
        <div
          onClick={() => setAccepted(a => !a)}
          style={{
            width: 22, height: 22, borderRadius: 6,
            background: accepted ? '#A855D4' : 'transparent',
            border: `2px solid ${accepted ? '#A855D4' : 'rgba(255,255,255,0.3)'}`,
            flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginTop: 1, transition: 'all 0.2s', cursor: 'pointer',
          }}>
          {accepted && <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>&#10003;</span>}
        </div>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
          I have read and agree to Beatix&apos;s{' '}
          <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: '#A855D4' }}>Terms of Service</a>
          {' '}and{' '}
          <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: '#A855D4' }}>Privacy Policy</a>.
        </span>
      </label>

      <button
        onClick={() => accepted && onAccept()}
        disabled={!accepted}
        style={{
          width: '100%',
          background: accepted ? '#F5C842' : 'rgba(245,200,66,0.2)',
          color: '#0D0B2B', border: 'none', borderRadius: 14, padding: 16,
          fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700,
          cursor: accepted ? 'pointer' : 'not-allowed', transition: 'background 0.2s',
        }}>
        Accept &amp; Continue
      </button>
    </div>
  )
}
