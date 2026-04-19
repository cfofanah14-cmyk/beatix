'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  {
    href: '/',
    label: 'Home',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" width={22} height={22}
        stroke={active ? 'var(--gold)' : 'rgba(255,255,255,0.35)'}
        strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    href: '/explore',
    label: 'Explore',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" width={22} height={22}
        stroke={active ? 'var(--gold)' : 'rgba(255,255,255,0.35)'}
        strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/>
        <path d="m21 21-4.35-4.35"/>
      </svg>
    ),
  },
  {
    href: '/tickets',
    label: 'My Tickets',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" width={22} height={22}
        stroke={active ? 'var(--gold)' : 'rgba(255,255,255,0.35)'}
        strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 9V5a2 2 0 0 1 2-2h4"/>
        <path d="M16 3h4a2 2 0 0 1 2 2v4"/>
        <path d="M22 16v4a2 2 0 0 1-2 2h-4"/>
        <path d="M8 21H4a2 2 0 0 1-2-2v-4"/>
        <rect x="7" y="7" width="3" height="3"/>
        <rect x="14" y="7" width="3" height="3"/>
        <rect x="7" y="14" width="3" height="3"/>
        <path d="M14 14h.01M17 14h.01M14 17h.01M17 17h.01"/>
      </svg>
    ),
  },
  {
    href: '/profile',
    label: 'Profile',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" width={22} height={22}
        stroke={active ? 'var(--gold)' : 'rgba(255,255,255,0.35)'}
        strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: '430px',
      background: 'rgba(13,11,43,0.96)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(255,255,255,0.07)',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      padding: '10px 0 18px',
      zIndex: 100,
    }}>
      {navItems.map((item) => {
        const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 16px',
              textDecoration: 'none',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {item.icon(active)}
            <span style={{
              fontSize: '10px',
              fontWeight: 500,
              fontFamily: 'var(--font-body)',
              color: active ? 'var(--gold)' : 'rgba(255,255,255,0.35)',
              transition: 'color 0.2s',
            }}>
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
