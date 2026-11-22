import React from 'react';
import { Printer, ArrowLeft, Wrench, CheckSquare, Calendar, User, ShieldCheck } from 'lucide-react';
import { SPKMaintenance } from '../types';

interface SPKPrintDocumentProps {
  spk: SPKMaintenance | null;
  onBack: () => void;
}

export const SPKPrintDocument: React.FC<SPKPrintDocumentProps> = ({ spk, onBack }) => {
  if (!spk) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto', padding: '24px' }}>
      {/* Top Action Bar (No Print) */}
      <div className="no-print" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '20px', padding: '12px 18px', background: '#ffffff',
        borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0'
      }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px',
            background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px',
            color: '#334155', fontSize: '13px', fontWeight: 600, cursor: 'pointer'
          }}
        >
          <ArrowLeft size={16} /> Kembali
        </button>
        <button
          onClick={handlePrint}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', border: 'none',
            borderRadius: '8px', color: '#ffffff', fontSize: '14px', fontWeight: 700,
            cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.3)'
          }}
        >
          <Printer size={18} /> Cetak Dokumen SPK Fisik
        </button>
      </div>

      {/* Printable Paper Area */}
      <div className="print-area spk-print-area" style={{
        background: '#ffffff', padding: '40px 48px', borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #cbd5e1',
        fontFamily: "'Times New Roman', Times, serif", color: '#000000'
      }}>
        {/* Header / Kop Surat PT. Anugrah Maha Tunggal */}
        <div style={{
          display: 'flex', alignItems: 'center', borderBottom: '3px double #000000',
          paddingBottom: '10px', marginBottom: '14px', gap: '16px'
        }}>
          <div style={{ width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 120 120" width="75" height="75">
              <polygon points="60,5 73,42 112,42 80,65 90,103 60,80 30,103 40,65 8,42 47,42" fill="#C23B2A" />
              <text x="60" y="68" textAnchor="middle" fill="#fff" fontSize="18" fontWeight="bold" fontFamily="Arial">AMT</text>
            </svg>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
              PT. ANUGRAH MAHA TUNGGAL
            </h1>
            <p style={{ margin: '4px 0', fontSize: '12px' }}>
              Jasa Rental Forklift, Alat Berat & Layanan Bengkel Maintenance Profesional
            </p>
            <p style={{ margin: 0, fontSize: '11px', color: '#333333' }}>
              Jl. Pegangsaan II No. 88, Kelapa Gading, Jakarta Utara | Telp: (021) 460-2345 | Email: operasional@anugrahmahatunggal.com
            </p>
          </div>
        </div>

        {/* Judul Dokumen */}
        <div style={{ textAlign: 'center', marginBottom: '14px' }}>
          <h2 style={{
            margin: 0, fontSize: '16px', fontWeight: 'bold', textDecoration: 'underline',
            textTransform: 'uppercase', letterSpacing: '0.5px'
          }}>
            SURAT PERINTAH KERJA (SPK) PEMELIHARAAN
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '13px', fontWeight: 'bold' }}>
            Nomor: {spk.spk_number}
          </p>
        </div>

        {/* Informasi Rujukan Sistem SPK SAW */}
        <div style={{
          padding: '8px 12px', background: '#f8fafc', border: '1px solid #94a3b8',
          fontSize: '10px', fontFamily: 'Arial, sans-serif', marginBottom: '12px', borderRadius: '4px'
        }}>
          <strong>Rujukan Analytic Engine SAW (Simple Additive Weighting):</strong> Dokumen ini diterbitkan otomatis berdasarkan kalkulasi prioritas risiko keausan armada. Unit teridentifikasi dalam status prioritas tinggi (Skor Risiko Vi = {spk.risk_score.toFixed(4)}).
        </div>

        {/* Tabel Data Unit & Penugasan Mekanik */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px', fontSize: '12px' }}>
          <tbody>
            <tr>
              <td style={{ width: '25%', padding: '5px 8px', fontWeight: 'bold', border: '1px solid #999' }}>Kode Unit / Lambung</td>
              <td style={{ width: '25%', padding: '5px 8px', border: '1px solid #999' }}>{spk.unit?.unit_code || '-'}</td>
              <td style={{ width: '25%', padding: '5px 8px', fontWeight: 'bold', border: '1px solid #999' }}>Tanggal Rencana Servis</td>
              <td style={{ width: '25%', padding: '5px 8px', border: '1px solid #999' }}>{spk.scheduled_date}</td>
            </tr>
            <tr>
              <td style={{ padding: '5px 8px', fontWeight: 'bold', border: '1px solid #999' }}>Merk Pabrikan / Model</td>
              <td style={{ padding: '5px 8px', border: '1px solid #999' }}>{spk.unit?.brand} ({spk.unit?.model || '-'})</td>
              <td style={{ padding: '5px 8px', fontWeight: 'bold', border: '1px solid #999' }}>Kapasitas Tonase</td>
              <td style={{ padding: '5px 8px', border: '1px solid #999' }}>{spk.unit?.capacity_ton} Ton ({spk.unit?.fuel_type})</td>
            </tr>
            <tr>
              <td style={{ padding: '5px 8px', fontWeight: 'bold', border: '1px solid #999' }}>Total Hour Meter (C1)</td>
              <td style={{ padding: '5px 8px', border: '1px solid #999' }}>{spk.unit?.hour_meter || 0} Jam</td>
              <td style={{ padding: '5px 8px', fontWeight: 'bold', border: '1px solid #999' }}>Frekuensi Kerusakan (C3)</td>
              <td style={{ padding: '5px 8px', border: '1px solid #999' }}>{spk.unit?.breakdown_frequency || 0} Kali</td>
            </tr>
            <tr>
              <td style={{ padding: '5px 8px', fontWeight: 'bold', border: '1px solid #999' }}>Mekanik Penanggung Jawab</td>
              <td colSpan={3} style={{ padding: '5px 8px', border: '1px solid #999', fontWeight: 'bold' }}>
                {spk.mechanic_name}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Instruksi & Target Komponen Perbaikan */}
        <div style={{ marginBottom: '12px' }}>
          <h4 style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>
            A. Uraian Pekerjaan / Target Komponen Perbaikan:
          </h4>
          <div style={{
            padding: '8px 12px', border: '1px solid #999', minHeight: '40px',
            fontSize: '12px', lineHeight: '1.4', background: '#fafafa'
          }}>
            {spk.complaint_notes}
          </div>
        </div>

        {/* Checklist Pengerjaan Bengkel */}
        <div style={{ marginBottom: '14px' }}>
          <h4 style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>
            B. Checklist Uji Kelayakan Standar Operasional:
          </h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ border: '1px solid #999', padding: '4px', width: '28px', textAlign: 'center' }}>No</th>
                <th style={{ border: '1px solid #999', padding: '4px', textAlign: 'left' }}>Item Pengecekan</th>
                <th style={{ border: '1px solid #999', padding: '4px', width: '70px', textAlign: 'center' }}>Baik (OK)</th>
                <th style={{ border: '1px solid #999', padding: '4px', width: '70px', textAlign: 'center' }}>Perlu Ganti</th>
                <th style={{ border: '1px solid #999', padding: '4px', textAlign: 'left' }}>Catatan Teknisi</th>
              </tr>
            </thead>
            <tbody>
              {[
                'Oli Mesin, Oli Hidrolik, dan Minyak Rem',
                'Filter Solar, Filter Udara, dan Filter Oli',
                'Silinder Hidrolik, Mast, dan Rantai Garpu (Forks)',
                'Sistem Pengereman & Handbrake Parkir',
                'Kelistrikan, Indikator Dashboard, dan Klakson/Lampu Kerja',
                'Kondisi Tekanan & Keausan Ban Depan/Belakang',
              ].map((item, idx) => (
                <tr key={idx}>
                  <td style={{ border: '1px solid #999', padding: '3px', textAlign: 'center' }}>{idx + 1}</td>
                  <td style={{ border: '1px solid #999', padding: '3px' }}>{item}</td>
                  <td style={{ border: '1px solid #999', padding: '3px', textAlign: 'center' }}>[ &nbsp; ]</td>
                  <td style={{ border: '1px solid #999', padding: '3px', textAlign: 'center' }}>[ &nbsp; ]</td>
                  <td style={{ border: '1px solid #999', padding: '3px' }}></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Area Tanda Tangan */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', textAlign: 'center',
          marginTop: '16px', pageBreakInside: 'avoid'
        }}>
          <div>
            <p style={{ margin: 0, fontSize: '11px' }}>Diterbitkan Oleh,</p>
            <p style={{ margin: '2px 0 0', fontSize: '10px', color: '#666' }}>Admin Operasional</p>
            <div style={{ height: '50px' }} />
            <p style={{ margin: 0, fontSize: '11px', fontWeight: 'bold', textDecoration: 'underline' }}>
              ( Dafa Ahmad F. )
            </p>
          </div>

          <div>
            <p style={{ margin: 0, fontSize: '11px' }}>Mekanik Pelaksana,</p>
            <p style={{ margin: '2px 0 0', fontSize: '10px', color: '#666' }}>Kepala Bengkel</p>
            <div style={{ height: '50px' }} />
            <p style={{ margin: 0, fontSize: '11px', fontWeight: 'bold', textDecoration: 'underline' }}>
              ( {spk.mechanic_name} )
            </p>
          </div>

          <div>
            <p style={{ margin: 0, fontSize: '11px' }}>Mengetahui & Menyetujui,</p>
            <p style={{ margin: '2px 0 0', fontSize: '10px', color: '#666' }}>Direktur Utama</p>
            <div style={{ height: '50px' }} />
            <p style={{ margin: 0, fontSize: '11px', fontWeight: 'bold', textDecoration: 'underline' }}>
              ( Ghofur )
            </p>
          </div>
        </div>

        {/* Footer Nota */}
        <div style={{ marginTop: '14px', paddingTop: '8px', borderTop: '1px dashed #999', fontSize: '9px', color: '#666', textAlign: 'center' }}>
          Dokumen ini merupakan Surat Perintah Kerja resmi bengkel PT. Anugrah Maha Tunggal. Harap lembar verifikasi dikembalikan ke bagian admin operasional setelah uji jalan (trial run) dinyatakan lolos.
        </div>
      </div>
    </div>
  );
};
