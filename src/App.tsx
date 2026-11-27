import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';

// ── Pages per role ────────────────────────────────────────────
import { Dashboard } from './pages/Dashboard';
import { Orders } from './pages/Orders';
import { SuratJalan } from './pages/SuratJalan';
import { ForkliftUnits } from './pages/ForkliftUnits';
import { Customers } from './pages/Customers';
import { UsersPage } from './pages/Users';
import BerandaDirektur from './pages/Direktur/Beranda';
import SuratJalanAdmin from './pages/admin/suratjalan';

// ── Modul SPK Pemeliharaan SAW ────────────────────────────────
import { SAWDashboard } from './pages/SAWDashboard';
import { OperationalLogs } from './pages/OperationalLogs';
import { SAWWeights } from './pages/SAWWeights';
import { MaintenanceOrders } from './pages/MaintenanceOrders';

// ── Auth Page ─────────────────────────────────────────────────
import Login from './pages/Auth/login';

// ── Loading Screen ────────────────────────────────────────────
const LoadingScreen: React.FC = () => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', minHeight: '100vh', background: '#0f172a', gap: '20px',
  }}>
    <div style={{
      width: '56px', height: '56px',
      background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
      borderRadius: '14px', display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontSize: '28px',
      boxShadow: '0 8px 24px rgba(59,130,246,0.35)',
    }}>🏗️</div>
    <div style={{ textAlign: 'center' }}>
      <p style={{ color: '#f8fafc', fontWeight: 700, fontSize: '16px' }}>PT. Anugrah Maha Tunggal</p>
      <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>Memuat aplikasi...</p>
    </div>
    <div style={{
      width: '32px', height: '32px',
      border: '3px solid rgba(59,130,246,0.3)', borderTop: '3px solid #3b82f6',
      borderRadius: '50%', animation: 'spin 0.75s linear infinite',
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// ── Default home page per role (semua role langsung ke dashboard yang disamakan) ──
const DEFAULT_PAGE_BY_ROLE: Record<string, string> = {
  direktur:    'beranda-direktur',
  admin_staff: 'beranda-direktur',
  operasional: 'beranda-direktur',
  finance:     'beranda-direktur',
};

// ── Mapping Page ID <-> URL Path ────────────────────────────────
const PAGE_TO_PATH: Record<string, string> = {
  'beranda-direktur':   '/dashboard',
  'dashboard':          '/dashboard',
  'saw-dashboard':      '/saw',
  'operational-logs':   '/saw/log-operasional',
  'maintenance-orders': '/saw/spk',
  'saw-weights':        '/saw/bobot',
  'orders':             '/orders',
  'surat-jalan':        '/surat-jalan',
  'surat-jalan-admin':  '/surat-jalan',
  'units':              '/units',
  'customers':          '/customers',
  'users':              '/users',
};

const PATH_TO_PAGE: Record<string, string> = {
  '/dashboard':           'beranda-direktur',
  '/saw':                 'saw-dashboard',
  '/saw/log-operasional': 'operational-logs',
  '/saw/spk':             'maintenance-orders',
  '/saw/bobot':           'saw-weights',
  '/orders':              'orders',
  '/surat-jalan':         'surat-jalan',
  '/units':               'units',
  '/customers':           'customers',
  '/users':               'users',
};

// ── AppContent ────────────────────────────────────────────────
const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Tentukan halaman awal berdasarkan URL path atau role user
  const defaultPage = user?.role ? (DEFAULT_PAGE_BY_ROLE[user.role] ?? 'beranda-direktur') : 'beranda-direktur';
  const getInitialPage = () => {
    const path = window.location.pathname.replace(/\/+$/, '') || '/';
    return PATH_TO_PAGE[path] ?? defaultPage;
  };
  const [currentPage, setCurrentPage] = useState<string>(getInitialPage);

  // Sinkronkan URL saat user berhasil login atau role berubah
  React.useEffect(() => {
    if (!isAuthenticated || !user?.role) return;
    const path = window.location.pathname.replace(/\/+$/, '') || '/';
    if (path === '/' || path === '/login' || !PATH_TO_PAGE[path]) {
      const targetPage = DEFAULT_PAGE_BY_ROLE[user.role] ?? 'beranda-direktur';
      setCurrentPage(targetPage);
      window.history.replaceState({ page: targetPage }, '', PAGE_TO_PATH[targetPage] || '/dashboard');
    } else {
      setCurrentPage(PATH_TO_PAGE[path]);
    }
  }, [isAuthenticated, user?.role]);

  // Dengarkan tombol Back/Forward browser
  React.useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.replace(/\/+$/, '') || '/';
      if (PATH_TO_PAGE[path]) {
        setCurrentPage(PATH_TO_PAGE[path]);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Saat user memilih menu secara manual, update state dan URL browser
  const handleSetCurrentPage = (page: string) => {
    setCurrentPage(page);
    const targetPath = PAGE_TO_PATH[page] || '/dashboard';
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ page }, '', targetPath);
    }
  };

  // ── Loading saat cek sesi ──
  if (isLoading) return <LoadingScreen />;

  // ── Belum login → tampilkan halaman Login ──
  if (!isAuthenticated) return <Login />;

  // ── Render halaman sesuai currentPage ──
  const renderPage = () => {
    switch (currentPage) {
      // ── Direktur ──
      case 'beranda-direktur':
        return <BerandaDirektur />;

      // ── SPK Pemeliharaan SAW ──
      case 'saw-dashboard':
        return <SAWDashboard />;
      case 'operational-logs':
        return <OperationalLogs />;
      case 'saw-weights':
        return <SAWWeights />;
      case 'maintenance-orders':
        return <MaintenanceOrders />;

      // ── Shared / Dashboard ──
      case 'dashboard':
        return <BerandaDirektur />;
      case 'orders':
        return <Orders />;
      case 'surat-jalan':
        if (user?.role === 'admin_staff') {
          return <SuratJalanAdmin />;
        }
        return <SuratJalan />;
      case 'surat-jalan-admin':
        return <SuratJalanAdmin />;
      case 'units':
        return <ForkliftUnits />;
      case 'customers':
        return <Customers />;
      case 'users':
        return <UsersPage />;

      default:
        // Fallback ke halaman default role
        if (user?.role === 'direktur') return <BerandaDirektur />;
        if (user?.role === 'admin_staff') return <SuratJalanAdmin />;
        return <Dashboard />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar currentPage={currentPage} setCurrentPage={handleSetCurrentPage} />
      <div className="main-content">
        <Navbar />
        {renderPage()}
      </div>
    </div>
  );
};

// ── App Root ──────────────────────────────────────────────────
const App: React.FC = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;
