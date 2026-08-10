'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/AuthContext';

const API = process.env.NEXT_PUBLIC_API_URL;

interface UserProfile {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
}

interface Ticket {
  id: string;
  qr_code: string;
  status: string;
  purchased_at: string;
  ticket_category: string;
  event_title: string;
  event_date: string;
  event_location: string;
  event_image: string | null;
}

interface FormState {
  name: string;
  phone: string;
  email: string;
}

export default function ProfilePage() {
  const { logout, getToken } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormState>({ name: '', phone: '', email: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const authHeaders = useCallback((): HeadersInit => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  }), [getToken]);

  const loadProfile = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/profile`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) {
        setProfile(data.user);
        setForm({ name: data.user.name ?? '', phone: data.user.phone ?? '', email: data.user.email ?? '' });
      }
    } catch (err) {
      console.error('Load profile error:', err);
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  const loadTickets = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/profile/tickets`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setTickets(data.tickets);
    } catch (err) {
      console.error('Load tickets error:', err);
    }
  }, [authHeaders]);

  useEffect(() => {
    loadProfile();
    loadTickets();
  }, [loadProfile, loadTickets]);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch(`${API}/api/profile`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setProfile(data.user);
        setEditing(false);
        setMessage('Profile updated!');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch {
      setMessage('Failed to update. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading profile...</p>
        <style jsx>{`
          .loading-screen { min-height:100vh; background:#0D0B2B; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#fff; gap:12px; }
          .spinner { width:36px; height:36px; border:3px solid rgba(107,47,160,0.3); border-top-color:#6B2FA0; border-radius:50%; animation:spin 0.8s linear infinite; }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Header */}
      <div className="profile-header">
        <div className="avatar-circle">
          {profile?.avatar_url
            ? <img src={profile.avatar_url} alt="Avatar" className="avatar-img" />
            : <span>{profile?.name?.[0]?.toUpperCase() ?? '?'}</span>
          }
        </div>
        <h1 className="profile-name">{profile?.name}</h1>
        <p className="profile-role">{profile?.role === 'admin' ? '⭐ Admin' : 'Member'}</p>
      </div>

      {/* Info Card */}
      <div className="info-card">
        <div className="card-header">
          <h2>Personal Info</h2>
          {!editing
            ? <button type="button" className="edit-btn" onClick={() => setEditing(true)}>Edit</button>
            : (
              <div className="edit-actions">
                <button type="button" className="cancel-btn" onClick={() => setEditing(false)}>Cancel</button>
                <button type="button" className="save-btn" onClick={handleSave} disabled={saving}>
                  {saving ? '...' : 'Save'}
                </button>
              </div>
            )
          }
        </div>

        {message && <p className="msg">{message}</p>}

        <div className="info-fields">
          {[
            { label: 'Name', key: 'name', type: 'text', placeholder: 'Full name' },
            { label: 'Phone', key: 'phone', type: 'tel', placeholder: '+23276...' },
            { label: 'Email', key: 'email', type: 'email', placeholder: 'you@example.com' },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key} className="field">
              <label>{label}</label>
              {editing
                ? (
                  <input
                    className="field-input"
                    type={type}
                    placeholder={placeholder}
                    value={form[key as keyof FormState]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  />
                )
                : <span>{profile?.[key as keyof UserProfile] as string || '—'}</span>
              }
            </div>
          ))}
          <div className="field">
            <label>Member Since</label>
            <span>
              {profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
                : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Ticket History */}
      <div className="tickets-section">
        <h2 className="section-title">🎟️ My Tickets</h2>
        {tickets.length === 0
          ? (
            <div className="empty-tickets">
              <p>No tickets yet.</p>
              <button type="button" onClick={() => router.push('/home')} className="browse-btn">Browse Events</button>
            </div>
          )
          : tickets.map((ticket) => (
            <div key={ticket.id} className="ticket-card">
              {ticket.event_image && (
                <img src={ticket.event_image} alt={ticket.event_title} className="ticket-event-img" />
              )}
              <div className="ticket-info">
                <h3>{ticket.event_title}</h3>
                <p>📅 {ticket.event_date ? new Date(ticket.event_date).toLocaleDateString('en-GB') : '—'}</p>
                <p>📍 {ticket.event_location}</p>
                <p>🎫 {ticket.ticket_category}</p>
                <span className={`ticket-status ${ticket.status}`}>{ticket.status}</span>
              </div>
            </div>
          ))
        }
      </div>

      {/* Logout */}
      <button type="button" className="logout-btn" onClick={logout}>Sign Out</button>

      <style jsx>{`
        .profile-page { min-height:100vh; background:#0D0B2B; padding:24px 20px 80px; font-family:'Inter',sans-serif; }
        .profile-header { text-align:center; padding:32px 0 24px; }
        .avatar-circle { width:88px; height:88px; border-radius:50%; background:linear-gradient(135deg,#6B2FA0,#F5C842); display:flex; align-items:center; justify-content:center; margin:0 auto 16px; font-size:36px; font-weight:800; color:#0D0B2B; overflow:hidden; }
        .avatar-img { width:100%; height:100%; object-fit:cover; }
        .profile-name { color:#fff; font-size:24px; font-weight:700; margin:0 0 4px; }
        .profile-role { color:#F5C842; font-size:14px; margin:0; }
        .info-card { background:rgba(107,47,160,0.12); border:1px solid rgba(107,47,160,0.35); border-radius:20px; padding:20px; margin-bottom:20px; }
        .card-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }
        .card-header h2 { color:#fff; font-size:17px; margin:0; }
        .edit-btn { padding:6px 16px; border-radius:8px; border:1px solid #6B2FA0; background:transparent; color:#F5C842; cursor:pointer; font-size:14px; }
        .edit-actions { display:flex; gap:8px; }
        .cancel-btn { padding:6px 14px; border-radius:8px; border:1px solid rgba(255,255,255,0.2); background:transparent; color:rgba(255,255,255,0.6); cursor:pointer; font-size:14px; }
        .save-btn { padding:6px 16px; border-radius:8px; border:none; background:#6B2FA0; color:#fff; cursor:pointer; font-size:14px; font-weight:600; }
        .msg { color:#4caf50; font-size:14px; margin:0 0 12px; }
        .info-fields { display:flex; flex-direction:column; gap:16px; }
        .field { display:flex; flex-direction:column; gap:4px; }
        .field label { color:rgba(255,255,255,0.45); font-size:12px; text-transform:uppercase; letter-spacing:1px; }
        .field span { color:#fff; font-size:15px; }
        .field-input { background:rgba(255,255,255,0.07); border:1px solid rgba(107,47,160,0.5); border-radius:10px; padding:10px 14px; color:#fff; font-size:15px; outline:none; }
        .tickets-section { margin-bottom:24px; }
        .section-title { color:#fff; font-size:18px; margin:0 0 16px; }
        .empty-tickets { text-align:center; padding:32px; color:rgba(255,255,255,0.4); }
        .browse-btn { margin-top:12px; padding:10px 24px; border-radius:10px; border:none; background:#6B2FA0; color:#fff; cursor:pointer; font-size:14px; }
        .ticket-card { background:rgba(107,47,160,0.12); border:1px solid rgba(107,47,160,0.3); border-radius:16px; overflow:hidden; margin-bottom:12px; display:flex; gap:12px; }
        .ticket-event-img { width:80px; height:80px; object-fit:cover; }
        .ticket-info { padding:12px; flex:1; }
        .ticket-info h3 { color:#fff; font-size:15px; margin:0 0 4px; }
        .ticket-info p { color:rgba(255,255,255,0.55); font-size:12px; margin:2px 0; }
        .ticket-status { display:inline-block; margin-top:6px; padding:2px 10px; border-radius:20px; font-size:11px; font-weight:600; text-transform:capitalize; }
        .ticket-status.active { background:rgba(76,175,80,0.2); color:#4caf50; }
        .ticket-status.used { background:rgba(245,200,66,0.15); color:#F5C842; }
        .ticket-status.cancelled { background:rgba(255,107,107,0.15); color:#ff6b6b; }
        .logout-btn { width:100%; padding:16px; border-radius:14px; border:1px solid rgba(255,107,107,0.4); background:rgba(255,107,107,0.1); color:#ff6b6b; font-size:16px; font-weight:600; cursor:pointer; transition:all 0.2s; }
        .logout-btn:hover { background:rgba(255,107,107,0.2); }
      `}</style>
    </div>
  );
}
