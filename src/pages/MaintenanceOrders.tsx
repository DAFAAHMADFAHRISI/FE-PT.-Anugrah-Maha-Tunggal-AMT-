import React, { useState, useEffect } from 'react';
import {
  Wrench, Printer, AlertCircle, CheckCircle,
  Clock, Calendar, HardHat, FileText, ArrowRight
} from 'lucide-react';
import { SPKMaintenance } from '../types';
import { sawService } from '../services/sawService';
import { SPKPrintDocument } from '../components/SPKPrintDocument';

export const MaintenanceOrders: React.FC = () => {
  const [spkList, setSpkList] = useState<SPKMaintenance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [previewSPK, setPreviewSPK] = useState<SPKMaintenance | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadSPK();
  }, []);

  const loadSPK = async () => {
    setIsLoading(true);
    try {
      const data = await sawService.getSPKMaintenanceList();
      setSpkList(data || []);
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.error || 'Gagal memuat daftar SPK Pemeliharaan');
    } finally {
      setIsLoading(false);
    }
  };

  if (previewSPK) {
    return (
      <SPKPrintDocument
        spk={previewSPK}
        onBack={() => setPreviewSPK(null)}
      />
    );
  }

  return (
    <div className="page-container" style={{ padding: '24px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Wrench className="text-primary" size={28} style={{ color: '#dc2626' }} />
            Daftar Surat Perintah Kerja (SPK) Pemeliharaan Bengkel
          </h1>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>
            Dokumen resmi perintah servis fisik bengkel yang diterbitkan dari rekomendasi ranking SPK SAW
          </p>
        </div>
      </div>

      {errorMessage && (
        <div style={{
          padding: '14px 18px', background: '#fef2f2', border: '1px solid #fecaca',
          borderRadius: '10px', color: '#991b1b', marginBottom: '20px',
          display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px'
        }}>
          <AlertCircle size={20} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Tabel Daftar SPK */}
      <div style={{
        background: '#ffffff', borderRadius: '16px', padding: '24px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', textAlign: 'left' }}>
                <th style={{ padding: '12px 14px' }}>Nomor SPK</th>
                <th style={{ padding: '12px 14px' }}>Unit Forklift</th>
                <th style={{ padding: '12px 14px' }}>Mekanik Pelaksana</th>
                <th style={{ padding: '12px 14px' }}>Tanggal Servis</th>
                <th style={{ padding: '12px 14px' }}>Catatan Target Perbaikan</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>Skor SAW</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {spkList.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                    Belum ada dokumen SPK Pemeliharaan yang diterbitkan.
                  </td>
                </tr>
              ) : (
                spkList.map((spk) => (
                  <tr key={spk.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0f172a' }}>
                      {spk.spk_number}
                      <span style={{ display: 'block', fontSize: '11px', color: '#64748b', fontWeight: 400 }}>
                        {new Date(spk.created_at).toLocaleDateString('id-ID')}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>
                        {spk.unit?.unit_code || `Unit #${spk.unit_id}`}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        {spk.unit?.brand} ({spk.unit?.capacity_ton}T)
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: '#334155' }}>
                      {spk.mechanic_name}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#475569', whiteSpace: 'nowrap' }}>
                      {spk.scheduled_date}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#334155', maxWidth: '300px' }}>
                      {spk.complaint_notes}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <span style={{
                        padding: '3px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 700,
                        background: '#fee2e2', color: '#991b1b'
                      }}>
                        {spk.risk_score.toFixed(4)}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700,
                        background: spk.status === 'COMPLETED' ? '#dcfce7' : '#fef3c7',
                        color: spk.status === 'COMPLETED' ? '#166534' : '#92400e',
                      }}>
                        {spk.status === 'COMPLETED' ? 'Selesai' : 'Sedang Dirawat'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <button
                        onClick={() => setPreviewSPK(spk)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '6px',
                          padding: '6px 14px', borderRadius: '8px', border: '1px solid #cbd5e1',
                          background: '#ffffff', color: '#0f172a', fontSize: '12px', fontWeight: 700,
                          cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                        }}
                      >
                        <Printer size={14} style={{ color: '#2563eb' }} />
                        Cetak Fisik
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

