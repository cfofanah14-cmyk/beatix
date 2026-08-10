'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function TermsPage() {
  const router = useRouter()
  const [accepted, setAccepted] = useState(false)

  const handleAccept = () => {
    setAccepted(true)
    localStorage.setItem('beatix_terms_accepted', 'true')
    router.push('/')
  }

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: '#0D0B2B', minHeight: '100vh', color: '#fff', maxWidth: 480, margin: '0 auto', padding: '40px 20px 60px' }}>
      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
        Terms & Privacy
      </div>
      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginBottom: 32 }}>
        Please read and accept before continuing
      </div>

      <div style={{ background: '#13113A', borderRadius: 16, padding: 20, marginBottom: 24, fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.8 }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16, color: '#fff', marginBottom: 12 }}>Terms of Service</div>
        <p>By using Beatix, you agree to our terms of service. Beatix is a ticketing platform for events in Sierra Leone.</p>
        <br />
        <p>Tickets are non-transferable and tied to your phone number. All purchases are final unless the event is cancelled by the organizer.</p>
        <br />
        <p>Beatix charges a service fee on each ticket purchase. The fee is shared between the organizer and the buyer as set by the admin.</p>
      </div>

      <div style={{ background: '#13113A', borderRadius: 16, padding: 20, marginBottom: 32, fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.8 }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16, color: '#fff', marginBottom: 12 }}>Privacy Policy</div>
        <p>We collect your phone number and name to process ticket purchases and send confirmations via SMS.</p>
        <br />
        <p>We do not sell your personal data to third parties. Your data is used only to provide the Beatix service.</p>
        <br />
        <p>By using Beatix you consent to receiving SMS notifications about your tickets and events.</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div
          onClick={() => setAccepted(!accepted)}
          style={{ width: 24, height: 24, borderRadius: 6, border: `2px solid ${accepted ? '#F5C842' : 'rgba(255,255,255,0.3)'}`, background: accepted ? '#F5C842' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {accepted && <span style={{ color: '#0D0B2B', fontWeight: 900, fontSize: 14 }}>✓</span>}
        </div>
        <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>
          I have read and agree to the Terms of Service and Privacy Policy
        </span>
      </div>

      <button
        onClick={handleAccept}
        disabled={!accepted}
        style={{ width: '100%', background: accepted ? '#F5C842' : 'rgba(245,200,66,0.3)', color: '#0D0B2B', border: 'none', borderRadius: 16, padding: 18, fontFamily: 'Syne, sans-serif', fontSize: 17, fontWeight: 700, cursor: accepted ? 'pointer' : 'not-allowed' }}>
        Accept and Continue
      </button>
    </div>
  )
}
