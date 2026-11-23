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
  Award,
  Sliders,
  Wrench,
  ClipboardList,
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
  // ── Dashboard Utama (Semua Role) ──
  { id: 'beranda-direktur',    label: 'Dashboard Utama',        icon: Home,            roles: ['direktur', 'admin_staff', 'operasional', 'finance'] },

  // ── SPK Maintenance SAW ──
  { id: 'saw-dashboard',       label: 'SPK Maintenance (SAW)', icon: Award,           roles: ['direktur', 'admin_staff', 'operasional'] },
  { id: 'operational-logs',    label: 'Log Operasional Armada', icon: FileText,        roles: ['direktur', 'admin_staff', 'operasional'] },
  { id: 'maintenance-orders',  label: 'Daftar SPK Bengkel',    icon: Wrench,          roles: ['direktur', 'admin_staff', 'operasional'] },
  { id: 'saw-weights',         label: 'Pengaturan Bobot SAW',  icon: Sliders,         roles: ['direktur'] },

  // ── Operasional & Master Data ──
  { id: 'orders',              label: 'Pesanan Sewa (PO)',      icon: ClipboardList,   roles: ['direktur', 'admin_staff', 'operasional', 'finance'] },
  { id: 'surat-jalan',         label: 'Surat Jalan & Lapangan', icon: Truck,           roles: ['direktur', 'admin_staff', 'operasional'] },
  { id: 'units',               label: 'Master Unit Forklift',  icon: HardHat,         roles: ['direktur', 'admin_staff', 'operasional'] },
  { id: 'customers',           label: 'Master Pelanggan',       icon: Building2,       roles: ['direktur', 'admin_staff', 'finance'] },
  { id: 'users',               label: 'Kelola Users & Role',    icon: Users,           roles: ['direktur', 'admin_staff'] },
];

const SECTION_LABELS: Record<string, string> = {
  'beranda-direktur':   'Dashboard',
  'saw-dashboard':      'SPK Maintenance',
  'operational-logs':   'SPK Maintenance',
  'maintenance-orders': 'SPK Maintenance',
  'saw-weights':        'SPK Maintenance',
  'dashboard':          'Dashboard',
  'orders':             'Operasional',
  'surat-jalan':        'Operasional',
  'units':              'Master Data',
  'customers':          'Master Data',
  'users':              'Administrasi',
};

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage }) => {
  const { user, logout } = useAuth();
  const userRole = user?.role ?? '';

  // Filter menu sesuai role pengguna
  const visibleMenus = ALL_MENU_ITEMS.filter((item) => item.roles.includes(userRole));

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
          <svg
            viewBox="0 0 120 120"
            width="42"
            height="42"
            style={{ flexShrink: 0 }}
            aria-label="Logo PT. Anugrah Maha Tunggal"
          >
            {/* Red Star */}
            <polygon
              points="60,5 73,42 112,42 80,65 90,103 60,80 30,103 40,65 8,42 47,42"
              fill="#C23B2A"
            />
            {/* AMT Text */}
            <text
              x="60" y="68"
              textAnchor="middle"
              fill="#fff"
              fontWeight="800"
              fontStyle="italic"
              fontFamily="'Segoe UI', Arial, sans-serif"
              fontSize="26"
              letterSpacing="1"
            >AMT</text>
          </svg>
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
