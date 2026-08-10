'use client'

import { useState, useRef, useEffect } from 'react'

// ── Types ────────────────────────────────────────────────────
interface ScanResult {
  status: 'success' | 'rejected' | 'already_used' | 'not_found'
  message: string
  ticket?: {
    eventName: string
    ticketType: string
    buyerName: string
    checkedInAt?: string
  }
}

// ── Mock validate function (replace with real API call) ──────
async function validateQrCode(code: string): Promise<ScanResult> {
  await new Promise(r => setTimeout(r, 900))

  // Simulate different outcomes based on code prefix
  if (code.startsWith('BX-USED')) {
    return {
      status: 'already_used',
      message: 'This ticket has already been scanned.',
      ticket: {
        eventName: 'Freetown Jazz Night',
        ticketType: 'VIP',
        buyerName: 'Aminata Koroma',
        checkedInAt: '8:42 PM',
      },
    }
  }
  if (code.startsWith('BX-INVALID') || code.length < 6) {
    return { status: 'not_found', message: 'Ticket not found. Check the code and try again.' }
  }
  return {
    status: 'success',
    message: 'Entry approved!',
    ticket: {
      eventName: 'Freetown Jazz Night',
      ticketType: 'General Admission',
      buyerName: 'Mohamed Bangura',
    },
  }
}

// ── Colour map ───────────────────────────────────────────────
const STATUS_STYLE: Record<string, { bg: string; border: string; icon: string; label: string }> = {
  success:      { bg: 'rgba(34,197,94,0.12)',  border: '#22C55E', icon: '✓', label: 'APPROVED' },
  already_used: { bg: 'rgba(234,179,8,0.12)',  border: '#EAB308', icon: '!', label: 'ALREADY USED' },
  rejected:     { bg: 'rgba(239,68,68,0.12)',  border: '#EF4444', icon: '✕', label: 'REJECTED' },
  not_found:    { bg: 'rgba(239,68,68,0.12)',  border: '#EF4444', icon: '✕', label: 'NOT FOUND' },
}

export default function ScannerPage() {
  const [manualCode, setManualCode]   = useState('')
  const [scanning,   setScanning]     = useState(false)
  const [result,     setResult]       = useState<ScanResult | null>(null)
  const [camActive,  setCamActive]    = useState(false)
  const [role]                        = useState<'admin' | 'staff'>('admin') // swap with real auth
  const videoRef                      = useRef<HTMLVideoElement>(null)
  const streamRef                     = useRef<MediaStream | null>(null)

  // Guard — only admin/staff
  const allowed = role === 'admin' || role === 'staff'

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      setCamActive(true)
    } catch {
      alert('Camera permission denied or not available on this device.')
    }
  }

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setCamActive(false)
  }

  useEffect(() => () => { stopCamera() }, [])

  const handleScan = async (code: string) => {
    if (!code.trim()) return
    setScanning(true)
    setResult(null)
    const res = await validateQrCode(code.trim())
    setResult(res)
    setScanning(false)
    setManualCode('')
  }

  const reset = () => { setResult(null); setManualCode('') }

  const s = { fontFamily: "'DM Sans', sans-serif" }

  if (!allowed) {
    return (
      <div style={{ ...s, background: '#0D0B2B', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 48 }}>🔒</div>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800 }}>Access Denied</div>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Scanner is restricted to admin and staff.</div>
      </div>
    )
  }

  return (
    <div style={{ ...s, background: '#0D0B2B', minHeight: '100vh', maxWidth: 480, margin: '0 auto', padding: '0 0 48px', color: '#fff' }}>

      {/* Header */}
      <div style={{ background: 'rgba(107,47,160,0.25)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800 }}>Entry Scanner</div>
          <div style={{ fontSize: 12, color: '#A855D4', marginTop: 2 }}>Freetown Jazz Night · Tonight</div>
        </div>
        <div style={{ background: 'rgba(168,85,212,0.2)', border: '1px solid rgba(168,85,212,0.4)', borderRadius: 20, padding: '4px 12px', fontSize: 12, color: '#A855D4', fontWeight: 600 }}>
          {role.toUpperCase()}
        </div>
      </div>

      <div style={{ padding: '24px 20px' }}>

        {/* Camera viewfinder */}
        <div style={{ position: 'relative', background: '#13113A', borderRadius: 20, overflow: 'hidden', marginBottom: 20, aspectRatio: '1/1', border: '1.5px solid rgba(255,255,255,0.08)' }}>
          {camActive ? (
            <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, padding: 32 }}>
              <div style={{ fontSize: 64, opacity: 0.4 }}>📷</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>Camera preview appears here.<br />Use manual entry below to test.</div>
            </div>
          )}

          {/* Scan corners overlay */}
          {camActive && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <div style={{ width: 200, height: 200, position: 'relative' }}>
                {['top-left','top-right','bottom-left','bottom-right'].map(pos => (
                  <div key={pos} style={{
                    position: 'absolute',
                    width: 32, height: 32,
                    borderColor: '#F5C842', borderStyle: 'solid',
                    borderWidth: pos.includes('top') ? '3px 0 0' : '0 0 3px',
                    ...(pos.includes('left') ? { left: 0, borderLeftWidth: 3, borderRightWidth: 0 } : { right: 0, borderRightWidth: 3, borderLeftWidth: 0 }),
                    ...(pos.includes('top') ? { top: 0 } : { bottom: 0 }),
                  }} />
                ))}
                <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 2, background: 'rgba(245,200,66,0.6)', animation: 'scan 2s ease-in-out infinite' }} />
              </div>
            </div>
          )}
        </div>

        {/* Camera toggle */}
        <button
          onClick={camActive ? stopCamera : startCamera}
          style={{ width: '100%', background: camActive ? 'rgba(239,68,68,0.15)' : 'rgba(107,47,160,0.3)', border: `1px solid ${camActive ? '#EF4444' : '#6B2FA0'}`, borderRadius: 14, padding: 14, color: camActive ? '#EF4444' : '#A855D4', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginBottom: 20, fontFamily: "'Syne', sans-serif" }}>
          {camActive ? '⏹ Stop Camera' : '📷 Start Camera Scanner'}
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>or enter code manually</div>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
        </div>

        {/* Manual entry */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          <input
            value={manualCode}
            onChange={e => setManualCode(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && handleScan(manualCode)}
            placeholder="BX-XXXXXXXXXXXXXXXX"
            style={{ flex: 1, background: '#1A1845', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '14px 16px', color: '#fff', fontFamily: "'DM Sans', sans-serif", fontSize: 14, outline: 'none', letterSpacing: 1 }}
          />
          <button
            onClick={() => handleScan(manualCode)}
            disabled={!manualCode.trim() || scanning}
            style={{ background: '#F5C842', color: '#0D0B2B', border: 'none', borderRadius: 12, padding: '14px 20px', fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
            {scanning ? '…' : 'Scan'}
          </button>
        </div>

        {/* Test helpers */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Test codes</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { label: '✓ Valid',       code: 'BX-VALID123456' },
              { label: '! Used',        code: 'BX-USED123456' },
              { label: '✕ Not found',   code: 'BX-INVALID' },
            ].map(t => (
              <button key={t.code} onClick={() => handleScan(t.code)}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 12px', color: 'rgba(255,255,255,0.6)', fontSize: 12, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Result card */}
        {scanning && (
          <div style={{ background: '#13113A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Validating ticket…</div>
          </div>
        )}

        {result && !scanning && (() => {
          const st = STATUS_STYLE[result.status]
          return (
            <div style={{ background: st.bg, border: `1.5px solid ${st.border}`, borderRadius: 18, padding: 24 }}>
              {/* Status badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: result.ticket ? 20 : 0 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: st.border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: '#fff', fontWeight: 700, flexShrink: 0 }}>
                  {st.icon}
                </div>
                <div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: st.border }}>{st.label}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{result.message}</div>
                </div>
              </div>

              {/* Ticket info */}
              {result.ticket && (
                <div style={{ borderTop: `1px solid ${st.border}30`, paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { label: 'Event',        value: result.ticket.eventName },
                    { label: 'Ticket Type',  value: result.ticket.ticketType },
                    { label: 'Buyer',        value: result.ticket.buyerName },
                    ...(result.ticket.checkedInAt ? [{ label: 'Checked In', value: result.ticket.checkedInAt }] : []),
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>{row.label}</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Scan again */}
              <button onClick={reset} style={{ marginTop: 20, width: '100%', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 12, padding: 12, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'Syne', sans-serif" }}>
                Scan Next Ticket
              </button>
            </div>
          )
        })()}
      </div>

      <style>{`
        @keyframes scan {
          0%,100% { top: 10%; }
          50% { top: 90%; }
        }
      `}</style>
    </div>
  )
}
