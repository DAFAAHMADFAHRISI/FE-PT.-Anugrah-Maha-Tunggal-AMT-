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

// ── Default home page per role ────────────────────────────────
const DEFAULT_PAGE_BY_ROLE: Record<string, string> = {
  direktur:    'beranda-direktur',
  admin_staff: 'dashboard',
  operasional: 'surat-jalan',
  finance:     'orders',
};

// ── AppContent ────────────────────────────────────────────────
const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Tentukan halaman awal berdasarkan role user
  const defaultPage = user?.role ? (DEFAULT_PAGE_BY_ROLE[user.role] ?? 'dashboard') : 'dashboard';
  const [currentPage, setCurrentPage] = useState<string>(defaultPage);

  // Saat user berubah (login baru), arahkan ke halaman default role-nya
  const handleSetCurrentPage = (page: string) => setCurrentPage(page);

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

      // ── Shared / Admin Staff ──
      case 'dashboard':
        return <Dashboard />;
      case 'orders':
        return <Orders />;
      case 'surat-jalan':
        return <SuratJalan />;
      case 'units':
        return <ForkliftUnits />;
      case 'customers':
        return <Customers />;
      case 'users':
        return <UsersPage />;

      default:
        // Fallback ke halaman default role
        if (user?.role === 'direktur') return <BerandaDirektur />;
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
