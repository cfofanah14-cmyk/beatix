'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../lib/AuthContext'

export default function OrganizerLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isApprovedOrganizer, organizerLoading, switchToOrganizer } = useAuth()
  const router = useRouter()

  const isAdmin = user?.role === 'admin'
  const stillChecking = loading || organizerLoading

  // Not signed in at all — send to onboarding, same as the rest of the app.
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/onboarding')
    }
  }, [user, loading, router])

  // Landing directly on an organizer route (e.g. bookmark, refresh) should put
  // the nav into organizer view automatically, so the tabs highlight correctly.
  useEffect(() => {
    if (isApprovedOrganizer) {
      switchToOrganizer()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isApprovedOrganizer])

  if (stillChecking) {
    return (
      <div style={{ minHeight: '100vh', background: '#0D0B2B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, border: '3px solid rgba(107,47,160,0.3)', borderTopColor: '#6B2FA0', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
        <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!user) {
    // Redirecting to /onboarding via the effect above — render nothing meanwhile.
    return null
  }

  // The real gate: only approved organizers and admins get through.
  // This mirrors the backend's requireApprovedOrganizer middleware exactly,
  // so a person can never see organizer UI the API would refuse to serve.
  if (!isApprovedOrganizer && !isAdmin) {
    return (
      <div style={{ background: '#0D0B2B', minHeight: '100vh', maxWidth: 430, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, fontFamily: "'DM Sans', sans-serif", color: '#fff', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 10 }}>
          You can&apos;t access this dashboard
        </div>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, marginBottom: 28 }}>
          This area is only available to approved Beatix organizers. If you believe you should have access, reach out to the Beatix team.
        </p>
        <button
          onClick={() => router.push('/')}
          style={{ background: '#F5C842', color: '#0D0B2B', border: 'none', borderRadius: 14, padding: '14px 28px', fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
        >
          Back to Home
        </button>
      </div>
    )
  }

  return <>{children}</>
}
