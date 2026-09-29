import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield } from 'lucide-react';

const ROLE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  direktur:    { label: 'Direktur', color: '#6d28d9', bg: '#ede9fe' },
  admin_staff: { label: 'Admin Staff', color: '#1d4ed8', bg: '#eff6ff' },
  operasional: { label: 'Operasional', color: '#059669', bg: '#ecfdf5' },
  finance:     { label: 'Finance', color: '#d97706', bg: '#fffbeb' },
};

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  const roleInfo = user?.role ? ROLE_LABELS[user.role] : ROLE_LABELS.admin_staff;
  const initials = user?.name
    ? user.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : 'U';

  const handleLogout = () => {
    if (window.confirm('Apakah Anda yakin ingin keluar dari sistem?')) {
      logout();
    }
  };

  return (
    <header className="top-navbar no-print">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
          Tata Kelola Data Terintegrasi
        </h2>
        <span style={{
          background: '#eff6ff',
          color: '#1d4ed8',
          fontSize: '11px',
          fontWeight: 600,
          padding: '4px 10px',
          borderRadius: '9999px',
          border: '1px solid #bfdbfe'
        }}>
          Proyek Akhir Semester 7
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Role Badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '7px',
          background: roleInfo.bg, padding: '6px 12px',
          borderRadius: '8px', border: `1px solid ${roleInfo.color}30`
        }}>
          <Shield size={14} color={roleInfo.color} />
          <span style={{ fontSize: '12px', fontWeight: 700, color: roleInfo.color }}>
            {roleInfo.label}
          </span>
        </div>

        {/* User Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            color: '#ffffff', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontWeight: 700, fontSize: '13px',
            flexShrink: 0,
          }}>
            {initials}
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>@{user?.username}</div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          id="logout-btn"
          onClick={handleLogout}
          title="Keluar dari sistem"
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: '#fff1f2', color: '#be123c',
            border: '1px solid #fecdd3', borderRadius: '8px',
            padding: '8px 14px', fontSize: '12px', fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#ffe4e6')}
          onMouseLeave={e => (e.currentTarget.style.background = '#fff1f2')}
        >
          <span>🚪</span>
          <span>Keluar</span>
        </button>
      </div>
    </header>
  );
};
