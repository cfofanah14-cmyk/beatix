'use client'

interface Props {
  message?: string
  fullScreen?: boolean
}

export default function LoadingScreen({ message = 'Loading…', fullScreen = true }: Props) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 16,
      ...(fullScreen ? { minHeight: '60vh' } : { padding: '40px 0' }),
    }}>
      {/* Spinner */}
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        border: '3px solid rgba(168,85,212,0.2)',
        borderTopColor: '#A855D4',
        animation: 'spin 0.8s linear infinite',
      }} />
      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', fontFamily: "'DM Sans', sans-serif" }}>
        {message}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
