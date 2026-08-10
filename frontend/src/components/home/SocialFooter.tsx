'use client';

const SOCIAL_LINKS: Record<string, string> = {
  instagram: 'https://instagram.com/beatix_sl',
  facebook: 'https://facebook.com/beatixsl',
  tiktok: 'https://tiktok.com/@beatix_sl',
};

const InstagramIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const FacebookIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const TikTokIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.75a8.17 8.17 0 004.79 1.54V6.84a4.85 4.85 0 01-1.02-.15z" />
  </svg>
);

const icons: Record<string, React.ReactNode> = {
  instagram: <InstagramIcon />,
  facebook: <FacebookIcon />,
  tiktok: <TikTokIcon />,
};

export default function SocialFooter() {
  const openLink = (platform: string) => {
    window.open(SOCIAL_LINKS[platform], '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="social-footer">
      <p className="social-label">Follow Beatix</p>
      <div className="social-icons">
        {Object.keys(SOCIAL_LINKS).map((platform) => (
          <button
            key={platform}
            className="social-btn"
            onClick={() => openLink(platform)}
            aria-label={platform.charAt(0).toUpperCase() + platform.slice(1)}
            type="button"
          >
            {icons[platform]}
          </button>
        ))}
      </div>

      <style jsx>{`
        .social-footer {
          background: #0D0B2B;
          border-top: 1px solid rgba(107,47,160,0.3);
          padding: 16px 24px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .social-label {
          color: rgba(245,200,66,0.6);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin: 0;
        }
        .social-icons { display: flex; gap: 20px; align-items: center; }
        .social-btn {
          width: 46px; height: 46px;
          border-radius: 12px;
          border: 1px solid rgba(107,47,160,0.4);
          background: rgba(107,47,160,0.15);
          color: rgba(255,255,255,0.7);
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.25s ease;
        }
        .social-btn:hover {
          transform: translateY(-3px);
          border-color: #F5C842;
          color: #F5C842;
          background: rgba(245,200,66,0.1);
          box-shadow: 0 6px 20px rgba(245,200,66,0.2);
        }
        .social-btn:active { transform: translateY(0); }
      `}</style>
    </div>
  );
}
