'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../app/lib/AuthContext';

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const BUYER_ITEMS: NavItem[] = [
  { href: '/', label: 'Home', icon: '🏠' },
  { href: '/explore', label: 'Explore', icon: '🔍' },
  { href: '/my-tickets', label: 'My Tickets', icon: '🎟️' },
  { href: '/profile', label: 'Profile', icon: '👤' },
];

const ORGANIZER_ITEMS: NavItem[] = [
  { href: '/organizer/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/organizer/create-event', label: 'Create', icon: '➕' },
  { href: '/organizer/team', label: 'Team', icon: '👥' },
  { href: '/profile', label: 'Profile', icon: '👤' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { activeView } = useAuth();

  // activeView is driven by AuthContext (persisted across refresh, only
  // switchable via switchToOrganizer/switchToBuyer, which themselves check
  // isApprovedOrganizer). This component just renders whichever set is active.
  const items = activeView === 'organizer' ? ORGANIZER_ITEMS : BUYER_ITEMS;

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 430,
        background: 'rgba(13,11,43,0.96)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: '10px 0 18px',
        zIndex: 100,
      }}
    >
      {items.map((item) => {
        // Treat any path under an item's href as "active" (e.g. /events/[id] doesn't
        // match anything here, but /organizer/dashboard/foo would still highlight Dashboard).
        const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              textDecoration: 'none',
              padding: '4px 14px',
            }}
          >
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 500,
                color: active ? '#F5C842' : 'rgba(255,255,255,0.35)',
              }}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
