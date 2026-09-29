import React from 'react';
import {
  LayoutDashboard,
  FileText,
  Truck,
  Users,
  HardHat,
  ShieldCheck,
  Building2,
  LogOut,
  Home,
  BarChart2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

// Definisi menu berdasarkan role
type MenuItem = {
  id: string;
  label: string;
  icon: React.ElementType;
  roles: string[]; // role yang boleh melihat menu ini
};

const ALL_MENU_ITEMS: MenuItem[] = [
  // ── Direktur Exclusive ──
  { id: 'beranda-direktur', label: 'Beranda Eksekutif', icon: Home,            roles: ['direktur'] },

  // ── Shared / Multi-role ──
  { id: 'dashboard',        label: 'Dashboard Umum',   icon: LayoutDashboard,  roles: ['admin_staff', 'operasional', 'finance'] },
  { id: 'orders',           label: 'Pesanan Sewa (PO)', icon: FileText,         roles: ['direktur', 'admin_staff', 'operasional', 'finance'] },
  { id: 'surat-jalan',      label: 'Surat Jalan & Operasional', icon: Truck,    roles: ['direktur', 'admin_staff', 'operasional'] },
  { id: 'units',            label: 'Master Unit Forklift', icon: HardHat,       roles: ['direktur', 'admin_staff', 'operasional'] },
  { id: 'customers',        label: 'Master Pelanggan', icon: Building2,         roles: ['direktur', 'admin_staff', 'finance'] },
  { id: 'users',            label: 'Kelola Users & Role', icon: Users,          roles: ['direktur', 'admin_staff'] },
];

const SECTION_LABELS: Record<string, string> = {
  'beranda-direktur': 'Eksekutif',
  'dashboard':        'Operasional',
  'orders':           'Operasional',
  'surat-jalan':      'Operasional',
  'units':            'Master Data',
  'customers':        'Master Data',
  'users':            'Administrasi',
};

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage }) => {
  const { user, logout } = useAuth();
  const userRole = user?.role ?? '';

  // Filter menu sesuai role
  const visibleMenus = ALL_MENU_ITEMS.filter(item => item.roles.includes(userRole));

  // Group menu by section
  const sections: { label: string; items: MenuItem[] }[] = [];
  const addedSections: string[] = [];
  for (const item of visibleMenus) {
    const sectionLabel = SECTION_LABELS[item.id] ?? 'Menu';
    if (!addedSections.includes(sectionLabel)) {
      addedSections.push(sectionLabel);
      sections.push({ label: sectionLabel, items: [] });
    }
    sections.find(s => s.label === sectionLabel)!.items.push(item);
  }

  const handleLogout = () => {
    if (window.confirm('Apakah Anda yakin ingin keluar dari sistem?')) {
      logout();
    }
  };

  return (
    <aside className="sidebar no-print">
      {/* ── Logo & Brand ── */}
      <div className="sidebar-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            borderRadius: '10px', width: '38px', height: '38px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: '12px', letterSpacing: '0.5px',
            boxShadow: '0 2px 8px rgba(37, 99, 235, 0.4)',
          }}>
            AMT
          </div>
          <div>
            <div className="company-title">PT. ANUGRAH MAHA TUNGGAL</div>
            <div className="company-subtitle">Integrated ERP System</div>
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="sidebar-nav">
        {sections.map((section) => (
          <div key={section.label}>
            <div style={{
              fontSize: '10px', color: '#475569', textTransform: 'uppercase',
              padding: '14px 14px 6px', letterSpacing: '0.8px', fontWeight: 700,
            }}>
              {section.label}
            </div>
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  onClick={() => setCurrentPage(item.id)}
                  className={`nav-link ${isActive ? 'active' : ''}`}
                >
                  <Icon size={17} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── Footer – User & Logout ── */}
      <div className="sidebar-footer">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: '#f8fafc', fontWeight: 600, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.name || 'User'}
          </div>
          <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'capitalize', marginTop: '2px' }}>
            {userRole.replace(/_/g, ' ')}
          </div>
        </div>
        <button
          id="sidebar-logout-btn"
          onClick={handleLogout}
          title="Keluar dari sistem"
          style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', flexShrink: 0 }}
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
};
