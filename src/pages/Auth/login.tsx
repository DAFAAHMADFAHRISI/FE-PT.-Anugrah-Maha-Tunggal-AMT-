import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './login.css';

const Login: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Username dan password wajib diisi.');
      return;
    }

    setIsLoading(true);
    try {
      const success = await login(username, password);
      if (!success) {
        setError('Username atau password salah. Silakan coba lagi.');
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal terhubung ke server. Pastikan backend sudah aktif.');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="login-page">
      {/* Background Decorations */}
      <div className="login-bg-decoration">
        <div className="login-blob login-blob-1" />
        <div className="login-blob login-blob-2" />
        <div className="login-blob login-blob-3" />
      </div>

      <div className="login-container">
        {/* Left Panel - Branding */}
        <div className="login-branding">
          <div className="login-branding-content">
            <div className="login-logo-area">
              <img
                src="/logo-amt.jpg"
                alt="Logo PT. Anugrah Maha Tunggal"
                className="login-logo-img"
              />
              <div>
                <h1 className="login-company-name">PT. Anugrah Maha Tunggal</h1>
                <p className="login-company-tagline">Solusi Sewa Alat Berat Terpercaya</p>
              </div>
            </div>

            <div className="login-feature-list">
              <h2 className="login-feature-title">Sistem Manajemen ERP</h2>
              <p className="login-feature-desc">
                Platform terpadu untuk mengelola operasional sewa forklift, surat jalan, pelanggan, dan keuangan perusahaan Anda.
              </p>
              <div className="login-features">
                <div className="login-feature-item">
                  <span className="login-feature-icon">📊</span>
                  <span>Dashboard Eksekutif & Analitik Real-time</span>
                </div>
                <div className="login-feature-item">
                  <span className="login-feature-icon">📋</span>
                  <span>Manajemen Pesanan Sewa & Kontrak</span>
                </div>
                <div className="login-feature-item">
                  <span className="login-feature-icon">🚜</span>
                  <span>Monitoring Armada Forklift & Operator</span>
                </div>
                <div className="login-feature-item">
                  <span className="login-feature-icon">🧾</span>
                  <span>Penerbitan Surat Jalan & Invoice Digital</span>
                </div>
              </div>
            </div>

            <div className="login-branding-footer">
              <p>© 2026 PT. Anugrah Maha Tunggal — All Rights Reserved</p>
            </div>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="login-form-panel">
          <div className="login-form-container">
            <div className="login-form-header">
              <div className="login-form-logo-box">
                <img
                  src="/logo-amt.jpg"
                  alt="Logo PT. Anugrah Maha Tunggal"
                  className="login-form-logo"
                />
              </div>
              <h2 className="login-title">Selamat Datang Kembali</h2>
              <p className="login-subtitle">Masuk ke akun Anda untuk melanjutkan</p>
            </div>

            <form className="login-form" onSubmit={handleSubmit} id="login-form">
              {/* Error Alert */}
              {error && (
                <div className="login-error-alert" role="alert" id="login-error">
                  <span className="login-error-icon">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Username Field */}
              <div className="login-field-group">
                <label htmlFor="login-username" className="login-label">
                  Username
                </label>
                <div className="login-input-wrapper">
                  <span className="login-input-icon">👤</span>
                  <input
                    id="login-username"
                    type="text"
                    className="login-input"
                    placeholder="Masukkan username Anda"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    autoFocus
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="login-field-group">
                <label htmlFor="login-password" className="login-label">
                  Password
                </label>
                <div className="login-input-wrapper">
                  <span className="login-input-icon">🔑</span>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    className="login-input"
                    placeholder="Masukkan password Anda"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="login-toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    id="toggle-password-btn"
                    tabIndex={-1}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="login-submit-btn"
                disabled={isLoading}
                id="login-submit-btn"
              >
                {isLoading ? (
                  <>
                    <span className="login-spinner" />
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk ke Sistem</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </form>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
