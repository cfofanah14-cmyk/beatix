'use client'

import { useState } from 'react'
import Link from 'next/link'

type StaffMember = {
  id: string
  name: string
  phone: string
  role: 'scanner' | 'manager'
  status: 'active' | 'pending'
  addedDate: string
  initials: string
  color: string
}

const INITIAL_STAFF: StaffMember[] = [
  { id: '1', name: 'Alhaji Kamara',   phone: '+232 76 123 456', role: 'scanner', status: 'active',  addedDate: '12 Nov 2025', initials: 'AK', color: '#6B2FA0' },
  { id: '2', name: 'Isatu Bangura',   phone: '+232 77 234 567', role: 'manager', status: 'active',  addedDate: '14 Nov 2025', initials: 'IB', color: '#A855D4' },
  { id: '3', name: 'Sorie Conteh',    phone: '+232 76 345 678', role: 'scanner', status: 'active',  addedDate: '18 Nov 2025', initials: 'SC', color: '#D4A017' },
  { id: '4', name: 'Adama Koroma',    phone: '+232 78 456 789', role: 'scanner', status: 'pending', addedDate: '1 Dec 2025',  initials: 'AD', color: '#2D6A4F' },
]

const S = {
  page:    { background: '#0D0B2B', minHeight: '100vh', maxWidth: 430, margin: '0 auto', paddingBottom: 100, fontFamily: "'DM Sans', sans-serif", color: '#fff' },
  header:  { display: 'flex', alignItems: 'center', gap: 14, padding: '20px 20px 16px', position: 'sticky' as const, top: 0, background: '#0D0B2B', zIndex: 10 },
  backBtn: { width: 38, height: 38, borderRadius: '50%', background: '#1A1845', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', textDecoration: 'none' as const, color: '#fff', fontSize: 18, flexShrink: 0 },
  card:    { background: '#13113A', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16 },
  input:   { width: '100%', background: '#1A1845', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 16px', color: '#fff', fontFamily: "'DM Sans', sans-serif", fontSize: 15, outline: 'none', boxSizing: 'border-box' as const },
  label:   { fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: 8, letterSpacing: '0.04em', display: 'block' },
}

export default function TeamManagementPage() {
  const [staff, setStaff] = useState<StaffMember[]>(INITIAL_STAFF)
  const [showAddModal, setShowAddModal] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)
  const [newPhone, setNewPhone] = useState('')
  const [newRole, setNewRole] = useState<'scanner' | 'manager'>('scanner')
  const [adding, setAdding] = useState(false)

  function handleAdd() {
    if (!newPhone.trim()) return
    setAdding(true)
    setTimeout(() => {
      const initials = 'NM'
      setStaff(s => [...s, {
        id: Date.now().toString(),
        name: 'New Member',
        phone: newPhone,
        role: newRole,
        status: 'pending',
        addedDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        initials,
        color: '#1A1845',
      }])
      setNewPhone('')
      setNewRole('scanner')
      setShowAddModal(false)
      setAdding(false)
    }, 800)
  }

  function handleRemove(id: string) {
    setStaff(s => s.filter(m => m.id !== id))
    setConfirmRemove(null)
  }

  function toggleRole(id: string) {
    setStaff(s => s.map(m => m.id === id ? { ...m, role: m.role === 'scanner' ? 'manager' : 'scanner' } : m))
  }

  const scanners = staff.filter(s => s.role === 'scanner')
  const managers = staff.filter(s => s.role === 'manager')

  return (
    <div style={S.page}>

      {/* Header */}
      <div style={S.header}>
        <Link href="/organizer/dashboard" style={S.backBtn}>←</Link>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700 }}>Team Management</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>{staff.length} members · Sierra Live Entertainment</div>
        </div>
        <button onClick={() => setShowAddModal(true)} style={{ background: '#F5C842', color: '#0D0B2B', border: 'none', borderRadius: 10, padding: '8px 14px', fontFamily: "'Syne', sans-serif", fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' as const }}>+ Add Staff</button>
      </div>

      {/* Role legend */}
      <div style={{ padding: '0 20px 20px', display: 'flex', gap: 10 }}>
        <div style={{ flex: 1, background: 'rgba(168,85,212,0.1)', border: '1px solid rgba(168,85,212,0.2)', borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 20, marginBottom: 6 }}>📱</div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, marginBottom: 3 }}>Scanner</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>Can scan QR codes at the entrance only</div>
        </div>
        <div style={{ flex: 1, background: 'rgba(245,200,66,0.08)', border: '1px solid rgba(245,200,66,0.2)', borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 20, marginBottom: 6 }}>🛡️</div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, marginBottom: 3 }}>Manager</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>Can scan, view sales and manage check-in</div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ padding: '0 20px 20px', display: 'flex', gap: 10 }}>
        {[
          { label: 'Total Staff', value: staff.length, icon: '👥' },
          { label: 'Active', value: staff.filter(s => s.status === 'active').length, icon: '✅' },
          { label: 'Pending', value: staff.filter(s => s.status === 'pending').length, icon: '⏳' },
        ].map(stat => (
          <div key={stat.label} style={{ flex: 1, ...S.card, padding: 12, textAlign: 'center' as const }}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>{stat.icon}</div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800 }}>{stat.value}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Managers section */}
      {managers.length > 0 && (
        <div style={{ padding: '0 20px 20px' }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            🛡️ Managers <span style={{ background: 'rgba(245,200,66,0.15)', color: '#F5C842', fontSize: 10, padding: '2px 8px', borderRadius: 20 }}>{managers.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {managers.map(member => <StaffCard key={member.id} member={member} onRemove={() => setConfirmRemove(member.id)} onToggleRole={() => toggleRole(member.id)} />)}
          </div>
        </div>
      )}

      {/* Scanners section */}
      <div style={{ padding: '0 20px 20px' }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          📱 Scanners <span style={{ background: 'rgba(168,85,212,0.15)', color: '#A855D4', fontSize: 10, padding: '2px 8px', borderRadius: 20 }}>{scanners.length}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {scanners.map(member => <StaffCard key={member.id} member={member} onRemove={() => setConfirmRemove(member.id)} onToggleRole={() => toggleRole(member.id)} />)}
        </div>
      </div>

      {staff.length === 0 && (
        <div style={{ padding: '40px 20px', textAlign: 'center' as const }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, marginBottom: 6 }}>No team members yet</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>Add staff members to help manage your events.</div>
        </div>
      )}

      {/* ADD STAFF MODAL */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: '#13113A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px 24px 0 0', padding: '24px 20px 40px', width: '100%', maxWidth: 430 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700 }}>Add Staff Member</div>
              <button onClick={() => setShowAddModal(false)} style={{ background: '#1A1845', border: 'none', color: 'rgba(255,255,255,0.6)', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={S.label}>Phone Number</label>
              <input
                type="tel" placeholder="+232 76 000 000" value={newPhone}
                onChange={e => setNewPhone(e.target.value)}
                style={{ ...S.input }}
                onFocus={e => { e.target.style.borderColor = 'rgba(168,85,212,0.6)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
              />
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>The person must already have a Beatix account.</div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={S.label}>Role</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {(['scanner', 'manager'] as const).map(role => (
                  <button key={role} onClick={() => setNewRole(role)} style={{ flex: 1, padding: 14, borderRadius: 12, border: `1.5px solid ${newRole === role ? '#F5C842' : 'rgba(255,255,255,0.08)'}`, background: newRole === role ? 'rgba(245,200,66,0.08)' : '#1A1845', color: newRole === role ? '#F5C842' : 'rgba(255,255,255,0.6)', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: newRole === role ? 600 : 400, textTransform: 'capitalize' as const }}>
                    {role === 'scanner' ? '📱 Scanner' : '🛡️ Manager'}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleAdd} disabled={!newPhone.trim() || adding} style={{ width: '100%', background: !newPhone.trim() ? 'rgba(245,200,66,0.3)' : '#F5C842', color: '#0D0B2B', border: 'none', borderRadius: 14, padding: 17, fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, cursor: newPhone.trim() ? 'pointer' : 'not-allowed' }}>
              {adding ? '⏳ Adding…' : 'Add to Team'}
            </button>
          </div>
        </div>
      )}

      {/* REMOVE CONFIRM MODAL */}
      {confirmRemove && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}>
          <div style={{ background: '#13113A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 24, width: '100%', maxWidth: 380 }}>
            <div style={{ fontSize: 36, textAlign: 'center' as const, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, textAlign: 'center' as const, marginBottom: 8 }}>Remove Staff Member?</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textAlign: 'center' as const, marginBottom: 24, lineHeight: 1.5 }}>
              They will lose scanner access immediately. You can re-add them at any time.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmRemove(null)} style={{ flex: 1, background: '#1A1845', border: 'none', color: '#fff', borderRadius: 12, padding: 14, fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => handleRemove(confirmRemove)} style={{ flex: 1, background: 'rgba(255,80,80,0.15)', border: '1px solid rgba(255,80,80,0.3)', color: '#FF6B6B', borderRadius: 12, padding: 14, fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Remove</button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <nav style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, background: 'rgba(13,11,43,0.96)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '10px 0 18px', zIndex: 100 }}>
        {[
          { href: '/organizer/dashboard', label: 'Dashboard', icon: '📊' },
          { href: '/organizer/create-event', label: 'Create', icon: '➕' },
          { href: '/organizer/team', label: 'Team', icon: '👥', active: true },
          { href: '/profile', label: 'Profile', icon: '👤' },
        ].map(item => (
          <Link key={item.href} href={item.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textDecoration: 'none', padding: '4px 14px' }}>
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 500, color: (item as any).active ? '#F5C842' : 'rgba(255,255,255,0.35)' }}>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}

// Staff card sub-component
function StaffCard({ member, onRemove, onToggleRole }: { member: StaffMember; onRemove: () => void; onToggleRole: () => void }) {
  const isManager = member.role === 'manager'
  return (
    <div style={{ background: '#13113A', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 14 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {/* Avatar */}
        <div style={{ width: 46, height: 46, borderRadius: '50%', background: member.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
          {member.initials}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' }}>{member.name}</div>
            <div style={{ background: member.status === 'active' ? 'rgba(80,220,100,0.12)' : 'rgba(245,200,66,0.12)', color: member.status === 'active' ? '#50DC64' : '#F5C842', fontSize: 9, fontWeight: 600, padding: '2px 7px', borderRadius: 20, flexShrink: 0, textTransform: 'uppercase' as const }}>
              {member.status}
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{member.phone}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>Added {member.addedDate}</div>
        </div>
      </div>

      {/* Actions row */}
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        {/* Role badge / toggle */}
        <button onClick={onToggleRole} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: isManager ? 'rgba(245,200,66,0.1)' : 'rgba(168,85,212,0.1)', border: `1px solid ${isManager ? 'rgba(245,200,66,0.25)' : 'rgba(168,85,212,0.25)'}`, borderRadius: 10, padding: '8px 12px', cursor: 'pointer', color: isManager ? '#F5C842' : '#A855D4', fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600 }}>
          {isManager ? '🛡️ Manager' : '📱 Scanner'}
          <span style={{ fontSize: 9, opacity: 0.6 }}>↕</span>
        </button>
        {/* Remove button */}
        <button onClick={onRemove} style={{ background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.18)', borderRadius: 10, padding: '8px 14px', cursor: 'pointer', color: '#FF8080', fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600 }}>
          Remove
        </button>
      </div>
    </div>
  )
}
