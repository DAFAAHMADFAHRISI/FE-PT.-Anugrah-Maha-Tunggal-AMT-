import React, { useState } from 'react';
import { X, Wrench, Calendar, AlertTriangle, CheckCircle, Printer } from 'lucide-react';
import { SAWAlternativeResult, SPKMaintenance } from '../types';
import { sawService, SPKMaintenanceInput } from '../services/sawService';

interface SPKModalProps {
  unit: SAWAlternativeResult | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (spk: SPKMaintenance) => void;
}

export const SPKModal: React.FC<SPKModalProps> = ({ unit, isOpen, onClose, onSuccess }) => {
  const [mechanicName, setMechanicName] = useState('Bp. Slamet Riyadi (Kepala Mekanik)');
  const [complaintNotes, setComplaintNotes] = useState(
    'Pemeriksaan komprehensif sistem transmisi & hidrolik, kuras oli mesin, dan penggantian filter berkala.'
  );
  const [scheduledDate, setScheduledDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !unit) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const payload: SPKMaintenanceInput = {
        unit_id: unit.unit_id,
        risk_score: unit.score_v,
        risk_status: unit.risk_status,
        mechanic_name: mechanicName,
        complaint_notes: complaintNotes,
        scheduled_date: scheduledDate,
        notes: notes || `Diterbitkan via Sistem SPK SAW. Rekomendasi: ${unit.recommendation}`,
      };

      const res = await sawService.createSPKMaintenance(payload);
      onSuccess(res);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Gagal menerbitkan Surat Perintah Kerja (SPK)');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
      padding: '16px'
    }}>
      <div className="modal-content" style={{
        background: '#ffffff', borderRadius: '16px', maxWidth: '600px', width: '100%',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden',
        border: '1px solid #e2e8f0', animation: 'scaleUp 0.2s ease-out'
      }}>
        {/* Header Modal */}
        <div style={{
          padding: '20px 24px', background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171'
            }}>
              <Wrench size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>
                Terbitkan SPK Pemeliharaan
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                Surat Perintah Kerja Perawatan Bengkel PT. Anugrah Maha Tunggal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            style={{
              background: 'transparent', border: 'none', color: '#94a3b8',
              cursor: 'pointer', padding: '4px', display: 'flex'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body Modal */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {error && (
            <div style={{
              padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: '8px', color: '#991b1b', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Auto-filled Unit & Skor Risiko Badge */}
          <div style={{
            background: '#f8fafc', padding: '16px', borderRadius: '12px',
            border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px'
          }}>
            <div>
              <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                Unit Forklift Terpilih
              </span>
              <p style={{ margin: '4px 0 0', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                {unit.unit_code} - {unit.brand} ({unit.capacity_ton} Ton)
              </p>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Model: {unit.model || '-'}</span>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                Skor Risiko Vi (Peringkat #{unit.rank_order})
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <span style={{
                  fontSize: '18px', fontWeight: 800,
                  color: unit.risk_color === 'merah' ? '#dc2626' : unit.risk_color === 'kuning' ? '#d97706' : '#16a34a'
                }}>
                  {unit.score_v.toFixed(4)}
                </span>
                <span style={{
                  padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700,
                  background: unit.risk_color === 'merah' ? '#fee2e2' : unit.risk_color === 'kuning' ? '#fef3c7' : '#dcfce7',
                  color: unit.risk_color === 'merah' ? '#991b1b' : unit.risk_color === 'kuning' ? '#92400e' : '#166534',
                }}>
                  {unit.risk_status === 'CRITICAL' ? 'KRITIS (Segera Servis)' : unit.risk_status === 'WARNING' ? 'WASPADA' : 'AMAN'}
                </span>
              </div>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                Jam: {unit.raw_values?.C1 || 0} Jam | Rusak: {unit.raw_values?.C3 || 0}x
              </span>
            </div>
          </div>

          {/* Form Fields */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Mekanik Penanggung Jawab <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              required
              value={mechanicName}
              onChange={(e) => setMechanicName(e.target.value)}
              placeholder="Contoh: Bp. Slamet Riyadi (Kepala Mekanik)"
              style={{
                width: '100%', padding: '10px 14px', borderRadius: '8px',
                border: '1px solid #cbd5e1', fontSize: '14px', color: '#0f172a',
                outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Target Komponen / Catatan Keluhan Perbaikan <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea
              required
              rows={3}
              value={complaintNotes}
              onChange={(e) => setComplaintNotes(e.target.value)}
              placeholder="Tuliskan komponen yang wajib diperiksa, overhaul, atau diganti..."
              style={{
                width: '100%', padding: '10px 14px', borderRadius: '8px',
                border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a',
                outline: 'none', resize: 'vertical', boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Rencana Tanggal Pelaksanaan <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="date"
                  required
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '8px',
                    border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a',
                    outline: 'none', boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Status Unit di ERP Setelah Submit
              </label>
              <div style={{
                padding: '10px 14px', background: '#fffbeb', border: '1px solid #fde68a',
                borderRadius: '8px', fontSize: '13px', color: '#92400e', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} />
                Otomatis: Dalam Perawatan (MAINTENANCE)
              </div>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Catatan Khusus / Instruksi Tambahan (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Instruksi tambahan keselamatan kerja K3 atau vendor suku cadang..."
              style={{
                width: '100%', padding: '10px 14px', borderRadius: '8px',
                border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a',
                outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Footer Actions */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
            gap: '12px', marginTop: '10px', paddingTop: '16px', borderTop: '1px solid #f1f5f9'
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: '10px 18px', borderRadius: '8px', border: '1px solid #cbd5e1',
                background: '#ffffff', color: '#475569', fontSize: '14px', fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '10px 22px', borderRadius: '8px', border: 'none',
                background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#ffffff',
                fontSize: '14px', fontWeight: 700, cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px',
                boxShadow: '0 4px 12px rgba(220, 38, 38, 0.35)'
              }}
            >
              {isSubmitting ? (
                <>Menyimpan SPK...</>
              ) : (
                <>
                  <CheckCircle size={18} />
                  Konfirmasi & Terbitkan SPK
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

