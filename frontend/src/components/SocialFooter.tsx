'use client'

const SOCIALS = [
  { label: 'Instagram', icon: '📸', color: '#E1306C', url: 'https://instagram.com/beatixsl' },
  { label: 'Facebook',  icon: '👥', color: '#1877F2', url: 'https://facebook.com/beatixsl'  },
  { label: 'TikTok',    icon: '🎵', color: '#010101', url: 'https://tiktok.com/@beatixsl'   },
]

export default function SocialFooter() {
  return (
    <div style={{
      margin: '8px 20px 0',
      background: '#13113A',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 16,
      padding: '14px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <div>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 12, fontWeight: 700, marginBottom: 2 }}>Follow Beatix</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Stay updated on events</div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        {SOCIALS.map(s => (
          <a
            key={s.label}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            title={`Follow us on ${s.label}`}
            style={{
              width: 38, height: 38, borderRadius: 10,
              background: s.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, textDecoration: 'none',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.8' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
          >
            {s.icon}
          </a>
        ))}
      </div>
    </div>
  )
}
