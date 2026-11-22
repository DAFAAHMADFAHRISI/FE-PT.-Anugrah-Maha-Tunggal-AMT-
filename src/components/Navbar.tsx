import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, LogOut, Building2, User as UserIcon } from 'lucide-react';

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  direktur: {
    label: 'Direktur Utama',
    color: '#6d28d9',
    bg: '#f5f3ff',
    border: '#ddd6fe',
  },
  admin_staff: {
    label: 'Admin Staff',
    color: '#1d4ed8',
    bg: '#eff6ff',
    border: '#bfdbfe',
  },
  operasional: {
    label: 'Koordinator Lapangan',
    color: '#059669',
    bg: '#ecfdf5',
    border: '#a7f3d0',
  },
  finance: {
    label: 'Staff Keuangan',
    color: '#d97706',
    bg: '#fffbeb',
    border: '#fde68a',
  },
};

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  const roleInfo = user?.role ? (ROLE_CONFIG[user.role] ?? ROLE_CONFIG.admin_staff) : ROLE_CONFIG.admin_staff;

  // Bersihkan teks nama dari tanda kurung (misal "Ghofur (Direktur Utama)" -> inisial "G")
  const cleanName = user?.name ? user.name.replace(/\(.*?\)/g, '').trim() : '';
  const initials = cleanName
    ? cleanName
        .split(/\s+/)
        .filter(w => w.length > 0)
        .slice(0, 2)
        .map(w => w[0].toUpperCase())
        .join('')
    : 'U';

  const handleLogout = () => {
    if (window.confirm('Apakah Anda yakin ingin keluar dari sistem ERP?')) {
      logout();
    }
  };

  return (
    <header className="top-navbar no-print" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '68px',
      padding: '0 28px',
      background: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
      position: 'sticky',
      top: 0,
      zIndex: 20
    }}>
      {/* ── Kiri: Identitas Brand / Sistem ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)'
        }}>
          <Building2 size={19} />
        </div>
        <div>
          <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.2px' }}>
            PT. Anugrah Maha Tunggal
          </h2>
          <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>
            Sistem Informasi ERP & Tata Kelola Operasional
          </p>
        </div>
      </div>

      {/* ── Kanan: Profil User, Badge Role & Tombol Keluar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Badge Role Eksekutif */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: roleInfo.bg,
          padding: '6px 12px',
          borderRadius: '20px',
          border: `1px solid ${roleInfo.border}`
        }}>
          <ShieldCheck size={14} color={roleInfo.color} />
          <span style={{ fontSize: '12px', fontWeight: 700, color: roleInfo.color }}>
            {roleInfo.label}
          </span>
        </div>

        {/* Pemisah Halus */}
        <div style={{ width: '1px', height: '28px', background: '#e2e8f0' }} />

        {/* Profil User */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            position: 'relative',
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '14px',
            boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
            flexShrink: 0
          }}>
            {initials}
            <span style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: '#10b981',
              border: '2px solid #ffffff'
            }} title="Status Online" />
          </div>
          <div>
            <div style={{
              fontSize: '13px',
              fontWeight: 700,
              color: '#0f172a',
              maxWidth: '180px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              lineHeight: 1.2
            }}>
              {user?.name || 'Pengguna'}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
              @{user?.username || 'user'}
            </div>
          </div>
        </div>

        {/* Tombol Logout Elegan */}
        <button
          id="logout-btn"
          onClick={handleLogout}
          title="Keluar dari sistem"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#fff1f2',
            color: '#be123c',
            border: '1px solid #fecdd3',
            borderRadius: '8px',
            padding: '7px 14px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            marginLeft: '4px'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#ffe4e6';
            e.currentTarget.style.borderColor = '#fda4af';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = '#fff1f2';
            e.currentTarget.style.borderColor = '#fecdd3';
          }}
        >
          <LogOut size={14} />
          <span>Keluar</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;