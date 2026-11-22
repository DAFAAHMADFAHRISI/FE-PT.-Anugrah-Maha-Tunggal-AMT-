import React, { useState, useEffect } from 'react';
import {
  Award, AlertTriangle, ShieldCheck, Clock,
  Wrench, CheckCircle, HardHat, FileSpreadsheet, Eye, Printer, ChevronRight, History
} from 'lucide-react';
import { SAWCalculationResult, SAWAlternativeResult, SPKMaintenance, HasilRanking } from '../types';
import { sawService } from '../services/sawService';
import { SPKModal } from '../components/SPKModal';
import { SPKPrintDocument } from '../components/SPKPrintDocument';

export const SAWDashboard: React.FC = () => {
  const [rankingData, setRankingData] = useState<SAWCalculationResult | null>(null);
  const [historyList, setHistoryList] = useState<HasilRanking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ranking' | 'history'>('ranking');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal Terbitkan SPK
  const [selectedUnitForSPK, setSelectedUnitForSPK] = useState<SAWAlternativeResult | null>(null);
  const [isSPKModalOpen, setIsSPKModalOpen] = useState(false);

  // Print Preview SPK Dokumen
  const [previewSPK, setPreviewSPK] = useState<SPKMaintenance | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [latestRes, historyRes] = await Promise.all([
        sawService.getLatestRanking(),
        sawService.getRankingHistory(10),
      ]);
      setRankingData(latestRes);
      setHistoryList(historyRes || []);
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err?.response?.data?.error || 'Gagal memuat rekomendasi ranking SAW',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenSPKModal = (unit: SAWAlternativeResult) => {
    setSelectedUnitForSPK(unit);
    setIsSPKModalOpen(true);
  };

  const handleSPKSuccess = (spk: SPKMaintenance) => {
    setNotification({
      type: 'success',
      message: `Surat Perintah Kerja ${spk.spk_number} berhasil diterbitkan! Status unit diubah menjadi MAINTENANCE.`,
    });
    setPreviewSPK(spk); // Tampilkan preview cetak langsung
    loadData();
  };

  // Jika sedang membuka mode cetak dokumen SPK
  if (previewSPK) {
    return (
      <SPKPrintDocument
        spk={previewSPK}
        onBack={() => setPreviewSPK(null)}
      />
    );
  }

  const criticalCount = rankingData?.critical_count ?? 0;
  const warningCount = rankingData?.warning_count ?? 0;
  const safeCount = rankingData?.safe_count ?? 0;
  const totalUnits = rankingData?.total_units ?? 0;

  return (
    <div className="page-container" style={{ padding: '24px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header Halaman */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              padding: '4px 10px', background: '#dbeafe', color: '#1e40af',
              borderRadius: '6px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px'
            }}>
              Decision Support System
            </span>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              Metode Simple Additive Weighting (SAW)
            </span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', margin: '6px 0 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Award className="text-primary" size={28} style={{ color: '#2563eb' }} />
            Live Dashboard Rekomendasi Prioritas Servis
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>
            Sistem Pendukung Keputusan pemeliharaan armada forklift berbasis komputasi matriks ternormalisasi secara real-time
          </p>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div style={{
          padding: '14px 18px',
          background: notification.type === 'success' ? '#f0fdf4' : '#fef2f2',
          border: notification.type === 'success' ? '1px solid #bbf7d0' : '1px solid #fecaca',
          borderRadius: '12px',
          color: notification.type === 'success' ? '#166534' : '#991b1b',
          marginBottom: '20px',
          display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px'
        }}>
          {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header Metrics Card (Gambar 3.8) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px', marginBottom: '24px' }}>
        {/* Total Unit */}
        <div style={{
          background: '#ffffff', borderRadius: '14px', padding: '20px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Total Unit Terdata
            </span>
            <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: '4px 0 0' }}>
              {totalUnits}
            </h2>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Armada Forklift Aktif</span>
          </div>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <HardHat size={24} />
          </div>
        </div>

        {/* Kritis (Merah) */}
        <div style={{
          background: '#ffffff', borderRadius: '14px', padding: '20px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.04)', border: '1px solid #fecaca',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#991b1b', textTransform: 'uppercase' }}>
              Kritis (Servis Segera)
            </span>
            <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#dc2626', margin: '4px 0 0' }}>
              {criticalCount}
            </h2>
            <span style={{ fontSize: '11px', color: '#dc2626', fontWeight: 600 }}>Prioritas Utama Bengkel</span>
          </div>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <AlertTriangle size={24} />
          </div>
        </div>

        {/* Waspada (Kuning) */}
        <div style={{
          background: '#ffffff', borderRadius: '14px', padding: '20px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.04)', border: '1px solid #fde68a',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#92400e', textTransform: 'uppercase' }}>
              Waspada (Mendekati Batas)
            </span>
            <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#d97706', margin: '4px 0 0' }}>
              {warningCount}
            </h2>
            <span style={{ fontSize: '11px', color: '#d97706', fontWeight: 600 }}>Perlu Cek Rutin</span>
          </div>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Clock size={24} />
          </div>
        </div>

        {/* Aman (Hijau) */}
        <div style={{
          background: '#ffffff', borderRadius: '14px', padding: '20px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.04)', border: '1px solid #bbf7d0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>
              Aman (Kondisi Prima)
            </span>
            <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#16a34a', margin: '4px 0 0' }}>
              {safeCount}
            </h2>
            <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600 }}>Siap Sewa / Optimal</span>
          </div>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <ShieldCheck size={24} />
          </div>
        </div>
      </div>

      {/* Tabs Navigation: Live Ranking vs Audit Trail Snapshot */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #e2e8f0', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('ranking')}
          style={{
            padding: '10px 20px', border: 'none', background: 'transparent',
            fontSize: '14px', fontWeight: 700, cursor: 'pointer',
            borderBottom: activeTab === 'ranking' ? '3px solid #2563eb' : '3px solid transparent',
            color: activeTab === 'ranking' ? '#2563eb' : '#64748b',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <Award size={18} />
          Tabel Perankingan Rekomendasi Terkini
        </button>
        <button
          onClick={() => setActiveTab('history')}
          style={{
            padding: '10px 20px', border: 'none', background: 'transparent',
            fontSize: '14px', fontWeight: 700, cursor: 'pointer',
            borderBottom: activeTab === 'history' ? '3px solid #2563eb' : '3px solid transparent',
            color: activeTab === 'history' ? '#2563eb' : '#64748b',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <History size={18} />
          Riwayat Snapshot Sesi Kalkulasi ({historyList.length})
        </button>
      </div>

      {activeTab === 'ranking' ? (
        /* Tabel Perankingan SAW (Gambar 3.8 - CORE UI) */
        <div style={{
          background: '#ffffff', borderRadius: '16px', padding: '24px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0'
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '16px', flexWrap: 'wrap', gap: '12px'
          }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
                Hasil Perhitungan SAW (Urutan Skor V_max → V_min)
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
                Waktu Perhitungan Terakhir:{' '}
                {rankingData?.calculated_at
                  ? new Date(rankingData.calculated_at).toLocaleString('id-ID', {
                      day: '2-digit', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit', second: '2-digit'
                    })
                  : '-'}
              </p>
            </div>

            {/* Info Bobot Preferensi Singkat */}
            <div style={{
              display: 'flex', gap: '8px', background: '#f8fafc', padding: '8px 14px',
              borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px', color: '#475569'
            }}>
              <span><strong>Bobot Aktif:</strong></span>
              <span>C1 (Jam): 30%</span> •
              <span>C2 (Usia): 20%</span> •
              <span>C3 (Rusak): 35%</span> •
              <span>C4 (Idle): 15%</span>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#334155', textAlign: 'left' }}>
                  <th style={{ padding: '12px 14px', width: '60px', textAlign: 'center' }}>Peringkat</th>
                  <th style={{ padding: '12px 14px' }}>Kode Unit Forklift</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>C1: Jam Kerja</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>C2: Usia Mesin</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>C3: Frekuensi Rusak</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>C4: Hari Bebas</th>
                  <th style={{ padding: '12px 14px', minWidth: '150px' }}>Skor Akhir (Vi)</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>Status Risiko</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>Aksi Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {!rankingData || rankingData.alternatives.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                      Belum ada data perankingan unit forklift.
                    </td>
                  </tr>
                ) : (
                  rankingData.alternatives.map((alt) => {
                    const isTop1 = alt.rank_order === 1;
                    const isCritical = alt.risk_status === 'CRITICAL';
                    const isWarning = alt.risk_status === 'WARNING';

                    return (
                      <tr
                        key={alt.unit_id}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          background: isTop1 ? 'rgba(254, 242, 242, 0.5)' : '#ffffff',
                          transition: 'background 0.15s ease'
                        }}
                      >
                        {/* Peringkat Badge */}
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: '28px', height: '28px', borderRadius: '50%',
                            fontSize: '13px', fontWeight: 800,
                            background: isTop1 ? '#dc2626' : alt.rank_order <= 3 ? '#1e293b' : '#f1f5f9',
                            color: isTop1 || alt.rank_order <= 3 ? '#ffffff' : '#475569',
                          }}>
                            {alt.rank_order}
                          </span>
                        </td>

                        {/* Kode Unit Forklift */}
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '14px' }}>
                            {alt.unit_code}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>
                            {alt.brand} ({alt.capacity_ton} Ton) - {alt.model || 'Diesel'}
                          </div>
                        </td>

                        {/* C1: Jam Kerja */}
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <span style={{ fontWeight: 700, color: '#0f172a' }}>
                            {alt.raw_values?.C1 ?? 0}
                          </span>
                          <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>
                            (r: {alt.normalized_values?.C1?.toFixed(2) ?? '-'})
                          </span>
                        </td>

                        {/* C2: Usia Mesin */}
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <span style={{ fontWeight: 700, color: '#0f172a' }}>
                            {alt.raw_values?.C2 ?? 0} Thn
                          </span>
                          <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>
                            (r: {alt.normalized_values?.C2?.toFixed(2) ?? '-'})
                          </span>
                        </td>

                        {/* C3: Frekuensi Rusak */}
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <span style={{
                            fontWeight: 700,
                            color: (alt.raw_values?.C3 ?? 0) >= 3 ? '#dc2626' : '#0f172a'
                          }}>
                            {alt.raw_values?.C3 ?? 0}x
                          </span>
                          <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>
                            (r: {alt.normalized_values?.C3?.toFixed(2) ?? '-'})
                          </span>
                        </td>

                        {/* C4: Hari Bebas */}
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <span style={{ fontWeight: 700, color: '#0f172a' }}>
                            {alt.raw_values?.C4 ?? 0} hr
                          </span>
                          <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>
                            (r: {alt.normalized_values?.C4?.toFixed(2) ?? '-'})
                          </span>
                        </td>

                        {/* Skor Akhir Vi dengan Visual Bar */}
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                              {alt.score_v.toFixed(4)}
                            </span>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>
                              {(alt.score_v * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div style={{ width: '100%', height: '7px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{
                              width: `${Math.min(100, alt.score_v * 100)}%`,
                              height: '100%',
                              background: isCritical
                                ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                                : isWarning
                                ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                                : 'linear-gradient(90deg, #22c55e, #16a34a)',
                              borderRadius: '4px'
                            }} />
                          </div>
                        </td>

                        {/* Status Risiko Badge */}
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <span style={{
                            padding: '4px 12px', borderRadius: '16px', fontSize: '11px', fontWeight: 700,
                            display: 'inline-block',
                            background: isCritical ? '#fee2e2' : isWarning ? '#fef3c7' : '#dcfce7',
                            color: isCritical ? '#991b1b' : isWarning ? '#92400e' : '#166534',
                            border: isCritical ? '1px solid #fecaca' : isWarning ? '1px solid #fde68a' : '1px solid #bbf7d0',
                          }}>
                            {isCritical ? 'Kritis (Segera)' : isWarning ? 'Waspada' : 'Aman'}
                          </span>
                        </td>

                        {/* Action Button: Terbitkan SPK Pemeliharaan */}
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          {alt.spk_status === 'ISSUED' ? (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '5px',
                              padding: '5px 12px', borderRadius: '8px', background: '#f1f5f9',
                              color: '#64748b', fontSize: '12px', fontWeight: 600
                            }}>
                              <CheckCircle size={14} style={{ color: '#16a34a' }} />
                              SPK Aktif
                            </span>
                          ) : (
                            <button
                              onClick={() => handleOpenSPKModal(alt)}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                padding: '6px 14px', borderRadius: '8px', border: 'none',
                                background: isCritical
                                  ? 'linear-gradient(135deg, #dc2626, #b91c1c)'
                                  : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                                color: '#ffffff', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                                boxShadow: isCritical
                                  ? '0 2px 8px rgba(220, 38, 38, 0.35)'
                                  : '0 2px 8px rgba(37, 99, 235, 0.25)',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              <Wrench size={13} />
                              Terbitkan SPK
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Tab Riwayat Snapshot Kalkulasi (Audit Trail) */
        <div style={{
          background: '#ffffff', borderRadius: '16px', padding: '24px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0'
        }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
            Riwayat Audit Trail Sesi Perhitungan SAW
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#334155', textAlign: 'left' }}>
                <th style={{ padding: '10px 14px' }}>Kode Sesi</th>
                <th style={{ padding: '10px 14px' }}>Waktu Hitung</th>
                <th style={{ padding: '10px 14px', textAlign: 'center' }}>Total Armada</th>
                <th style={{ padding: '10px 14px', textAlign: 'center' }}>Kritis (Merah)</th>
                <th style={{ padding: '10px 14px', textAlign: 'center' }}>Waspada (Kuning)</th>
                <th style={{ padding: '10px 14px', textAlign: 'center' }}>Aman (Hijau)</th>
                <th style={{ padding: '10px 14px' }}>Catatan</th>
              </tr>
            </thead>
            <tbody>
              {historyList.map((h) => (
                <tr key={h.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: '#2563eb' }}>
                    {h.calculation_code}
                  </td>
                  <td style={{ padding: '12px 14px', color: '#475569' }}>
                    {new Date(h.calculated_at).toLocaleString('id-ID')}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700 }}>
                    {h.total_units} Unit
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'center', color: '#dc2626', fontWeight: 700 }}>
                    {h.critical_count}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'center', color: '#d97706', fontWeight: 700 }}>
                    {h.warning_count}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'center', color: '#16a34a', fontWeight: 700 }}>
                    {h.safe_count}
                  </td>
                  <td style={{ padding: '12px 14px', color: '#64748b' }}>
                    {h.notes || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Terbitkan SPK Pemeliharaan (Gambar 3.9) */}
      <SPKModal
        unit={selectedUnitForSPK}
        isOpen={isSPKModalOpen}
        onClose={() => {
          setIsSPKModalOpen(false);
          setSelectedUnitForSPK(null);
        }}
        onSuccess={handleSPKSuccess}
      />
    </div>
  );
};
