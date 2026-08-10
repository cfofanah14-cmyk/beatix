'use client'

import { useState } from 'react'

interface CheckItem {
  id: string
  label: string
  critical: boolean
}

interface Section {
  title: string
  icon: string
  items: CheckItem[]
}

const SECTIONS: Section[] = [
  {
    title: 'Backend & Database', icon: '🗄️',
    items: [
      { id: 'db-url',        label: 'DATABASE_URL set to production PostgreSQL',   critical: true  },
      { id: 'db-migrations', label: 'All migrations run on production DB',          critical: true  },
      { id: 'db-backups',    label: 'Automated daily backups scheduled',            critical: true  },
      { id: 'jwt-secret',    label: 'JWT_SECRET is strong (≥32 random chars)',      critical: true  },
      { id: 'health-check',  label: '/health endpoint returns 200',                 critical: true  },
      { id: 'node-env',      label: 'NODE_ENV=production confirmed',                critical: true  },
    ],
  },
  {
    title: 'Payments', icon: '💳',
    items: [
      { id: 'flw-live',      label: 'Flutterwave switched to live keys',            critical: true  },
      { id: 'flw-webhook',   label: 'Flutterwave webhook URL registered',           critical: true  },
      { id: 'fee-check',     label: 'Service fee deduction tested end-to-end',      critical: true  },
      { id: 'payout-test',   label: 'Organizer payout flow tested',                 critical: false },
      { id: 'refund-test',   label: 'Refund flow tested',                           critical: false },
    ],
  },
  {
    title: 'Notifications', icon: '📱',
    items: [
      { id: 'twilio-live',   label: 'Twilio switched to live credentials',          critical: true  },
      { id: 'sms-ticket',    label: 'Ticket confirmation SMS sends correctly',       critical: true  },
      { id: 'sms-reminder',  label: 'Event reminder SMS sends correctly',            critical: false },
    ],
  },
  {
    title: 'Security', icon: '🔒',
    items: [
      { id: 'https',         label: 'HTTPS enforced on all endpoints',              critical: true  },
      { id: 'cors',          label: 'CORS restricted to production domain only',    critical: true  },
      { id: 'rate-limit',    label: 'Rate limiting active on auth endpoints',       critical: true  },
      { id: 'helmet',        label: 'Helmet security headers enabled',              critical: true  },
      { id: 'no-test-data',  label: 'All test/dummy data removed from prod DB',     critical: true  },
    ],
  },
  {
    title: 'Frontend', icon: '🖥️',
    items: [
      { id: 'mobile-375',    label: 'All screens tested at 375px width',            critical: true  },
      { id: 'mobile-430',    label: 'All screens tested at 430px width',            critical: true  },
      { id: 'ios-test',      label: 'Tested on real iOS device (Safari)',           critical: true  },
      { id: 'android-test',  label: 'Tested on real Android device (Chrome)',       critical: true  },
      { id: 'slow-3g',       label: 'Tested on slow 3G connection',                 critical: false },
      { id: 'lighthouse',    label: 'Lighthouse score ≥ 80 on mobile',             critical: false },
      { id: 'no-console-err',label: 'Zero console errors in production build',      critical: true  },
    ],
  },
  {
    title: 'Legal & Trust', icon: '📄',
    items: [
      { id: 'terms-signup',  label: 'Terms & Privacy shown and accepted at signup', critical: true  },
      { id: 'privacy-page',  label: '/terms page live and accurate',                critical: true  },
      { id: 'contact-info',  label: 'Support contact info correct',                 critical: false },
      { id: 'krio-copy',     label: 'Krio translations reviewed by native speaker', critical: false },
    ],
  },
  {
    title: 'Monitoring', icon: '📊',
    items: [
      { id: 'error-monitor', label: 'Error monitoring set up (e.g. Sentry)',        critical: false },
      { id: 'uptime',        label: 'Uptime monitoring configured',                 critical: false },
      { id: 'logs',          label: 'Server logs accessible in Railway dashboard',  critical: true  },
    ],
  },
]

export default function LaunchCheckPage() {
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  const toggle = (id: string) => setChecked(p => ({ ...p, [id]: !p[id] }))

  const allItems    = SECTIONS.flatMap(s => s.items)
  const critItems   = allItems.filter(i => i.critical)
  const doneAll     = allItems.filter(i => checked[i.id]).length
  const doneCrit    = critItems.filter(i => checked[i.id]).length
  const pct         = Math.round((doneAll / allItems.length) * 100)
  const critPct     = Math.round((doneCrit / critItems.length) * 100)
  const readyToLaunch = doneCrit === critItems.length

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#0D0B2B', minHeight: '100vh', color: '#fff', maxWidth: 480, margin: '0 auto', paddingBottom: 60 }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(180deg,rgba(107,47,160,0.4),transparent)', padding: '40px 20px 24px' }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Launch Readiness 🚀</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)' }}>Check everything before going live</div>

        {/* Overall progress */}
        <div style={{ marginTop: 24, background: '#13113A', borderRadius: 16, padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Overall progress</span>
            <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 800, color: '#F5C842' }}>{pct}%</span>
          </div>
          <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: '#F5C842', borderRadius: 3, transition: 'width 0.4s' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Critical items</span>
            <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 800, color: critPct === 100 ? '#22C55E' : '#EF4444' }}>{doneCrit}/{critItems.length}</span>
          </div>
          <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${critPct}%`, background: critPct === 100 ? '#22C55E' : '#EF4444', borderRadius: 3, transition: 'width 0.4s' }} />
          </div>

          {/* Launch status badge */}
          <div style={{ marginTop: 16, textAlign: 'center', background: readyToLaunch ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.1)', border: `1px solid ${readyToLaunch ? '#22C55E' : '#EF4444'}`, borderRadius: 12, padding: '10px', fontSize: 14, fontWeight: 700, color: readyToLaunch ? '#22C55E' : '#EF4444', fontFamily: "'Syne', sans-serif" }}>
            {readyToLaunch ? '✓ All critical checks passed — ready to launch!' : `⚠ ${critItems.length - doneCrit} critical item${critItems.length - doneCrit !== 1 ? 's' : ''} remaining`}
          </div>
        </div>
      </div>

      {/* Sections */}
      <div style={{ padding: '8px 20px' }}>
        {SECTIONS.map(section => {
          const done = section.items.filter(i => checked[i.id]).length
          return (
            <div key={section.title} style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700 }}>
                  {section.icon} {section.title}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{done}/{section.items.length}</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {section.items.map(item => (
                  <div key={item.id}
                    onClick={() => toggle(item.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, background: checked[item.id] ? 'rgba(34,197,94,0.07)' : '#13113A', border: `1px solid ${checked[item.id] ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 12, padding: '13px 14px', cursor: 'pointer', transition: 'all 0.2s' }}>

                    {/* Checkbox */}
                    <div style={{ width: 22, height: 22, borderRadius: 6, background: checked[item.id] ? '#22C55E' : 'transparent', border: `2px solid ${checked[item.id] ? '#22C55E' : 'rgba(255,255,255,0.25)'}`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#fff', fontWeight: 700, transition: 'all 0.2s' }}>
                      {checked[item.id] && '✓'}
                    </div>

                    <span style={{ fontSize: 13, color: checked[item.id] ? 'rgba(255,255,255,0.5)' : '#fff', textDecoration: checked[item.id] ? 'line-through' : 'none', flex: 1, lineHeight: 1.4 }}>
                      {item.label}
                    </span>

                    {item.critical && !checked[item.id] && (
                      <span style={{ fontSize: 10, background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 20, padding: '2px 8px', fontWeight: 700, flexShrink: 0 }}>
                        CRITICAL
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
