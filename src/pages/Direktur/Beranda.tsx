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
interface PeriodYear {
  year: number;
  months: number[];
}

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
  all_orders?: RecentOrder[];
  all_operations?: ActiveOperation[];
  available_periods?: PeriodYear[];
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
const monthNames: Record<number, string> = {
  1: 'Januari',
  2: 'Februari',
  3: 'Maret',
  4: 'April',
  5: 'Mei',
  6: 'Juni',
  7: 'Juli',
  8: 'Agustus',
  9: 'September',
  10: 'Oktober',
  11: 'November',
  12: 'Desember',
};
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
  WORKING: { label: 'Sedang Bekerja', cls: 'sop-working', icon: '⚙️' },
  ON_THE_WAY: { label: 'Dalam Perjalanan', cls: 'sop-otw', icon: '🚚' },
  ASSIGNED: { label: 'Unit Ditugaskan', cls: 'sop-assigned', icon: '📋' },
  FINISHED: { label: 'Selesai', cls: 'sop-finished', icon: '✅' },
};

const statusOrderConfig: Record<string, { label: string; cls: string }> = {
  PENDING: { label: 'Menunggu Approval', cls: 'so-pending' },
  APPROVED: { label: 'Disetujui', cls: 'so-approved' },
  ACTIVE: { label: 'Sedang Berjalan', cls: 'so-active' },
  COMPLETED: { label: 'Selesai Lunas', cls: 'so-completed' },
  CANCELLED: { label: 'Dibatalkan', cls: 'so-cancelled' },
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
  const [activeTab, setActiveTab] = useState<'operations' | 'orders' | 'spk' | 'saw'>('operations');
  const [showAllSPKPeriod, setShowAllSPKPeriod] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // ── Filter Global Periode (Tahun & Bulan) ──
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');

  // Time filter state grafik lokal (HARI / BULAN / TAHUN)
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

  // Sumber Data Utuh
  const allOrders = useMemo(() => {
    return data?.all_orders && data.all_orders.length > 0 ? data.all_orders : (data?.recent_orders || []);
  }, [data]);

  const allOperations = useMemo(() => {
    return data?.all_operations && data.all_operations.length > 0 ? data.all_operations : (data?.active_operations || []);
  }, [data]);

  // Ekstrak Tahun yang benar-benar ada di database
  const availableYears = useMemo(() => {
    if (data?.available_periods && data.available_periods.length > 0) {
      return data.available_periods.map(p => p.year.toString());
    }
    const set = new Set<string>();
    allOrders.forEach(o => {
      const d = o.start_date || o.order_date;
      if (d && d.length >= 4) {
        set.add(d.substring(0, 4));
      }
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [data, allOrders]);

  // Ekstrak Bulan yang benar-benar ada di database untuk tahun terpilih
  const availableMonths = useMemo(() => {
    if (data?.available_periods && data.available_periods.length > 0) {
      if (selectedYear === 'ALL') {
        const set = new Set<number>();
        data.available_periods.forEach(p => p.months.forEach(m => set.add(m)));
        return Array.from(set).sort((a, b) => a - b);
      }
      const match = data.available_periods.find(p => p.year.toString() === selectedYear);
      return match ? [...match.months].sort((a, b) => a - b) : [];
    }
    const monthSet = new Set<number>();
    allOrders.forEach(o => {
      const d = o.start_date || o.order_date;
      if (d) {
        const parts = d.split('-');
        if (parts.length >= 2) {
          if (selectedYear === 'ALL' || parts[0] === selectedYear) {
            monthSet.add(parseInt(parts[1], 10));
          }
        }
      }
    });
    return Array.from(monthSet).sort((a, b) => a - b);
  }, [data, allOrders, selectedYear]);

  // Reset selectedMonth jika bulan yang dipilih tidak tersedia di tahun baru
  useEffect(() => {
    if (selectedMonth !== 'ALL') {
      const numM = parseInt(selectedMonth, 10);
      if (!availableMonths.includes(numM)) {
        setSelectedMonth('ALL');
      }
    }
  }, [selectedYear, availableMonths, selectedMonth]);

  // ── Helper filter tanggal sesuai tahun dan bulan terpilih ──
  const matchPeriod = useCallback((dateStr?: string) => {
    if (!dateStr) return false;
    const clean = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const parts = clean.split('-');
    if (parts.length < 2) return false;
    const y = parts[0];
    const m = parseInt(parts[1], 10).toString();

    if (selectedYear !== 'ALL' && y !== selectedYear) return false;
    if (selectedMonth !== 'ALL' && m !== selectedMonth) return false;
    return true;
  }, [selectedYear, selectedMonth]);

  // Perhitungan Nilai Finansial Tersaring Periode Berdasarkan Data Riil
  const financialStats = useMemo(() => {
    let activeRevenue = 0;
    let pendingRevenue = 0;
    let completedRevenue = 0;
    let matchCount = 0;
    let totalHours = 0;

    allOrders.forEach((o) => {
      const orderDate = o.start_date || o.order_date;
      if (matchPeriod(orderDate)) {
        matchCount++;
        const price = Number(o.agreed_price) || 0;
        if (o.status === 'ACTIVE' || o.status === 'APPROVED') {
          activeRevenue += price;
        } else if (o.status === 'PENDING') {
          pendingRevenue += price;
        } else if (o.status === 'COMPLETED') {
          completedRevenue += price;
        }

        const dur = o.duration_value || 1;
        if (o.rental_duration_type === 'JAM') {
          totalHours += dur;
        } else if (o.rental_duration_type === 'BULAN') {
          totalHours += dur * 200;
        } else {
          totalHours += dur * 8; // 1 hari = 8 jam kerja standar
        }
      }
    });

    const totalRevenue = activeRevenue + completedRevenue;
    const estimatedExpenses = Math.round(totalRevenue * 0.28);
    const netProfit = totalRevenue - estimatedExpenses;

    return {
      activeRevenue,
      pendingRevenue,
      completedRevenue,
      totalRevenue,
      estimatedExpenses,
      netProfit,
      totalHours,
      matchCount
    };
  }, [allOrders, matchPeriod]);

  // Data Trend Line Chart (Bulan Jan - Des atau Mingguan dalam Bulan)
  const lineChartData = useMemo(() => {
    // Jika memilih bulan spesifik, tampilkan tren per minggu
    if (selectedMonth !== 'ALL') {
      const weeks = [
        { label: 'Minggu 1', current: 0, last: 0 },
        { label: 'Minggu 2', current: 0, last: 0 },
        { label: 'Minggu 3', current: 0, last: 0 },
        { label: 'Minggu 4', current: 0, last: 0 },
        { label: 'Minggu 5', current: 0, last: 0 },
      ];

      allOrders.forEach(o => {
        const dStr = o.start_date || o.order_date;
        if (!dStr) return;
        const clean = dStr.includes('T') ? dStr.split('T')[0] : dStr;
        const parts = clean.split('-');
        if (parts.length < 3) return;
        const y = parts[0];
        const m = parseInt(parts[1], 10).toString();
        const day = parseInt(parts[2], 10);
        const price = (Number(o.agreed_price) || 0) / 1_000_000;

        if (m === selectedMonth) {
          let wIdx = 0;
          if (day <= 7) wIdx = 0;
          else if (day <= 14) wIdx = 1;
          else if (day <= 21) wIdx = 2;
          else if (day <= 28) wIdx = 3;
          else wIdx = 4;

          if (selectedYear === 'ALL' || y === selectedYear) {
            weeks[wIdx].current += price;
          } else if (selectedYear !== 'ALL' && parseInt(y, 10) === parseInt(selectedYear, 10) - 1) {
            weeks[wIdx].last += price;
          }
        }
      });

      return weeks.map(w => ({
        label: w.label,
        current: Math.round(w.current * 10) / 10,
        last: Math.round(w.last * 10) / 10,
      }));
    }

    if (revenueFilter === 'HARI') {
      const days = [
        { label: 'Sen', current: 0, last: 0 },
        { label: 'Sel', current: 0, last: 0 },
        { label: 'Rab', current: 0, last: 0 },
        { label: 'Kam', current: 0, last: 0 },
        { label: 'Jum', current: 0, last: 0 },
        { label: 'Sab', current: 0, last: 0 },
        { label: 'Min', current: 0, last: 0 },
      ];

      allOrders.forEach(o => {
        const dStr = o.start_date || o.order_date;
        if (!dStr) return;
        const d = new Date(dStr);
        if (isNaN(d.getTime())) return;
        const clean = dStr.includes('T') ? dStr.split('T')[0] : dStr;
        const y = clean.split('-')[0];
        const price = (Number(o.agreed_price) || 0) / 1_000_000;

        const jsDay = d.getDay();
        const dayIdx = jsDay === 0 ? 6 : jsDay - 1;

        if (selectedYear === 'ALL' || y === selectedYear) {
          days[dayIdx].current += price;
        } else if (selectedYear !== 'ALL' && parseInt(y, 10) === parseInt(selectedYear, 10) - 1) {
          days[dayIdx].last += price;
        }
      });

      return days.map(d => ({
        label: d.label,
        current: Math.round(d.current * 10) / 10,
        last: Math.round(d.last * 10) / 10,
      }));
    }

    // Default 12 Bulan (Jan - Des)
    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const months = monthLabels.map(lbl => ({ label: lbl, current: 0, last: 0 }));

    allOrders.forEach(o => {
      const dStr = o.start_date || o.order_date;
      if (!dStr) return;
      const clean = dStr.includes('T') ? dStr.split('T')[0] : dStr;
      const parts = clean.split('-');
      if (parts.length < 2) return;
      const y = parts[0];
      const mIdx = parseInt(parts[1], 10) - 1;
      const price = (Number(o.agreed_price) || 0) / 1_000_000;

      if (mIdx >= 0 && mIdx < 12) {
        if (selectedYear === 'ALL' || y === selectedYear) {
          months[mIdx].current += price;
        } else if (selectedYear !== 'ALL' && parseInt(y, 10) === parseInt(selectedYear, 10) - 1) {
          months[mIdx].last += price;
        }
      }
    });

    return months.map(m => ({
      label: m.label,
      current: Math.round(m.current * 10) / 10,
      last: Math.round(m.last * 10) / 10,
    }));
  }, [allOrders, revenueFilter, selectedYear, selectedMonth]);

  // Skala Maksimum Grafik Tren Pendapatan
  const maxChartVal = useMemo(() => {
    const max = Math.max(...lineChartData.map(d => Math.max(d.current, d.last)), 10);
    return Math.ceil(max / 20) * 20;
  }, [lineChartData]);

  // Data Bar Chart Jam Kerja Forklift (Hour Meter)
  const barChartHours = useMemo(() => {
    if (selectedMonth !== 'ALL') {
      const weeks = [
        { month: 'Minggu 1', hours: 0 },
        { month: 'Minggu 2', hours: 0 },
        { month: 'Minggu 3', hours: 0 },
        { month: 'Minggu 4', hours: 0 },
        { month: 'Minggu 5', hours: 0 },
      ];
      allOrders.forEach(o => {
        const dStr = o.start_date || o.order_date;
        if (!dStr) return;
        const clean = dStr.includes('T') ? dStr.split('T')[0] : dStr;
        const parts = clean.split('-');
        if (parts.length < 3) return;
        const y = parts[0];
        const m = parseInt(parts[1], 10).toString();
        const day = parseInt(parts[2], 10);
        if (m === selectedMonth && (selectedYear === 'ALL' || y === selectedYear)) {
          let wIdx = 0;
          if (day <= 7) wIdx = 0;
          else if (day <= 14) wIdx = 1;
          else if (day <= 21) wIdx = 2;
          else if (day <= 28) wIdx = 3;
          else wIdx = 4;
          const dur = o.duration_value || 1;
          weeks[wIdx].hours += dur * 8;
        }
      });
      return weeks;
    }

    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const months = monthLabels.map(lbl => ({ month: lbl, hours: 0 }));

    allOrders.forEach(o => {
      const dStr = o.start_date || o.order_date;
      if (!dStr) return;
      const clean = dStr.includes('T') ? dStr.split('T')[0] : dStr;
      const parts = clean.split('-');
      if (parts.length < 2) return;
      const y = parts[0];
      const mIdx = parseInt(parts[1], 10) - 1;

      if (mIdx >= 0 && mIdx < 12) {
        if (selectedYear === 'ALL' || y === selectedYear) {
          const dur = o.duration_value || 1;
          months[mIdx].hours += dur * 8;
        }
      }
    });

    return months;
  }, [allOrders, selectedYear, selectedMonth]);

  // Filter Data Tab Berdasarkan Search & Periode
  const filteredOperations = useMemo(() => {
    return allOperations.filter(op => {
      if (!matchPeriod(op.issue_date)) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        op.letter_number?.toLowerCase().includes(q) ||
        op.unit?.unit_code?.toLowerCase().includes(q) ||
        op.operator?.name?.toLowerCase().includes(q) ||
        op.rental_order?.customer?.name?.toLowerCase().includes(q)
      );
    });
  }, [allOperations, searchQuery, matchPeriod]);

  const filteredOrders = useMemo(() => {
    return allOrders.filter(ord => {
      const orderDate = ord.start_date || ord.order_date;
      if (!matchPeriod(orderDate)) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        ord.order_number?.toLowerCase().includes(q) ||
        ord.customer?.name?.toLowerCase().includes(q) ||
        ord.unit?.unit_code?.toLowerCase().includes(q)
      );
    });
  }, [allOrders, searchQuery, matchPeriod]);

  const filteredSPK = useMemo(() => {
    if (!spkList) return [];
    return spkList.filter(s => {
      if (!showAllSPKPeriod) {
        const spkDate = s.scheduled_date || (s.issued_at ? String(s.issued_at).split('T')[0] : '');
        if (!matchPeriod(spkDate)) return false;
      }
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.spk_number?.toLowerCase().includes(q) ||
        s.unit?.unit_code?.toLowerCase().includes(q) ||
        s.mechanic_name?.toLowerCase().includes(q)
      );
    });
  }, [spkList, searchQuery, matchPeriod, showAllSPKPeriod]);

  return (
    <div className="beranda-page page-body">
      {/* ── Top Header Bar & Filter Periode (Tahun / Bulan) ── */}
      <div className="fleet-top-bar">
        <div>
          <h1 className="fleet-title">Dashboard Manajemen Armada Forklift</h1>
          <p className="fleet-subtitle">PT. Anugrah Maha Tunggal • Panel Monitoring Terintegrasi</p>
        </div>

        {/* Filter Periode Global Berbasis Data Database */}
        <div className="period-filter-bar">
          <div className="period-filter-label">
            <Calendar size={15} className="text-primary" />
            <span>Filter Periode:</span>
          </div>

          {/* Dropdown Pilihan Tahun (Hanya yang ada di Database) */}
          <div className="period-select-wrap">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="period-select"
              title="Filter Berdasarkan Tahun yang Ada di Database"
            >
              <option value="ALL">Semua Tahun</option>
              {availableYears.map(yr => (
                <option key={yr} value={yr}>Tahun {yr}</option>
              ))}
            </select>
          </div>

          {/* Dropdown Pilihan Bulan (Hanya yang ada di Database untuk Tahun Terpilih) */}
          <div className="period-select-wrap">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="period-select"
              title="Filter Berdasarkan Bulan yang Ada di Database"
            >
              <option value="ALL">Semua Bulan (Jan - Des)</option>
              {availableMonths.map(m => (
                <option key={m} value={m.toString()}>
                  {monthNames[m]} ({m.toString().padStart(2, '0')})
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filter Button */}
          {(selectedYear !== 'ALL' || selectedMonth !== 'ALL') && (
            <button
              className="btn-reset-period"
              onClick={() => {
                setSelectedYear('ALL');
                setSelectedMonth('ALL');
              }}
              title="Kembalikan ke semua periode data"
            >
              Reset
            </button>
          )}
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
              <span className="rev-lbl">Total Omset Periode</span>
              <div className="rev-val-row">
                <strong>{formatShortRupiah(financialStats.totalRevenue)}</strong>
                <span className="trend-pct text-emerald"><ArrowUpRight size={14} /> {financialStats.matchCount} Order</span>
              </div>
            </div>

            <div className="rev-metric">
              <span className="rev-lbl">Realisasi Pemasukan</span>
              <div className="rev-val-row">
                <strong>{formatShortRupiah(financialStats.completedRevenue + financialStats.activeRevenue)}</strong>
                <span className="trend-pct text-emerald"><ArrowUpRight size={14} /> Lunas/Aktif</span>
              </div>
            </div>

            <div className="rev-metric">
              <span className="rev-lbl">Estimasi Pengeluaran</span>
              <div className="rev-val-row">
                <strong>{formatShortRupiah(financialStats.estimatedExpenses)}</strong>
                <span className="trend-pct text-amber"><ArrowDownRight size={14} /> 28% Biaya</span>
              </div>
            </div>

            <div className="rev-legends">
              <div className="legend-entry">
                <span className="legend-line blue-line"></span>
                <span>Periode Ini {selectedYear !== 'ALL' ? `(${selectedYear})` : ''}</span>
              </div>
              {selectedYear !== 'ALL' && (
                <div className="legend-entry">
                  <span className="legend-line gray-line"></span>
                  <span>Tahun Lalu ({parseInt(selectedYear, 10) - 1})</span>
                </div>
              )}
            </div>
          </div>

          {/* SVG Line Chart Interactive Canvas */}
          <div className="svg-line-container">
            <svg viewBox="0 0 1000 240" preserveAspectRatio="none" className="revenue-svg">
              {/* Horizontal Grid lines */}
              {[0.2, 0.4, 0.6, 0.8, 1.0].map((frac) => {
                const level = Math.round(maxChartVal * frac);
                const y = 205 - (level / maxChartVal) * 165;
                return (
                  <g key={frac}>
                    <line x1="38" y1={y} x2="985" y2={y} stroke="#edf2f7" strokeWidth="1" strokeDasharray="3,3" />
                    <text x="32" y={y + 4} textAnchor="end" fontSize="11" fill="#94a3b8" fontFamily="sans-serif">
                      {level} Jt
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
                const xStart = 45;
                const xEnd = 980;

                const pointsThis = lineChartData.map((d, idx) => {
                  const x = n > 1 ? xStart + (idx / (n - 1)) * (xEnd - xStart) : (xStart + xEnd) / 2;
                  const y = 205 - (d.current / maxChartVal) * 165;
                  return { x, y, data: d };
                });

                const pointsLast = lineChartData.map((d, idx) => {
                  const x = n > 1 ? xStart + (idx / (n - 1)) * (xEnd - xStart) : (xStart + xEnd) / 2;
                  const y = 205 - (d.last / maxChartVal) * 165;
                  return { x, y, data: d };
                });

                const pathThis = pointsThis.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
                const pathLast = pointsLast.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
                const areaThis = `${pathThis} L ${pointsThis[n - 1].x} 205 L ${pointsThis[0].x} 205 Z`;

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
                        y="228"
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
              <div className="b-val">{financialStats.totalHours.toLocaleString('id-ID')} Jam <small className="text-emerald">Aktif</small></div>
            </div>
            <div>
              <span className="b-lbl">Rata-rata / Unit</span>
              <div className="b-val">{financialStats.totalHours > 0 ? (financialStats.totalHours / 10).toFixed(1) : 0} Jam <small className="text-emerald">HM</small></div>
            </div>
            <div>
              <span className="b-lbl">Total Order</span>
              <div className="b-val">{financialStats.matchCount} Kontrak <small className="text-blue">Data</small></div>
            </div>
          </div>

          {/* Bar Chart SVG */}
          <div className="svg-bar-container">
            <svg viewBox="0 0 320 130" className="bar-svg">
              {(() => {
                const maxH = Math.max(...barChartHours.map(x => x.hours), 10);
                const totalBars = barChartHours.length;
                const barWidth = totalBars > 6 ? 12 : 24;
                const gap = (280 - totalBars * barWidth) / (totalBars + 1);
                return barChartHours.map((b, idx) => {
                  const x = 20 + gap + idx * (barWidth + gap);
                  const h = maxH > 0 ? (b.hours / maxH) * 85 : 0;
                  const y = 105 - h;
                  return (
                    <g key={b.month}>
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={Math.max(h, 2)}
                        rx="3"
                        fill="#3b82f6"
                        className="bar-rect"
                      />
                      <text x={x + barWidth / 2} y="122" textAnchor="middle" fontSize="9" fill="#94a3b8">
                        {b.month}
                      </text>
                    </g>
                  );
                });
              })()}
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
              <span>Operasi Lapangan ({filteredOperations.length})</span>
            </button>

            <button
              className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              <FileCheck size={16} />
              <span>Pesanan Sewa ({filteredOrders.length})</span>
            </button>

            <button
              className={`tab-btn ${activeTab === 'spk' ? 'active' : ''}`}
              onClick={() => setActiveTab('spk')}
            >
              <Wrench size={16} />
              <span>SPK Pemeliharaan Bengkel ({filteredSPK.length})</span>
            </button>

            <button
              className={`tab-btn ${activeTab === 'saw' ? 'active' : ''}`}
              onClick={() => setActiveTab('saw')}
            >
              <Award size={16} />
              <span>Prioritas Servis SAW ({sawData?.critical_count ?? 0} Kritis)</span>
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
              {showAllSPKPeriod && (
                <div style={{
                  padding: '8px 14px',
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '8px',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  color: '#1e40af'
                }}>
                  <span>Menampilkan seluruh {spkList.length} SPK Pemeliharaan tanpa pembatasan filter periode tahun/bulan.</span>
                  <button
                    onClick={() => setShowAllSPKPeriod(false)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#2563eb',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    Kembalikan ke Filter Periode
                  </button>
                </div>
              )}
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
                          <p>
                            {selectedYear !== 'ALL' && spkList.length > 0
                              ? `Tidak ada SPK pada periode Tahun ${selectedYear}`
                              : 'Belum ada Surat Perintah Kerja (SPK) bengkel'}
                          </p>
                          {selectedYear !== 'ALL' && spkList.length > 0 && (
                            <>
                              <small style={{ color: '#64748b', marginTop: '4px' }}>
                                Terdapat {spkList.length} dokumen SPK di periode lain.
                              </small>
                              <button
                                onClick={() => setShowAllSPKPeriod(true)}
                                style={{
                                  marginTop: '10px',
                                  padding: '6px 14px',
                                  borderRadius: '8px',
                                  background: '#2563eb',
                                  color: '#ffffff',
                                  border: 'none',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                              >
                                Tampilkan Semua Periode SPK
                              </button>
                            </>
                          )}
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

          {activeTab === 'saw' && (
            <div className="table-responsive">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Peringkat</th>
                    <th>Unit Forklift</th>
                    <th>Skor Risiko SAW (Vi)</th>
                    <th>Status Prioritas</th>
                    <th>Hour Meter (C1)</th>
                    <th>Usia (C2)</th>
                    <th>Kerusakan (C3)</th>
                    <th>Status SPK</th>
                  </tr>
                </thead>
                <tbody>
                  {!sawData || !sawData.alternatives || sawData.alternatives.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="empty-row">
                        <div className="empty-state-box">
                          <Award size={36} />
                          <p>Belum ada data hasil kalkulasi SAW</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    sawData.alternatives.map((alt) => (
                      <tr key={alt.unit_id}>
                        <td>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: '28px', height: '28px', borderRadius: '50%', fontWeight: 800, fontSize: '12px',
                            background: alt.rank_order <= 3 ? '#fee2e2' : '#f1f5f9',
                            color: alt.rank_order <= 3 ? '#dc2626' : '#475569'
                          }}>
                            #{alt.rank_order}
                          </span>
                        </td>
                        <td>
                          <div className="unit-badge-cell">
                            <strong>{alt.unit_code}</strong>
                            <span>{alt.brand} ({alt.capacity_ton}T)</span>
                          </div>
                        </td>
                        <td>
                          <strong style={{ fontSize: '14px', color: '#0f172a' }}>
                            {Number(alt.score_v || 0).toFixed(4)}
                          </strong>
                        </td>
                        <td>
                          <span className={`risk-tag ${alt.risk_status === 'CRITICAL' ? 'critical' : 'warning'}`}
                            style={alt.risk_status === 'SAFE' ? { background: '#dcfce7', color: '#166534' } : undefined}
                          >
                            {alt.risk_status === 'CRITICAL' ? 'KRITIS' : alt.risk_status === 'WARNING' ? 'WASPADA' : 'AMAN'}
                          </span>
                        </td>
                        <td>{alt.raw_values?.C1 ?? 0} Jam</td>
                        <td>{alt.raw_values?.C2 ?? 0} Thn</td>
                        <td>{alt.raw_values?.C3 ?? 0}x</td>
                        <td>
                          <span className={`status-pill ${alt.spk_status === 'ISSUED' ? 'sop-working' : 'sop-finished'}`}>
                            {alt.spk_status === 'ISSUED' ? 'SPK Diterbitkan' : 'Siap / Belum SPK'}
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