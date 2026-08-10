'use client'

import { useRouter } from 'next/navigation'

const SECTIONS = [
  {
    title: '1. Information We Collect',
    body: 'We collect your phone number, name, and payment details when you register or purchase tickets. We also collect device and usage data to improve the app.',
  },
  {
    title: '2. How We Use Your Data',
    body: 'Your data is used to process ticket purchases, send SMS confirmations and reminders, prevent fraud, and improve Beatix services. We do not sell your personal data.',
  },
  {
    title: '3. Payment Data',
    body: 'Payment details are processed by Flutterwave and are not stored on Beatix servers. We only store transaction references and amounts.',
  },
  {
    title: '4. SMS Communications',
    body: 'By registering, you consent to receive transactional SMS messages such as ticket confirmations and event reminders. You may opt out of marketing SMS at any time.',
  },
  {
    title: '5. Data Sharing',
    body: 'We share your name and contact details with event organizers only for events you purchase tickets for. We do not share your data with third parties for marketing.',
  },
  {
    title: '6. Data Security',
    body: 'We use industry-standard encryption and secure servers to protect your data. However, no system is 100% secure and we cannot guarantee absolute security.',
  },
  {
    title: '7. Your Rights',
    body: 'You have the right to access, correct, or delete your personal data. Contact us at privacy@beatix.app to exercise these rights.',
  },
  {
    title: '8. Children',
    body: 'Beatix is not intended for users under 13. We do not knowingly collect data from children.',
  },
  {
    title: '9. Contact',
    body: 'For privacy questions: privacy@beatix.app | +232 76 000 000',
  },
]

export default function PrivacyPage() {
  const router = useRouter()

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#0D0B2B', minHeight: '100vh', color: '#fff', maxWidth: 480, margin: '0 auto', paddingBottom: 60 }}>

      <div style={{ padding: '32px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={() => router.back()}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 22, cursor: 'pointer', padding: 0, marginBottom: 16 }}>
          &larr;
        </button>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800 }}>Privacy Policy 🔒</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Last updated: August 2025</div>
      </div>

      <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {SECTIONS.map(s => (
          <div key={s.title}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{s.title}</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>{s.body}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
