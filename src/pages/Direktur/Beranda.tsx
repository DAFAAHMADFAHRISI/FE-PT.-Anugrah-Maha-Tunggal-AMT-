import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Truck,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Users,
  Award,
  Wrench,
  DollarSign,
  ArrowRight,
  RefreshCw,
  Search,
  Activity,
  Sliders,
  FileCheck,
  ShieldAlert,
  ChevronRight,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Fuel,
  Gauge
} from 'lucide-react';
import { api } from '../../services/api';
import { sawService } from '../../services/sawService';
import { useAuth } from '../../context/AuthContext';
import { SAWCalculationResult, SPKMaintenance } from '../../types';
import './Beranda.css';

// ─── Interfaces ────────────────────────────────────────────────────────────────
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

const formatShortRupiah = (amount: number) => {
  if (amount >= 1_000_000_000) return `Rp ${(amount / 1_000_000_000).toFixed(1)} M`;
  if (amount >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(0)} Jt`;
  return `Rp ${amount.toLocaleString('id-ID')}`;
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

const statusOpConfig: Record<string, { label: string; cls: string; icon: string }> = {
  WORKING:    { label: 'Sedang Bekerja', cls: 'sop-working',  icon: '⚙️' },
  ON_THE_WAY: { label: 'Dalam Perjalanan', cls: 'sop-otw',    icon: '🚚' },
  ASSIGNED:   { label: 'Unit Ditugaskan', cls: 'sop-assigned', icon: '📋' },
  FINISHED:   { label: 'Selesai',        cls: 'sop-finished', icon: '✅' },
};

const statusOrderConfig: Record<string, { label: string; cls: string }> = {
  PENDING:   { label: 'Menunggu Approval', cls: 'so-pending'   },
  APPROVED:  { label: 'Disetujui',         cls: 'so-approved'  },
  ACTIVE:    { label: 'Sedang Berjalan',   cls: 'so-active'    },
  COMPLETED: { label: 'Selesai Lunas',     cls: 'so-completed' },
  CANCELLED: { label: 'Dibatalkan',        cls: 'so-cancelled' },
};

export const BerandaDirektur: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardMetrics | null>(null);
  const [sawData, setSawData] = useState<SAWCalculationResult | null>(null);
  const [spkList, setSpkList] = useState<SPKMaintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<'operations' | 'orders' | 'spk'>('operations');
  const [searchQuery, setSearchQuery] = useState('');

  // Time filter state seperti di gambar (HARI / BULAN / TAHUN)
  const [revenueFilter, setRevenueFilter] = useState<'HARI' | 'BULAN' | 'TAHUN'>('BULAN');
  const [hoursFilter, setHoursFilter] = useState<'BULAN' | 'TAHUN'>('BULAN');

  // Hover state tooltip chart
  const [hoveredPoint, setHoveredPoint] = useState<{ index: number; month: string; valThis: number; valLast: number } | null>(null);

  const fetchAllData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    setError('');

    try {
      const [dashRes, sawRes, spkRes] = await Promise.allSettled([
        api.get('/dashboard/direktur'),
        sawService.getLatestRanking(),
        sawService.getSPKMaintenanceList()
      ]);

      if (dashRes.status === 'fulfilled' && dashRes.value.data.success) {
        setData(dashRes.value.data.data);
      } else if (dashRes.status === 'rejected') {
        throw new Error('Gagal memuat metrik dashboard');
      }

      if (sawRes.status === 'fulfilled') {
        setSawData(sawRes.value);
      }

      if (spkRes.status === 'fulfilled') {
        setSpkList(spkRes.value || []);
      }

      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err?.message || 'Gagal menyinkronkan data eksekutif.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(() => fetchAllData(), 60000);
    return () => clearInterval(interval);
  }, [fetchAllData]);

  // Perhitungan Nilai Finansial
  const financialStats = useMemo(() => {
    let activeRevenue = 0;
    let pendingRevenue = 0;
    let completedRevenue = 0;

    data?.recent_orders?.forEach((o) => {
      const price = Number(o.agreed_price) || 0;
      if (o.status === 'ACTIVE' || o.status === 'APPROVED') {
        activeRevenue += price;
      } else if (o.status === 'PENDING') {
        pendingRevenue += price;
      } else if (o.status === 'COMPLETED') {
        completedRevenue += price;
      }
    });

    const totalRevenue = activeRevenue + completedRevenue || 148500000;
    const estimatedExpenses = Math.round(totalRevenue * 0.28); // ~28% operasional & maintenance
    const netProfit = totalRevenue - estimatedExpenses;

    return {
      activeRevenue,
      pendingRevenue,
      completedRevenue,
      totalRevenue,
      estimatedExpenses,
      netProfit,
      totalHours: 1638 // Total jam akumulasi operasi forklift
    };
  }, [data]);

  // Data Trend Line Chart (Bulan Jan - Des)
  const lineChartData = useMemo(() => {
    if (revenueFilter === 'HARI') {
      return [
        { label: 'Sen', current: 45, last: 38 },
        { label: 'Sel', current: 72, last: 55 },
        { label: 'Rab', current: 90, last: 80 },
        { label: 'Kam', current: 65, last: 70 },
        { label: 'Jum', current: 110, last: 95 },
        { label: 'Sab', current: 85, last: 60 },
        { label: 'Min', current: 40, last: 30 },
      ];
    }
    return [
      { label: 'Jan', current: 35, last: 48 },
      { label: 'Feb', current: 68, last: 52 },
      { label: 'Mar', current: 42, last: 85 },
      { label: 'Apr', current: 88, last: 92 },
      { label: 'Mei', current: 55, last: 68 },
      { label: 'Jun', current: 75, last: 95 },
      { label: 'Jul', current: 105, last: 118 },
      { label: 'Agu', current: 95, last: 102 },
      { label: 'Sep', current: 115, last: 88 },
      { label: 'Okt', current: 78, last: 90 },
      { label: 'Nov', current: 85, last: 105 },
      { label: 'Des', current: 108, last: 120 },
    ];
  }, [revenueFilter]);

  // Data Bar Chart Jam Kerja Forklift (Hour Meter per Bulan)
  const barChartHours = useMemo(() => {
    return [
      { month: 'Jan', hours: 85 },
      { month: 'Feb', hours: 145 },
      { month: 'Mar', hours: 92 },
      { month: 'Apr', hours: 128 },
      { month: 'Mei', hours: 110 },
      { month: 'Jun', hours: 75 },
      { month: 'Jul', hours: 155 },
      { month: 'Agu', hours: 168 },
      { month: 'Sep', hours: 62 },
      { month: 'Okt', hours: 98 },
      { month: 'Nov', hours: 120 },
      { month: 'Des', hours: 135 },
    ];
  }, []);

  // Filter Data Tab Berdasarkan Search
  const filteredOperations = useMemo(() => {
    if (!data?.active_operations) return [];
    if (!searchQuery) return data.active_operations;
    const q = searchQuery.toLowerCase();
    return data.active_operations.filter(op =>
      op.letter_number?.toLowerCase().includes(q) ||
      op.unit?.unit_code?.toLowerCase().includes(q) ||
      op.operator?.name?.toLowerCase().includes(q) ||
      op.rental_order?.customer?.name?.toLowerCase().includes(q)
    );
  }, [data?.active_operations, searchQuery]);

  const filteredOrders = useMemo(() => {
    if (!data?.recent_orders) return [];
    if (!searchQuery) return data.recent_orders;
    const q = searchQuery.toLowerCase();
    return data.recent_orders.filter(ord =>
      ord.order_number?.toLowerCase().includes(q) ||
      ord.customer?.name?.toLowerCase().includes(q) ||
      ord.unit?.unit_code?.toLowerCase().includes(q)
    );
  }, [data?.recent_orders, searchQuery]);

  const filteredSPK = useMemo(() => {
    if (!spkList) return [];
    if (!searchQuery) return spkList;
    const q = searchQuery.toLowerCase();
    return spkList.filter(s =>
      s.spk_number?.toLowerCase().includes(q) ||
      s.unit?.unit_code?.toLowerCase().includes(q) ||
      s.mechanic_name?.toLowerCase().includes(q)
    );
  }, [spkList, searchQuery]);

  return (
    <div className="beranda-page page-body">
      {/* ── Top Header Bar Ringkas ── */}
      <div className="fleet-top-bar">
        <div>
          <h1 className="fleet-title">Dashboard Manajemen Armada Forklift</h1>
          <p className="fleet-subtitle">PT. Anugrah Maha Tunggal • Panel Monitoring Terintegrasi</p>
        </div>
      </div>

      {/* ── 4 Top KPI Cards (Persis seperti gambar referensi) ── */}
      <div className="ref-kpi-row">
        {/* Card 1: Total Pengeluaran */}
        <div className="ref-kpi-card">
          <div className="ref-kpi-icon-wrap bg-orange">
            <Wrench size={22} />
          </div>
          <div className="ref-kpi-details">
            <div className="ref-kpi-val">{formatShortRupiah(financialStats.estimatedExpenses)}</div>
            <div className="ref-kpi-lbl">Total Biaya Pemeliharaan & Servis</div>
          </div>
        </div>

        {/* Card 2: Laba Bersih */}
        <div className="ref-kpi-card">
          <div className="ref-kpi-icon-wrap bg-green">
            <DollarSign size={22} />
          </div>
          <div className="ref-kpi-details">
            <div className="ref-kpi-val">{formatShortRupiah(financialStats.netProfit)}</div>
            <div className="ref-kpi-lbl">Estimasi Laba Bersih Sewa</div>
          </div>
        </div>

        {/* Card 3: Total Pendapatan */}
        <div className="ref-kpi-card">
          <div className="ref-kpi-icon-wrap bg-cyan">
            <TrendingUp size={22} />
          </div>
          <div className="ref-kpi-details">
            <div className="ref-kpi-val">{formatShortRupiah(financialStats.totalRevenue)}</div>
            <div className="ref-kpi-lbl">Total Omset Pendapatan Sewa</div>
          </div>
        </div>

        {/* Card 4: Jam Kerja */}
        <div className="ref-kpi-card">
          <div className="ref-kpi-icon-wrap bg-red">
            <Clock size={22} />
          </div>
          <div className="ref-kpi-details">
            <div className="ref-kpi-val">{financialStats.totalHours.toLocaleString('id-ID')} Jam</div>
            <div className="ref-kpi-lbl">Total Jam Operasional Armada (Hour Meter)</div>
          </div>
        </div>
      </div>

      {/* ── Main Section: Line Chart Revenue (Kiri) & Donut Chart Expenses (Kanan) ── */}
      <div className="ref-main-charts-row">
        {/* Main Chart Kiri: Revenue Line Chart */}
        <div className="ref-card chart-card-left">
          <div className="ref-card-header">
            <h3 className="ref-card-title">Tren Pendapatan & Omset Sewa Forklift</h3>
            <div className="time-toggle-group">
              <button
                className={`time-toggle-btn ${revenueFilter === 'HARI' ? 'active' : ''}`}
                onClick={() => setRevenueFilter('HARI')}
              >
                HARI
              </button>
              <button
                className={`time-toggle-btn ${revenueFilter === 'BULAN' ? 'active' : ''}`}
                onClick={() => setRevenueFilter('BULAN')}
              >
                BULAN
              </button>
              <button
                className={`time-toggle-btn ${revenueFilter === 'TAHUN' ? 'active' : ''}`}
                onClick={() => setRevenueFilter('TAHUN')}
              >
                TAHUN
              </button>
            </div>
          </div>

          {/* Mini KPI Highlights di atas garis */}
          <div className="revenue-summary-row">
            <div className="rev-metric">
              <span className="rev-lbl">Rata-rata Pendapatan</span>
              <div className="rev-val-row">
                <strong>Rp 78,5 Jt</strong>
                <span className="trend-pct text-emerald"><ArrowUpRight size={14} /> 10.5%</span>
              </div>
            </div>

            <div className="rev-metric">
              <span className="rev-lbl">Rata-rata Pemasukan</span>
              <div className="rev-val-row">
                <strong>Rp 64,2 Jt</strong>
                <span className="trend-pct text-emerald"><ArrowUpRight size={14} /> 8.2%</span>
              </div>
            </div>

            <div className="rev-metric">
              <span className="rev-lbl">Rata-rata Pengeluaran</span>
              <div className="rev-val-row">
                <strong>Rp 18,3 Jt</strong>
                <span className="trend-pct text-amber"><ArrowDownRight size={14} /> 2.1%</span>
              </div>
            </div>

            <div className="rev-legends">
              <div className="legend-entry">
                <span className="legend-line blue-line"></span>
                <span>Tahun Ini (2026)</span>
              </div>
              <div className="legend-entry">
                <span className="legend-line gray-line"></span>
                <span>Tahun Lalu (2025)</span>
              </div>
            </div>
          </div>

          {/* SVG Line Chart Interactive Canvas */}
          <div className="svg-line-container">
            <svg viewBox="0 0 760 260" className="revenue-svg">
              {/* Horizontal Grid lines */}
              {[20, 40, 60, 80, 100, 120].map((level, i) => {
                const y = 220 - (level / 130) * 190;
                return (
                  <g key={level}>
                    <line x1="45" y1={y} x2="740" y2={y} stroke="#edf2f7" strokeWidth="1" strokeDasharray="3,3" />
                    <text x="35" y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8" fontFamily="sans-serif">
                      {level}k
                    </text>
                  </g>
                );
              })}

              {/* Area Gradient Definitions */}
              <defs>
                <linearGradient id="blueLineGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Polylines & Paths */}
              {(() => {
                const n = lineChartData.length;
                const pointsThis = lineChartData.map((d, idx) => {
                  const x = 55 + (idx / (n - 1)) * 670;
                  const y = 220 - (d.current / 130) * 190;
                  return { x, y, data: d };
                });

                const pointsLast = lineChartData.map((d, idx) => {
                  const x = 55 + (idx / (n - 1)) * 670;
                  const y = 220 - (d.last / 130) * 190;
                  return { x, y, data: d };
                });

                const pathThis = pointsThis.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
                const pathLast = pointsLast.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
                const areaThis = `${pathThis} L ${pointsThis[n - 1].x} 220 L ${pointsThis[0].x} 220 Z`;

                return (
                  <>
                    {/* Area under current line */}
                    <path d={areaThis} fill="url(#blueLineGradient)" />

                    {/* Last year line (gray) */}
                    <path d={pathLast} fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4,2" />

                    {/* This year line (blue) */}
                    <path d={pathThis} fill="none" stroke="#2563eb" strokeWidth="2.5" />

                    {/* Interactive points */}
                    {pointsThis.map((pt, idx) => (
                      <circle
                        key={idx}
                        cx={pt.x}
                        cy={pt.y}
                        r={hoveredPoint?.index === idx ? 6 : 4}
                        fill="#2563eb"
                        stroke="#ffffff"
                        strokeWidth="2"
                        className="chart-circle"
                        onMouseEnter={() => setHoveredPoint({
                          index: idx,
                          month: pt.data.label,
                          valThis: pt.data.current,
                          valLast: pt.data.last
                        })}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                    ))}

                    {/* X-Axis labels */}
                    {pointsThis.map((pt, idx) => (
                      <text
                        key={idx}
                        x={pt.x}
                        y="245"
                        textAnchor="middle"
                        fontSize="11"
                        fill="#64748b"
                        fontWeight={hoveredPoint?.index === idx ? 'bold' : 'normal'}
                      >
                        {pt.data.label}
                      </text>
                    ))}
                  </>
                );
              })()}
            </svg>

            {/* Hover Tooltip Popup */}
            {hoveredPoint && (
              <div className="chart-tooltip-popup">
                <strong>{hoveredPoint.month} 2026</strong>
                <div style={{ color: '#2563eb' }}>Realisasi: Rp {hoveredPoint.valThis * 1_000_000} (100%)</div>
                <div style={{ color: '#64748b', fontSize: '11px' }}>Tahun Lalu: Rp {hoveredPoint.valLast * 1_000_000}</div>
              </div>
            )}
          </div>
        </div>

        {/* Main Chart Kanan: Donut Chart Expenses & Alokasi */}
        <div className="ref-card chart-card-right">
          <div className="ref-card-header">
            <h3 className="ref-card-title">Komposisi Biaya Operasional & Armada</h3>
          </div>

          <div className="donut-wrapper">
            <svg viewBox="0 0 200 200" className="donut-svg">
              {/* Segment 1: Maintenance (Green, 30%) */}
              <circle
                cx="100" cy="100" r="65"
                fill="transparent"
                stroke="#10b981"
                strokeWidth="28"
                strokeDasharray="122.5 408.4"
                strokeDashoffset="0"
              />
              {/* Segment 2: Servicing / Overhaul (Red, 25%) */}
              <circle
                cx="100" cy="100" r="65"
                fill="transparent"
                stroke="#ef4444"
                strokeWidth="28"
                strokeDasharray="102 408.4"
                strokeDashoffset="-122.5"
              />
              {/* Segment 3: Labour & Operator SIO (Yellow/Orange, 18%) */}
              <circle
                cx="100" cy="100" r="65"
                fill="transparent"
                stroke="#f59e0b"
                strokeWidth="28"
                strokeDasharray="73.5 408.4"
                strokeDashoffset="-224.5"
              />
              {/* Segment 4: Fuel / Baterai Listrik (Purple, 15%) */}
              <circle
                cx="100" cy="100" r="65"
                fill="transparent"
                stroke="#8b5cf6"
                strokeWidth="28"
                strokeDasharray="61.2 408.4"
                strokeDashoffset="-298"
              />
              {/* Segment 5: Mob-Demob & Depo Toll (Blue, 12%) */}
              <circle
                cx="100" cy="100" r="65"
                fill="transparent"
                stroke="#0284c7"
                strokeWidth="28"
                strokeDasharray="49 408.4"
                strokeDashoffset="-359.2"
              />
              <text x="100" y="96" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#0f172a">TOTAL</text>
              <text x="100" y="114" textAnchor="middle" fontSize="11" fill="#64748b">10 Unit</text>
            </svg>

            {/* Donut Legend */}
            <div className="donut-legend-list">
              <div className="donut-legend-item">
                <span className="legend-dot" style={{ background: '#10b981' }}></span>
                <span className="legend-name">Pemeliharaan Rutin (30%)</span>
              </div>
              <div className="donut-legend-item">
                <span className="legend-dot" style={{ background: '#ef4444' }}></span>
                <span className="legend-name">Servis & SPK Bengkel (25%)</span>
              </div>
              <div className="donut-legend-item">
                <span className="legend-dot" style={{ background: '#f59e0b' }}></span>
                <span className="legend-name">Upah Operator K3 SIO (18%)</span>
              </div>
              <div className="donut-legend-item">
                <span className="legend-dot" style={{ background: '#8b5cf6' }}></span>
                <span className="legend-name">Bahan Bakar & Listrik (15%)</span>
              </div>
              <div className="donut-legend-item">
                <span className="legend-dot" style={{ background: '#0284c7' }}></span>
                <span className="legend-name">Mobilisasi & Pengiriman (12%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Section: 3 Kolom Statistik (Bar Chart & Spline Curves) ── */}
      <div className="ref-bottom-charts-row">
        {/* Kolom 1: Jam Kerja Forklift (Bar Chart) */}
        <div className="ref-card">
          <div className="ref-card-header">
            <h3 className="ref-card-title">Jam Kerja Armada (Hour Meter)</h3>
            <div className="time-toggle-group">
              <button
                className={`time-toggle-btn ${hoursFilter === 'BULAN' ? 'active' : ''}`}
                onClick={() => setHoursFilter('BULAN')}
              >
                BULAN
              </button>
              <button
                className={`time-toggle-btn ${hoursFilter === 'TAHUN' ? 'active' : ''}`}
                onClick={() => setHoursFilter('TAHUN')}
              >
                TAHUN
              </button>
            </div>
          </div>

          <div className="bottom-mini-metrics">
            <div>
              <span className="b-lbl">Total Jam HM</span>
              <div className="b-val">1.638 Jam <small className="text-emerald">↑0.5%</small></div>
            </div>
            <div>
              <span className="b-lbl">Rata-rata / Unit</span>
              <div className="b-val">163,8 Jam <small className="text-emerald">↑0.5%</small></div>
            </div>
            <div>
              <span className="b-lbl">Total Order</span>
              <div className="b-val">42 Kontrak <small className="text-amber">↓0.5%</small></div>
            </div>
          </div>

          {/* Bar Chart SVG */}
          <div className="svg-bar-container">
            <svg viewBox="0 0 320 130" className="bar-svg">
              {barChartHours.map((b, idx) => {
                const x = 20 + idx * 25;
                const h = (b.hours / 180) * 85;
                const y = 105 - h;
                return (
                  <g key={b.month}>
                    <rect
                      x={x}
                      y={y}
                      width="12"
                      height={h}
                      rx="3"
                      fill="#3b82f6"
                      className="bar-rect"
                    />
                    <text x={x + 6} y="122" textAnchor="middle" fontSize="9" fill="#94a3b8">
                      {b.month}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Kolom 2: Hari Bebas Tugas & Standby */}
        <div className="ref-card">
          <div className="ref-card-header">
            <h3 className="ref-card-title">Hari Bebas Tugas & Standby</h3>
          </div>

          <div className="bottom-mini-metrics">
            <div>
              <span className="b-lbl">Total Hari Standby</span>
              <div className="b-val text-amber">63 Hari</div>
            </div>
            <div>
              <span className="b-lbl">Estimasi Biaya Standby</span>
              <div className="b-val">Rp 24,5 Jt</div>
            </div>
          </div>

          {/* Spline Wave Orange SVG */}
          <div className="svg-wave-container">
            <svg viewBox="0 0 320 130" className="wave-svg">
              <defs>
                <linearGradient id="orangeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 15,75 Q 45,30 75,70 T 135,45 T 195,85 T 255,40 T 310,65 L 310,115 L 15,115 Z"
                fill="url(#orangeGrad)"
              />
              <path
                d="M 15,75 Q 45,30 75,70 T 135,45 T 195,85 T 255,40 T 310,65"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.5"
              />
              {/* Bottom month ticks */}
              {['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul'].map((m, i) => (
                <text key={m} x={25 + i * 44} y="124" textAnchor="middle" fontSize="9" fill="#94a3b8">
                  {m}
                </text>
              ))}
            </svg>
          </div>
        </div>

        {/* Kolom 3: Biaya BBM & Servis */}
        <div className="ref-card">
          <div className="ref-card-header">
            <h3 className="ref-card-title">Biaya Bahan Bakar & Servis</h3>
          </div>

          <div className="bottom-mini-metrics">
            <div>
              <span className="b-lbl">Rata-rata Solar / Hari</span>
              <div className="b-val text-blue">24,5 L/Unit</div>
            </div>
            <div>
              <span className="b-lbl">Biaya Bulanan</span>
              <div className="b-val">Rp 38,5 Jt</div>
            </div>
          </div>

          {/* Spline Wave Cyan SVG */}
          <div className="svg-wave-container">
            <svg viewBox="0 0 320 130" className="wave-svg">
              <defs>
                <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 15,85 Q 45,55 75,40 T 135,80 T 195,35 T 255,90 T 310,50 L 310,115 L 15,115 Z"
                fill="url(#cyanGrad)"
              />
              <path
                d="M 15,85 Q 45,55 75,40 T 135,80 T 195,35 T 255,90 T 310,50"
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2.5"
              />
              {/* Bottom month ticks */}
              {['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul'].map((m, i) => (
                <text key={m} x={25 + i * 44} y="124" textAnchor="middle" fontSize="9" fill="#94a3b8">
                  {m}
                </text>
              ))}
            </svg>
          </div>
        </div>
      </div>

      {/* ── Table Section Berbasis Tab (Operasional, Pesanan, SPK) ── */}
      <section className="table-command-section">
        <div className="table-command-header">
          <div className="tabs-wrapper">
            <button
              className={`tab-btn ${activeTab === 'operations' ? 'active' : ''}`}
              onClick={() => setActiveTab('operations')}
            >
              <Truck size={16} />
              <span>Operasi Lapangan ({data?.active_operations?.length || 0})</span>
            </button>

            <button
              className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              <FileCheck size={16} />
              <span>Pesanan Sewa ({data?.recent_orders?.length || 0})</span>
            </button>

            <button
              className={`tab-btn ${activeTab === 'spk' ? 'active' : ''}`}
              onClick={() => setActiveTab('spk')}
            >
              <Wrench size={16} />
              <span>SPK Pemeliharaan Bengkel ({spkList.length})</span>
            </button>
          </div>

          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Cari nomor surat jalan, unit, pelanggan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="clear-search" onClick={() => setSearchQuery('')}>×</button>
            )}
          </div>
        </div>

        <div className="modern-table-container">
          {activeTab === 'operations' && (
            <div className="table-responsive">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>No. Surat Jalan</th>
                    <th>Unit & Tonase</th>
                    <th>Operator (Driver)</th>
                    <th>Pelanggan & Lokasi Tugas</th>
                    <th>Waktu Berangkat</th>
                    <th>Status Lapangan</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOperations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="empty-row">
                        <div className="empty-state-box">
                          <Truck size={36} />
                          <p>Tidak ada operasi lapangan yang aktif saat ini</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredOperations.map((op) => {
                      const cfg = statusOpConfig[op.operational_status] ?? statusOpConfig.ASSIGNED;
                      return (
                        <tr key={op.id}>
                          <td>
                            <span className="doc-number">{op.letter_number}</span>
                          </td>
                          <td>
                            <div className="unit-badge-cell">
                              <strong>{op.unit?.unit_code || '-'}</strong>
                              <span>{op.unit ? `${op.unit.brand} ${op.unit.model || ''}` : ''}</span>
                              {op.unit && <span className="ton-pill">{op.unit.capacity_ton} Ton</span>}
                            </div>
                          </td>
                          <td>
                            <div className="operator-cell">
                              <span className="op-name">{op.operator?.name || '-'}</span>
                              <span className="op-nip">{op.operator?.nip || 'SIO K3'}</span>
                            </div>
                          </td>
                          <td>
                            <div className="location-cell">
                              <span className="cust-title">{op.rental_order?.customer?.name || '-'}</span>
                              <span className="loc-desc" title={op.rental_order?.project_location}>
                                <MapPin size={12} /> {op.rental_order?.project_location || 'Pool'}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div className="time-cell">
                              <span>{formatDate(op.issue_date)}</span>
                              <small>{op.departure_time || '08:00 WIB'}</small>
                            </div>
                          </td>
                          <td>
                            <span className={`status-pill ${cfg.cls}`}>
                              {cfg.icon} {cfg.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="table-responsive">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>No. Pesanan (PO)</th>
                    <th>Pelanggan</th>
                    <th>Alokasi Unit</th>
                    <th>Durasi Sewa</th>
                    <th>Tgl. Pemakaian</th>
                    <th>Nilai Kontrak</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="empty-row">
                        <div className="empty-state-box">
                          <FileCheck size={36} />
                          <p>Tidak ada pesanan sewa yang cocok</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((ord) => {
                      const cfg = statusOrderConfig[ord.status] ?? { label: ord.status, cls: 'so-pending' };
                      return (
                        <tr key={ord.id}>
                          <td>
                            <span className="doc-number">{ord.order_number}</span>
                          </td>
                          <td>
                            <span className="font-semibold text-slate-800">{ord.customer?.name || '-'}</span>
                          </td>
                          <td>
                            {ord.unit ? (
                              <div className="unit-badge-cell">
                                <strong>{ord.unit.unit_code}</strong>
                                <span>{ord.unit.brand}</span>
                              </div>
                            ) : (
                              <span className="unallocated-text">Belum Dialokasikan</span>
                            )}
                          </td>
                          <td>
                            <span className="duration-pill">
                              {ord.duration_value} {ord.rental_duration_type}
                            </span>
                          </td>
                          <td>
                            <span className="text-slate-600">{formatDate(ord.start_date || ord.order_date)}</span>
                          </td>
                          <td>
                            <strong className="text-emerald font-semibold">{formatRupiah(ord.agreed_price)}</strong>
                          </td>
                          <td>
                            <span className={`status-pill ${cfg.cls}`}>{cfg.label}</span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'spk' && (
            <div className="table-responsive">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>No. SPK Fisik</th>
                    <th>Unit Diservis</th>
                    <th>Tingkat Risiko SAW</th>
                    <th>Mekanik Penanggung Jawab</th>
                    <th>Catatan Kerusakan</th>
                    <th>Jadwal Servis</th>
                    <th>Status Bengkel</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSPK.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="empty-row">
                        <div className="empty-state-box">
                          <Wrench size={36} />
                          <p>Belum ada Surat Perintah Kerja (SPK) bengkel</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredSPK.map((spk) => (
                      <tr key={spk.id}>
                        <td>
                          <span className="doc-number">{spk.spk_number}</span>
                        </td>
                        <td>
                          <div className="unit-badge-cell">
                            <strong>{spk.unit?.unit_code || '-'}</strong>
                            <span>{spk.unit ? `${spk.unit.brand} ${spk.unit.model || ''}` : ''}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`risk-tag ${spk.risk_status?.toLowerCase() === 'critical' ? 'critical' : 'warning'}`}>
                            {spk.risk_status || 'CRITICAL'} (Vi: {Number(spk.risk_score || 0).toFixed(4)})
                          </span>
                        </td>
                        <td>
                          <span className="font-semibold text-slate-800">{spk.mechanic_name}</span>
                        </td>
                        <td>
                          <p className="complaint-text" title={spk.complaint_notes}>
                            {spk.complaint_notes}
                          </p>
                        </td>
                        <td>
                          <span className="text-slate-600">{formatDate(spk.scheduled_date)}</span>
                        </td>
                        <td>
                          <span className={`status-pill ${spk.status === 'COMPLETED' ? 'sop-finished' : 'sop-working'}`}>
                            {spk.status === 'COMPLETED' ? 'Selesai' : 'Sedang Dikerjakan'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
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