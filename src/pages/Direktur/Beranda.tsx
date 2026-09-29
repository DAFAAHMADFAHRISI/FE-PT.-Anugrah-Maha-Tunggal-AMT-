import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './Beranda.css';

// ─── Types ────────────────────────────────────────────────────────────────────
interface DashboardMetrics {
  unit_stats: {
    total: number;
    available: number;
    rented: number;
    maintenance: number;
  };
  order_stats: {
    total_pending: number;
    total_active: number;
    total_completed: number;
  };
  total_customers: number;
  active_operations: ActiveOperation[];
  recent_orders: RecentOrder[];
}

interface ActiveOperation {
  id: number;
  letter_number: string;
  unit?: { unit_code: string; brand: string; model: string; capacity_ton: number };
  operator?: { name: string; nip: string };
  rental_order?: { customer?: { name: string }; project_location: string };
  issue_date: string;
  departure_time?: string;
  operational_status: 'ASSIGNED' | 'ON_THE_WAY' | 'WORKING' | 'FINISHED';
}

interface RecentOrder {
  id: number;
  order_number: string;
  customer?: { name: string };
  unit?: { unit_code: string; brand: string };
  order_date: string;
  start_date: string;
  required_capacity_ton: number;
  agreed_price: number;
  status: 'PENDING' | 'APPROVED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  rental_duration_type: string;
  duration_value: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatRupiah = (amount: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

const statusOpConfig: Record<string, { label: string; cls: string; icon: string }> = {
  WORKING:    { label: 'Sedang Bekerja', cls: 'sop-working',  icon: '⚙️' },
  ON_THE_WAY: { label: 'Dalam Perjalanan', cls: 'sop-otw',    icon: '🚚' },
  ASSIGNED:   { label: 'Ditugaskan',     cls: 'sop-assigned', icon: '📋' },
  FINISHED:   { label: 'Selesai',        cls: 'sop-finished', icon: '✅' },
};

const statusOrderConfig: Record<string, { label: string; cls: string }> = {
  PENDING:   { label: 'Menunggu',  cls: 'so-pending'   },
  APPROVED:  { label: 'Disetujui', cls: 'so-approved'  },
  ACTIVE:    { label: 'Aktif',     cls: 'so-active'    },
  COMPLETED: { label: 'Selesai',   cls: 'so-completed' },
  CANCELLED: { label: 'Batal',     cls: 'so-cancelled' },
};

// ─── Sub-Components ───────────────────────────────────────────────────────────
const StatCard: React.FC<{
  icon: string; label: string; value: string | number;
  sublabel?: string; color: string; pulse?: boolean;
}> = ({ icon, label, value, sublabel, color, pulse }) => (
  <div className="beranda-stat-card" style={{ borderTop: `3px solid ${color}` }}>
    <div className="beranda-stat-icon" style={{ background: `${color}18`, color }}>{icon}</div>
    <div className="beranda-stat-body">
      <p className="beranda-stat-label">{label}</p>
      <p className={`beranda-stat-value${pulse ? ' beranda-pulse-text' : ''}`}>{value}</p>
      {sublabel && <p className="beranda-stat-sub">{sublabel}</p>}
    </div>
  </div>
);

const LoadingCard: React.FC = () => (
  <div className="beranda-loading-card">
    <div className="beranda-skeleton beranda-skeleton-icon" />
    <div style={{ flex: 1 }}>
      <div className="beranda-skeleton beranda-skeleton-line" style={{ width: '60%' }} />
      <div className="beranda-skeleton beranda-skeleton-line" style={{ width: '40%', marginTop: 8 }} />
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const BerandaDirektur: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setError('');
      const res = await api.get('/dashboard/direktur');
      if (res.data.success) {
        setData(res.data.data);
        setLastUpdated(new Date());
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Gagal memuat data dashboard dari server.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    // Auto-refresh setiap 60 detik
    const interval = setInterval(fetchDashboard, 60000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Selamat Pagi';
    if (h < 15) return 'Selamat Siang';
    if (h < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  const availabilityPct = data ? Math.round((data.unit_stats.available / (data.unit_stats.total || 1)) * 100) : 0;
  const utilPct = data ? Math.round((data.unit_stats.rented / (data.unit_stats.total || 1)) * 100) : 0;

  return (
    <div className="beranda-page page-body">
      {/* ── Header ── */}
      <div className="beranda-header">
        <div className="beranda-greeting">
          <div className="beranda-avatar">{user?.name?.charAt(0) ?? 'D'}</div>
          <div>
            <p className="beranda-greeting-sub">{greeting()},</p>
            <h1 className="beranda-greeting-name">{user?.name ?? 'Direktur'}</h1>
            <p className="beranda-greeting-role">
              Dashboard Eksekutif &nbsp;•&nbsp; PT. Anugrah Maha Tunggal
              {lastUpdated && (
                <span className="beranda-last-updated">
                  &nbsp;• Diperbarui: {lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </p>
          </div>
        </div>
        <button className="beranda-refresh-btn" onClick={fetchDashboard} disabled={loading} id="refresh-dashboard-btn">
          <span className={loading ? 'beranda-spin' : ''}>🔄</span>
          <span>{loading ? 'Memuat...' : 'Perbarui Data'}</span>
        </button>
      </div>

      {/* ── Error State ── */}
      {error && (
        <div className="beranda-error" id="dashboard-error-alert">
          <span>⚠️</span>
          <div>
            <strong>Gagal Memuat Dashboard</strong>
            <p>{error}</p>
          </div>
          <button onClick={fetchDashboard}>Coba Lagi</button>
        </div>
      )}

      {/* ── Stat Cards – Armada Unit ── */}
      <section className="beranda-section">
        <div className="beranda-section-title">
          <span className="beranda-section-icon">🚜</span>
          <h2>Status Armada Forklift</h2>
        </div>
        <div className="beranda-stat-grid">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <LoadingCard key={i} />)
          ) : (
            <>
              <StatCard icon="🏭" label="Total Unit Armada" value={data?.unit_stats.total ?? 0} sublabel="Unit terdaftar" color="#0f172a" />
              <StatCard icon="✅" label="Siap Beroperasi" value={data?.unit_stats.available ?? 0} sublabel={`${availabilityPct}% dari total armada`} color="#059669" />
              <StatCard icon="⚙️" label="Sedang Disewa" value={data?.unit_stats.rented ?? 0} sublabel={`Utilisasi ${utilPct}%`} color="#2563eb" pulse />
              <StatCard icon="🔧" label="Dalam Perawatan" value={data?.unit_stats.maintenance ?? 0} sublabel="Tidak tersedia sementara" color="#d97706" />
            </>
          )}
        </div>
      </section>

      {/* ── Stat Cards – Bisnis ── */}
      <section className="beranda-section">
        <div className="beranda-section-title">
          <span className="beranda-section-icon">📊</span>
          <h2>Ringkasan Bisnis & Transaksi</h2>
        </div>
        <div className="beranda-stat-grid beranda-stat-grid-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <LoadingCard key={i} />)
          ) : (
            <>
              <StatCard icon="⏳" label="Pesanan Menunggu" value={data?.order_stats.total_pending ?? 0} sublabel="Perlu disetujui" color="#7c3aed" />
              <StatCard icon="🔥" label="Pesanan Aktif" value={data?.order_stats.total_active ?? 0} sublabel="Sedang berjalan" color="#dc2626" pulse />
              <StatCard icon="🤝" label="Total Pelanggan" value={data?.total_customers ?? 0} sublabel="Customer terdaftar" color="#0284c7" />
            </>
          )}
        </div>
      </section>

      {/* ── Utilisasi Visual ── */}
      {!loading && data && (
        <section className="beranda-section">
          <div className="beranda-section-title">
            <span className="beranda-section-icon">📈</span>
            <h2>Tingkat Utilisasi Armada</h2>
          </div>
          <div className="beranda-utilization-card">
            <div className="beranda-util-bar-group">
              <div className="beranda-util-bar-label">
                <span>Disewa</span>
                <span className="beranda-util-pct" style={{ color: '#2563eb' }}>{utilPct}%</span>
              </div>
              <div className="beranda-util-bar-track">
                <div className="beranda-util-bar-fill" style={{ width: `${utilPct}%`, background: '#2563eb' }} />
              </div>
            </div>
            <div className="beranda-util-bar-group">
              <div className="beranda-util-bar-label">
                <span>Tersedia</span>
                <span className="beranda-util-pct" style={{ color: '#059669' }}>{availabilityPct}%</span>
              </div>
              <div className="beranda-util-bar-track">
                <div className="beranda-util-bar-fill" style={{ width: `${availabilityPct}%`, background: '#059669' }} />
              </div>
            </div>
            <div className="beranda-util-bar-group">
              <div className="beranda-util-bar-label">
                <span>Perawatan</span>
                <span className="beranda-util-pct" style={{ color: '#d97706' }}>
                  {data.unit_stats.total ? Math.round((data.unit_stats.maintenance / data.unit_stats.total) * 100) : 0}%
                </span>
              </div>
              <div className="beranda-util-bar-track">
                <div className="beranda-util-bar-fill" style={{
                  width: `${data.unit_stats.total ? Math.round((data.unit_stats.maintenance / data.unit_stats.total) * 100) : 0}%`,
                  background: '#d97706'
                }} />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Active Operations Table ── */}
      <section className="beranda-section">
        <div className="beranda-section-title">
          <span className="beranda-section-icon">🗺️</span>
          <h2>Operasi Lapangan Aktif</h2>
          {!loading && data && (
            <span className="beranda-badge-count">{data.active_operations?.length ?? 0} Unit Bertugas</span>
          )}
        </div>

        <div className="beranda-table-card">
          {loading ? (
            <div className="beranda-table-loading">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="beranda-skeleton beranda-skeleton-row" />
              ))}
            </div>
          ) : !data?.active_operations?.length ? (
            <div className="beranda-empty-state">
              <span className="beranda-empty-icon">🏖️</span>
              <p>Tidak ada operasi lapangan yang aktif saat ini</p>
            </div>
          ) : (
            <div className="beranda-table-responsive">
              <table className="beranda-table" id="active-operations-table">
                <thead>
                  <tr>
                    <th>No. Surat Jalan</th>
                    <th>Unit Forklift</th>
                    <th>Operator</th>
                    <th>Pelanggan / Lokasi Proyek</th>
                    <th>Tgl. Tugas</th>
                    <th>Status Operasi</th>
                  </tr>
                </thead>
                <tbody>
                  {data.active_operations.map((op) => {
                    const cfg = statusOpConfig[op.operational_status] ?? statusOpConfig.ASSIGNED;
                    return (
                      <tr key={op.id}>
                        <td><span className="beranda-monospace">{op.letter_number}</span></td>
                        <td>
                          <div className="beranda-unit-cell">
                            <strong>{op.unit?.unit_code ?? '-'}</strong>
                            <span>{op.unit ? `${op.unit.brand} ${op.unit.model}` : ''}</span>
                            {op.unit && <span className="beranda-capacity-tag">{op.unit.capacity_ton}T</span>}
                          </div>
                        </td>
                        <td>
                          <div>
                            <div className="beranda-fw600">{op.operator?.name ?? '-'}</div>
                            <div className="beranda-text-muted">{op.operator?.nip}</div>
                          </div>
                        </td>
                        <td>
                          <div>
                            <div className="beranda-fw600">{op.rental_order?.customer?.name ?? '-'}</div>
                            <div className="beranda-text-muted beranda-truncate">{op.rental_order?.project_location}</div>
                          </div>
                        </td>
                        <td className="beranda-text-muted">{formatDate(op.issue_date)}</td>
                        <td>
                          <span className={`beranda-op-badge ${cfg.cls}`}>
                            {cfg.icon} {cfg.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* ── Recent Orders Table ── */}
      <section className="beranda-section">
        <div className="beranda-section-title">
          <span className="beranda-section-icon">📋</span>
          <h2>Pesanan Sewa Terkini</h2>
          {!loading && data && (
            <span className="beranda-badge-count">5 Pesanan Terakhir</span>
          )}
        </div>

        <div className="beranda-table-card">
          {loading ? (
            <div className="beranda-table-loading">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="beranda-skeleton beranda-skeleton-row" />
              ))}
            </div>
          ) : !data?.recent_orders?.length ? (
            <div className="beranda-empty-state">
              <span className="beranda-empty-icon">📭</span>
              <p>Belum ada pesanan sewa yang masuk</p>
            </div>
          ) : (
            <div className="beranda-table-responsive">
              <table className="beranda-table" id="recent-orders-table">
                <thead>
                  <tr>
                    <th>No. Order</th>
                    <th>Pelanggan</th>
                    <th>Unit Dialokasikan</th>
                    <th>Durasi</th>
                    <th>Tgl. Order</th>
                    <th>Nilai Kontrak</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent_orders.map((ord) => {
                    const cfg = statusOrderConfig[ord.status] ?? { label: ord.status, cls: 'so-pending' };
                    return (
                      <tr key={ord.id}>
                        <td><span className="beranda-monospace">{ord.order_number}</span></td>
                        <td className="beranda-fw600">{ord.customer?.name ?? '-'}</td>
                        <td>
                          {ord.unit ? (
                            <div className="beranda-unit-cell">
                              <strong>{ord.unit.unit_code}</strong>
                              <span>{ord.unit.brand}</span>
                            </div>
                          ) : (
                            <span className="beranda-text-muted">Belum dialokasikan</span>
                          )}
                        </td>
                        <td className="beranda-text-center">
                          {ord.duration_value} {ord.rental_duration_type}
                        </td>
                        <td className="beranda-text-muted">{formatDate(ord.order_date)}</td>
                        <td className="beranda-fw600 beranda-text-green">{formatRupiah(ord.agreed_price)}</td>
                        <td>
                          <span className={`beranda-order-badge ${cfg.cls}`}>{cfg.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default BerandaDirektur;
