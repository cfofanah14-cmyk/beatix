'use client'

import { Component, ReactNode } from 'react'

interface Props   { children: ReactNode }
interface State   { hasError: boolean; message: string }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(err: Error): State {
    return { hasError: true, message: err.message }
  }

  componentDidCatch(err: Error) {
    console.error('[Beatix ErrorBoundary]', err)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div style={{
        minHeight: '60vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '32px 24px',
        fontFamily: "'DM Sans', sans-serif", color: '#fff', textAlign: 'center',
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
          Something went wrong
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 28, maxWidth: 280, lineHeight: 1.6 }}>
          {this.state.message || 'An unexpected error occurred. Please try again.'}
        </div>
        <button
          onClick={() => { this.setState({ hasError: false, message: '' }); window.location.reload() }}
          style={{ background: '#F5C842', color: '#0D0B2B', border: 'none', borderRadius: 14, padding: '14px 32px', fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
          Reload Page
        </button>
      </div>
    )
  }
}
