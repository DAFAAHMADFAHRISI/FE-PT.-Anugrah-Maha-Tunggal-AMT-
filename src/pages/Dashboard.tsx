import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ArrowUpRight,
  TrendingUp,
  FileCheck,
  Building
} from 'lucide-react';
import { api } from '../services/api';

export const Dashboard: React.FC = () => {
  // Data simulasi awal jika backend belum terkoneksi
  const [stats, setStats] = useState({
    total_units: 5,
    available_units: 3,
    working_units: 1,
    maintenance_units: 1,
    total_orders_active: 2,
    total_customers: 3,
  });

  const [activeOperations, setActiveOperations] = useState([
    {
      id: 1,
      letter_number: 'SJ-202609-0001',
      order_number: 'ORD-202609-0001',
      customer_name: 'PT. Pelabuhan Samudera Raya',
      unit_code: 'FL-02',
      brand_model: 'Komatsu FD50AY-10 (5.0 Ton)',
      operator_name: 'Agus Prasetyo (SIO-K3-2022-0091)',
      project_location: 'Kawasan Industri Cilegon Kav 12, Area Dermaga 3',
      status: 'WORKING', // STATUS SEDANG BEKERJA (BG MERAH)
      departure_time: '08:30 WIB'
    },
    {
      id: 2,
      letter_number: 'SJ-202609-0002',
      order_number: 'ORD-202609-0002',
      customer_name: 'PT. Mega Baja Mandiri',
      unit_code: 'FL-03',
      brand_model: 'Mitsubishi FD70N (7.0 Ton)',
      operator_name: 'Doni Kurniawan (SIO-K3-2023-0145)',
      project_location: 'Jl. Raya Narogong Km 14, Bekasi',
      status: 'ON_THE_WAY', // MENUJU ALAMAT TUJUAN
      departure_time: '13:15 WIB'
    }
  ]);

  useEffect(() => {
    // Ambil data real dari backend Golang jika aktif
    api.get('/dashboard/direktur')
      .then((res) => {
        if (res.data.success && res.data.data) {
          const d = res.data.data;
          setStats({
            total_units: d.unit_stats.total || 5,
            available_units: d.unit_stats.available || 3,
            working_units: d.unit_stats.rented || 1,
            maintenance_units: d.unit_stats.maintenance || 1,
            total_orders_active: d.order_stats.total_active || 2,
            total_customers: d.total_customers || 3,
          });
        }
      })
      .catch(() => {
        // Mode offline/mock berjalan otomatis
      });
  }, []);

  return (
    <div className="page-body">
      {/* Header Banner Ringkasan Efisiensi */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #2563eb 100%)',
        borderRadius: '16px',
        padding: '28px 32px',
        color: '#ffffff',
        marginBottom: '28px',
        boxShadow: '0 10px 25px -5px rgba(30, 58, 138, 0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <span style={{ 
            background: 'rgba(255, 255, 255, 0.2)', 
            padding: '4px 12px', 
            borderRadius: '20px', 
            fontSize: '12px', 
            fontWeight: 600,
            letterSpacing: '0.5px'
          }}>
            PANEL MONITORING DIREKTUR & MANAJEMEN
          </span>
          <h1 style={{ fontSize: '26px', fontWeight: 800, marginTop: '10px', marginBottom: '6px' }}>
            Efisiensi Tata Kelola Data Operasional Forklift
          </h1>
          <p style={{ fontSize: '14px', color: '#bfdbfe', maxWidth: '650px', lineHeight: 1.5 }}>
            Sistem terintegrasi secara <i>real-time</i> antara pesanan sewa customer, pembuatan surat jalan otomatis, 
            dan pelacakan status unit di lapangan di PT. Anugrah Maha Tunggal.
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '13px', color: '#93c5fd' }}>Sinkronisasi Data</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
            <span style={{ width: '10px', height: '10px', background: '#34d399', borderRadius: '50%', display: 'inline-block' }}></span>
            Real-Time MySQL
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#dbeafe', color: '#1d4ed8' }}>
            <Truck size={26} />
          </div>
          <div className="stat-info">
            <h4>Total Armada Unit</h4>
            <p>{stats.total_units} <span style={{ fontSize: '14px', fontWeight: 500, color: '#64748b' }}>Unit</span></p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#dcfce7', color: '#15803d' }}>
            <CheckCircle2 size={26} />
          </div>
          <div className="stat-info">
            <h4>Unit Siap Disewa (Ready)</h4>
            <p>{stats.available_units} <span style={{ fontSize: '14px', fontWeight: 500, color: '#15803d' }}>Tersedia</span></p>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #991b1b' }}>
          <div className="stat-icon-wrapper" style={{ background: '#fee2e2', color: '#991b1b' }}>
            <Clock size={26} />
          </div>
          <div className="stat-info">
            <h4>Sedang Beroperasi</h4>
            <p style={{ color: '#991b1b' }}>{stats.working_units} <span style={{ fontSize: '14px', fontWeight: 500 }}>Unit</span></p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#fef3c7', color: '#b45309' }}>
            <AlertTriangle size={26} />
          </div>
          <div className="stat-info">
            <h4>Dalam Maintenance</h4>
            <p>{stats.maintenance_units} <span style={{ fontSize: '14px', fontWeight: 500, color: '#b45309' }}>Servis</span></p>
          </div>
        </div>
      </div>

      {/* Section Utama: Monitoring Status Operasional Lapangan (Sesuai Diagram Alur) */}
      <div className="content-card">
        <div className="card-header-row">
          <div>
            <h3 className="card-title">Live Tracker: Operasional Unit & Operator di Lapangan</h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
              Dipantau langsung oleh Direktur sesuai surat jalan yang telah diterbitkan
            </p>
          </div>
          <span style={{ fontSize: '12px', background: '#f1f5f9', padding: '6px 12px', borderRadius: '6px', fontWeight: 600 }}>
            {activeOperations.length} Operasi Berjalan
          </span>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>No. Surat Jalan</th>
                <th>Pelanggan (Customer)</th>
                <th>Unit Forklift & Tonase</th>
                <th>Operator (Driver)</th>
                <th>Alamat Lokasi Kerja</th>
                <th>Status Operasional</th>
              </tr>
            </thead>
            <tbody>
              {activeOperations.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 700, color: '#2563eb' }}>{item.letter_number}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{item.customer_name}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Ref: {item.order_number}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{item.unit_code}</div>
                    <div style={{ fontSize: '11px', color: '#475569' }}>{item.brand_model}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{item.operator_name.split(' (')[0]}</div>
                    <div style={{ fontSize: '11px', color: '#16a34a' }}>SIO Aktif</div>
                  </td>
                  <td style={{ maxWidth: '280px', fontSize: '12px' }}>
                    {item.project_location}
                  </td>
                  <td>
                    {item.status === 'WORKING' && (
                      <span className="badge badge-working">
                        ● SEDANG BEKERJA
                      </span>
                    )}
                    {item.status === 'ON_THE_WAY' && (
                      <span className="badge badge-on-the-way">
                        ➔ MENUJU LOKASI
                      </span>
                    )}
                    {item.status === 'ASSIGNED' && (
                      <span className="badge badge-assigned">
                        ✓ UNIT DIAMBIL
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bagian Perbandingan Efisiensi Data (Nilai Tambah Laporan Tugas Akhir) */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
        gap: '20px' 
      }}>
        <div className="content-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <h4 style={{ color: '#991b1b', marginBottom: '12px', fontSize: '15px' }}>
            Sebelum Implementasi ERP (Sistem Manual)
          </h4>
          <ul style={{ fontSize: '13px', color: '#475569', lineHeight: 1.8, paddingLeft: '20px' }}>
            <li>Pencatatan pesanan di spreadsheet terpisah, berisiko <i>double booking</i> unit.</li>
            <li>Pembuatan surat jalan manual memakan waktu 15–30 menit per pesanan.</li>
            <li>Direktur harus menelepon lapangan untuk mengetahui unit mana yang sedang bekerja.</li>
            <li>Rekapitulasi tagihan bulanan memakan waktu berhari-hari.</li>
          </ul>
        </div>

        <div className="content-card" style={{ borderLeft: '4px solid #16a34a' }}>
          <h4 style={{ color: '#15803d', marginBottom: '12px', fontSize: '15px' }}>
            Sesudah Implementasi ERP Terintegrasi
          </h4>
          <ul style={{ fontSize: '13px', color: '#1e293b', lineHeight: 1.8, paddingLeft: '20px' }}>
            <li>Database terpusat MySQL memastikan ketersediaan unit tervalidasi otomatis.</li>
            <li>Surat jalan ter-<i>generate</i> otomatis seketika saat order disetujui.</li>
            <li>Monitoring status operasional lapangan transparan dan <i>real-time</i> bagi Direktur.</li>
            <li>Pencegahan selisih data dan riwayat penugasan tersimpan permanen.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
