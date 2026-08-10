'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/AuthContext';

const API = process.env.NEXT_PUBLIC_API_URL;

interface AdminUser {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  created_at: string;
  last_active: string | null;
  avatar_url: string | null;
}

interface DashboardStats {
  totalUsers: number;
  activeToday: number;
  newThisWeek: number;
  totalTickets: number;
}

function isActiveToday(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return Date.now() - new Date(dateStr).getTime() < 24 * 60 * 60 * 1000;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatRelative(dateStr: string | null): string {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return formatDate(dateStr);
}

export default function AdminDashboard() {
  const { user, getToken } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const authHeaders = useCallback((): HeadersInit => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  }), [getToken]);

  const loadData = useCallback(async (searchTerm = '') => {
    setLoading(true);
    try {
      const [usersRes, statsRes] = await Promise.all([
        fetch(`${API}/api/admin/users${searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ''}`, { headers: authHeaders() }),
        fetch(`${API}/api/admin/stats`, { headers: authHeaders() }),
      ]);
      const usersData = await usersRes.json();
      const statsData = await statsRes.json();
      if (usersData.success) setUsers(usersData.users);
      if (statsData.success) setStats(statsData.stats);
    } catch (err) {
      console.error('Admin load error:', err);
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    if (user && user.role !== 'admin') { router.push('/home'); return; }
    loadData();
  }, [user, loadData, router]);

  useEffect(() => {
    const timeout = setTimeout(() => loadData(search), 400);
    return () => clearTimeout(timeout);
  }, [search, loadData]);

  const statCards = stats ? [
    { label: 'Total Users', value: stats.totalUsers, cls: 'gold' },
    { label: 'Active Today', value: stats.activeToday, cls: 'green' },
    { label: 'New This Week', value: stats.newThisWeek, cls: 'purple' },
    { label: 'Tickets Sold', value: stats.totalTickets, cls: 'blue' },
  ] : [];

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1 className="admin-title">👑 Admin Dashboard</h1>
          <p className="admin-sub">User Activity Overview</p>
        </div>
        <button type="button" className="back-home-btn" onClick={() => router.push('/home')}>← Home</button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="stats-grid">
          {statCards.map(({ label, value, cls }) => (
            <div key={label} className={`stat-card ${cls}`}>
              <span className="stat-num">{value.toLocaleString()}</span>
              <span className="stat-label">{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="search-bar">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading users...</p>
        </div>
      ) : (
        <>
          <p className="result-count">{users.length} user{users.length !== 1 ? 's' : ''} found</p>
          <div className="table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Signed Up</th>
                  <th>Last Active</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar">
                          {u.avatar_url
                            ? <img src={u.avatar_url} alt={u.name} />
                            : <span>{u.name?.[0]?.toUpperCase() ?? '?'}</span>
                          }
                        </div>
                        <span className="user-name">{u.name}</span>
                      </div>
                    </td>
                    <td className="mono">{u.phone ?? '—'}</td>
                    <td className="mono small">{u.email ?? '—'}</td>
                    <td>{formatDate(u.created_at)}</td>
                    <td>
                      <span className={isActiveToday(u.last_active) ? 'active-badge' : 'inactive-text'}>
                        {formatRelative(u.last_active)}
                      </span>
                    </td>
                    <td>
                      <span className={`role-badge ${u.role}`}>{u.role}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="no-results">No users found{search ? ` matching "${search}"` : ''}</div>
            )}
          </div>
        </>
      )}

      <style jsx>{`
        .admin-page { min-height:100vh; background:#0D0B2B; padding:24px 20px 60px; font-family:'Inter',sans-serif; }
        .admin-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:28px; }
        .admin-title { color:#F5C842; font-size:24px; font-weight:800; margin:0 0 4px; }
        .admin-sub { color:rgba(255,255,255,0.4); font-size:14px; margin:0; }
        .back-home-btn { padding:8px 16px; border-radius:10px; border:1px solid rgba(107,47,160,0.5); background:transparent; color:rgba(255,255,255,0.6); cursor:pointer; font-size:13px; }
        .stats-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:24px; }
        .stat-card { border-radius:16px; padding:18px 20px; display:flex; flex-direction:column; gap:4px; border:1px solid; }
        .stat-card.gold { background:rgba(245,200,66,0.08); border-color:rgba(245,200,66,0.25); }
        .stat-card.green { background:rgba(76,175,80,0.08); border-color:rgba(76,175,80,0.25); }
        .stat-card.purple { background:rgba(107,47,160,0.15); border-color:rgba(107,47,160,0.35); }
        .stat-card.blue { background:rgba(41,182,246,0.08); border-color:rgba(41,182,246,0.25); }
        .stat-num { font-size:28px; font-weight:800; color:#fff; }
        .stat-label { font-size:12px; color:rgba(255,255,255,0.5); text-transform:uppercase; letter-spacing:1px; }
        .search-bar { display:flex; align-items:center; gap:10px; background:rgba(107,47,160,0.12); border:1px solid rgba(107,47,160,0.35); border-radius:14px; padding:12px 16px; margin-bottom:16px; }
        .search-icon { font-size:16px; }
        .search-input { flex:1; background:none; border:none; outline:none; color:#fff; font-size:15px; }
        .search-input::placeholder { color:rgba(255,255,255,0.3); }
        .result-count { color:rgba(255,255,255,0.4); font-size:13px; margin-bottom:12px; }
        .table-wrapper { overflow-x:auto; border-radius:16px; border:1px solid rgba(107,47,160,0.25); }
        .users-table { width:100%; border-collapse:collapse; min-width:600px; }
        .users-table th { background:rgba(107,47,160,0.2); color:rgba(255,255,255,0.5); font-size:11px; text-transform:uppercase; letter-spacing:1px; padding:12px 16px; text-align:left; }
        .users-table td { padding:14px 16px; color:rgba(255,255,255,0.8); font-size:14px; border-bottom:1px solid rgba(107,47,160,0.15); }
        .users-table tr:last-child td { border-bottom:none; }
        .users-table tr:hover td { background:rgba(107,47,160,0.08); }
        .user-cell { display:flex; align-items:center; gap:10px; }
        .user-avatar { width:34px; height:34px; border-radius:50%; background:linear-gradient(135deg,#6B2FA0,#F5C842); display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:700; color:#0D0B2B; overflow:hidden; flex-shrink:0; }
        .user-avatar img { width:100%; height:100%; object-fit:cover; }
        .user-name { color:#fff; font-weight:600; }
        .mono { font-family:'Courier New',monospace; font-size:13px; }
        .small { font-size:12px; }
        .active-badge { background:rgba(76,175,80,0.2); color:#4caf50; padding:2px 10px; border-radius:20px; font-size:12px; font-weight:600; }
        .inactive-text { color:rgba(255,255,255,0.35); font-size:13px; }
        .role-badge { padding:2px 10px; border-radius:20px; font-size:11px; font-weight:600; text-transform:capitalize; }
        .role-badge.admin { background:rgba(245,200,66,0.2); color:#F5C842; }
        .role-badge.user { background:rgba(107,47,160,0.2); color:rgba(255,255,255,0.6); }
        .loading-state { display:flex; flex-direction:column; align-items:center; padding:60px; gap:12px; color:rgba(255,255,255,0.4); }
        .spinner { width:32px; height:32px; border:3px solid rgba(107,47,160,0.3); border-top-color:#6B2FA0; border-radius:50%; animation:spin 0.8s linear infinite; }
        @keyframes spin { to { transform:rotate(360deg); } }
        .no-results { padding:40px; text-align:center; color:rgba(255,255,255,0.35); font-size:14px; }
      `}</style>
    </div>
  );
}
