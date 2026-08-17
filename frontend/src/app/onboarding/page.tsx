'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/AuthContext';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';

type Mode = 'main' | 'login' | 'register';

interface FormState {
  name: string;
  phone: string;
  password: string;
}

export default function OnboardingPage() {
  const { saveSession, user, loading } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('main');
  const [form, setForm] = useState<FormState>({ name: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      router.replace('/home');
    }
  }, [user, loading, router]);

  // — Google Sign In ——————————————————————————
  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    setError('');
    setSubmitting(true);

    // credentialResponse.credential IS the Google ID token (JWT string).
    const idToken = credentialResponse.credential;

    if (!idToken) {
      setError('Google did not return a credential. Please try again.');
      setSubmitting(false);
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      setError('API URL is not configured. Check NEXT_PUBLIC_API_URL in Vercel settings.');
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: idToken }),
      });

      let data: { success?: boolean; token?: string; user?: any; message?: string };
      try {
        data = await res.json();
      } catch {
        setError(`Server returned an invalid response (HTTP ${res.status}). Check backend is running.`);
        setSubmitting(false);
        return;
      }

      if (!res.ok || !data.success) {
        setError(data.message || `Sign-in failed (HTTP ${res.status}). Check backend logs.`);
        setSubmitting(false);
        return;
      }

      if (!data.token || !data.user) {
        setError('Server response missing token. Check backend authController.');
        setSubmitting(false);
        return;
      }

      saveSession(data.token, data.user);
      router.replace('/home');

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      if (message.toLowerCase().includes('fetch')) {
        setError(`Cannot reach backend at ${apiUrl}. Check NEXT_PUBLIC_API_URL and CORS settings.`);
      } else {
        setError(`Network error: ${message}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleError = () => {
    setError(
      'Google sign-in was cancelled or blocked. Make sure this domain is listed in ' +
      'Authorized JavaScript Origins in Google Cloud Console.'
    );
  };

  // — Phone/Password Auth ——————————————————————————
  const handlePhoneAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';

    try {
      const body = mode === 'register'
        ? { name: form.name, phone: form.phone, password: form.password }
        : { phone: form.phone, password: form.password };

      const res = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || 'Authentication failed');
        return;
      }

      saveSession(data.token, data.user);
      router.replace('/home');
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0D0B2B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, border: '3px solid rgba(107,47,160,0.3)', borderTopColor: '#6B2FA0', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="logo-area">
        <div className="crown">👑</div>
        <h1 className="brand">BEATIX</h1>
        <p className="tagline">Access Every Event, Effortlessly</p>
      </div>

      <div className="follow-us">
        <p className="follow-label">Follow us for event updates</p>
        <div className="follow-links">
          <a
            href="https://www.facebook.com/share/1CSfzPy4Es/"
            target="_blank"
            rel="noopener noreferrer"
            className="follow-btn facebook"
            aria-label="Follow Beatix on Facebook"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22 12.06C22 6.53 17.52 2.04 12 2.04S2 6.53 2 12.06c0 5 3.66 9.14 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.9h-2.34v7c4.78-.76 8.44-4.9 8.44-9.9z" />
            </svg>
            Facebook
          </a>
          <a
            href="https://www.instagram.com/beatix1_"
            target="_blank"
            rel="noopener noreferrer"
            className="follow-btn instagram"
            aria-label="Follow Beatix on Instagram"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92-.06-1.27-.07-1.65-.07-4.85s.02-3.58.07-4.85c.15-3.23 1.67-4.77 4.92-4.92 1.27-.06 1.65-.07 4.85-.07zm0-2.16C8.74 0 8.33.01 7.05.07 2.7.27.27 2.69.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98 1.28.06 1.69.07 4.95.07s3.67-.01 4.95-.07c4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95C23.72 2.7 21.3.27 16.95.07 15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32zm0 10.16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-10.4a1.44 1.44 0 1 1-2.88 0 1.44 1.44 0 0 1 2.88 0z" />
            </svg>
            Instagram
          </a>
          <a
            href="https://www.tiktok.com/@beattrice738"
            target="_blank"
            rel="noopener noreferrer"
            className="follow-btn tiktok"
            aria-label="Follow Beatix on TikTok"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16.6 5.82c-1.01-.98-1.6-2.34-1.6-3.82h-3.2v14.36c0 1.6-1.3 2.9-2.9 2.9a2.9 2.9 0 0 1-2.9-2.9 2.9 2.9 0 0 1 2.9-2.9c.3 0 .58.05.85.13v-3.26a6.1 6.1 0 0 0-.85-.06A6.1 6.1 0 0 0 2.8 16.36 6.1 6.1 0 0 0 8.9 22.4a6.1 6.1 0 0 0 6.1-6.1V9.13a9.2 9.2 0 0 0 5.38 1.72V7.65a5.8 5.8 0 0 1-3.78-1.83z" />
            </svg>
            TikTok
          </a>
        </div>
      </div>

      {mode === 'main' && (
        <div className="card">
          <h2 className="card-title">Get Started</h2>

          {submitting && (
            <div className="banner">Signing you in with Google...</div>
          )}

          <div className="google-wrap">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="filled_black"
              size="large"
              text="continue_with"
              shape="rectangular"
              useOneTap={false}
            />
          </div>

          <div className="divider"><span>or</span></div>

          <button type="button" className="phone-btn" onClick={() => { setMode('login'); setError(''); }}>
            📱 Sign in with Phone &amp; Password
          </button>
          <button type="button" className="phone-btn secondary" onClick={() => { setMode('register'); setError(''); }}>
            ✨ Create Account with Phone
          </button>

          {error && <p className="error">{error}</p>}
        </div>
      )}

      {(mode === 'login' || mode === 'register') && (
        <div className="card">
          <button type="button" className="back-btn" onClick={() => { setMode('main'); setError(''); }}>← Back</button>
          <h2 className="card-title">{mode === 'register' ? 'Create Account' : 'Sign In'}</h2>

          <form onSubmit={handlePhoneAuth} className="form">
            {mode === 'register' && (
              <input className="input" type="text" placeholder="Full Name"
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                required autoComplete="name" />
            )}
            <input className="input" type="tel" placeholder="Phone (e.g. +23276...)"
              value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required autoComplete="tel" />
            <input className="input" type="password" placeholder="Password"
              value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
              required autoComplete={mode === 'register' ? 'new-password' : 'current-password'} />

            {error && <p className="error">{error}</p>}

            <button type="submit" className="submit-btn" disabled={submitting}>
              {submitting ? 'Please wait...' : mode === 'register' ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <p className="switch">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
              {mode === 'login' ? 'Register' : 'Sign In'}
            </button>
          </p>
        </div>
      )}

      <style jsx>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .page {
          min-height: 100vh; background: #0D0B2B;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 24px; font-family: 'Inter', sans-serif;
        }
        .logo-area { text-align: center; margin-bottom: 20px; }
        .crown { font-size: 52px; margin-bottom: 8px; }
        .brand { font-size: 42px; font-weight: 900; color: #F5C842; letter-spacing: 6px; margin: 0; }
        .tagline { color: rgba(245,200,66,0.6); font-size: 14px; margin: 8px 0 0; }

        .follow-us { text-align: center; margin-bottom: 28px; width: 100%; max-width: 400px; }
        .follow-label { color: rgba(255,255,255,0.5); font-size: 13px; margin: 0 0 10px; }
        .follow-links { display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; }
        .follow-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 14px; border-radius: 10px;
          border: 1px solid rgba(107,47,160,0.4);
          background: rgba(107,47,160,0.15);
          color: #fff; font-size: 13px; text-decoration: none;
          transition: background 0.2s, transform 0.2s;
        }
        .follow-btn:hover { background: rgba(107,47,160,0.35); transform: translateY(-2px); }
        .follow-btn.facebook:hover { background: rgba(24,119,242,0.3); border-color: rgba(24,119,242,0.6); }
        .follow-btn.instagram:hover { background: rgba(225,48,108,0.3); border-color: rgba(225,48,108,0.6); }
        .follow-btn.tiktok:hover { background: rgba(37,244,238,0.2); border-color: rgba(37,244,238,0.5); }

        .card {
          background: rgba(107,47,160,0.15); border: 1px solid rgba(107,47,160,0.4);
          border-radius: 20px; padding: 32px 28px; width: 100%; max-width: 400px;
          backdrop-filter: blur(10px);
        }
        .card-title { color: #fff; font-size: 22px; font-weight: 700; margin: 0 0 24px; text-align: center; }
        .banner {
          background: rgba(107,47,160,0.3); border: 1px solid rgba(107,47,160,0.5);
          border-radius: 10px; padding: 10px; color: rgba(255,255,255,0.8);
          font-size: 14px; text-align: center; margin-bottom: 16px;
        }
        .google-wrap { display: flex; justify-content: center; margin-bottom: 20px; width: 100%; }
        .divider {
          display: flex; align-items: center; gap: 12px;
          margin: 16px 0; color: rgba(255,255,255,0.4); font-size: 13px;
        }
        .divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: rgba(255,255,255,0.15); }
        .phone-btn {
          width: 100%; padding: 14px; border-radius: 12px;
          border: 1px solid rgba(107,47,160,0.5); background: rgba(107,47,160,0.2);
          color: #fff; font-size: 15px; cursor: pointer; margin-bottom: 12px; transition: background 0.2s;
        }
        .phone-btn:hover { background: rgba(107,47,160,0.4); }
        .phone-btn.secondary { background: transparent; border-color: rgba(245,200,66,0.3); color: #F5C842; }
        .phone-btn.secondary:hover { background: rgba(245,200,66,0.1); }
        .form { display: flex; flex-direction: column; gap: 14px; }
        .input {
          padding: 14px 16px; border-radius: 12px;
          border: 1px solid rgba(107,47,160,0.5); background: rgba(255,255,255,0.05);
          color: #fff; font-size: 15px; outline: none; width: 100%; box-sizing: border-box;
        }
        .input:focus { border-color: #6B2FA0; box-shadow: 0 0 0 3px rgba(107,47,160,0.2); }
        .input::placeholder { color: rgba(255,255,255,0.35); }
        .submit-btn {
          padding: 15px; border-radius: 12px; border: none;
          background: linear-gradient(135deg, #6B2FA0, #F5C842);
          color: #0D0B2B; font-size: 16px; font-weight: 700; cursor: pointer; transition: opacity 0.2s;
        }
        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .submit-btn:hover:not(:disabled) { opacity: 0.9; }
        .error { color: #ff6b6b; font-size: 13px; margin: 8px 0 0; text-align: center; line-height: 1.5; }
        .switch { color: rgba(255,255,255,0.5); font-size: 14px; text-align: center; margin-top: 16px; }
        .switch button { background: none; border: none; color: #F5C842; cursor: pointer; font-size: 14px; }
        .back-btn { background: none; border: none; color: rgba(255,255,255,0.5); cursor: pointer; font-size: 14px; margin-bottom: 16px; padding: 0; }
        .back-btn:hover { color: #fff; }
      `}</style>
    </div>
  );
}
