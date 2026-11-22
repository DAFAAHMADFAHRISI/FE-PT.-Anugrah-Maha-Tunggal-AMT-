import React, { useState, useEffect } from 'react';
import {
  FileText, Plus, AlertCircle, CheckCircle2,
  HardHat, Calendar, Clock, Gauge, AlertTriangle, ShieldCheck
} from 'lucide-react';
import { ForkliftUnit, OperationalLog } from '../types';
import { api } from '../services/api';
import { sawService, OperationalLogInput } from '../services/sawService';

export const OperationalLogs: React.FC = () => {
  const [units, setUnits] = useState<ForkliftUnit[]>([]);
  const [logs, setLogs] = useState<OperationalLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State (Gambar 3.6 - Input Variabel Mentah)
  const [selectedUnitId, setSelectedUnitId] = useState<number | ''>('');
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [hourMeter, setHourMeter] = useState<number | ''>('');
  const [machineAge, setMachineAge] = useState<number | ''>('');
  const [breakdownFreq, setBreakdownFreq] = useState<number | ''>('');
  const [idleDays, setIdleDays] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  // Filter
  const [filterUnitId, setFilterUnitId] = useState<string>('ALL');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [unitsRes, logsData] = await Promise.all([
        api.get('/units'),
        sawService.getOperationalLogs(),
      ]);
      setUnits(unitsRes.data.data || []);
      setLogs(logsData || []);
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.error || 'Gagal memuat data log operasional');
    } finally {
      setIsLoading(false);
    }
  };

  // Saat unit dipilih di dropdown, isi default C1..C4 dari data terakhir unit
  const handleSelectUnit = (unitId: number) => {
    setSelectedUnitId(unitId);
    const u = units.find((x) => x.id === unitId);
    if (u) {
      setHourMeter(u.hour_meter || 0);
      setMachineAge(u.machine_age || 0);
      setBreakdownFreq(u.breakdown_frequency || 0);
      setIdleDays(u.idle_days || 0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnitId) {
      setErrorMessage('Silakan pilih unit forklift terlebih dahulu');
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const payload: OperationalLogInput = {
        unit_id: Number(selectedUnitId),
        log_date: logDate,
        hour_meter: Number(hourMeter) || 0,
        machine_age: Number(machineAge) || 0,
        breakdown_freq: Number(breakdownFreq) || 0,
        idle_days: Number(idleDays) || 0,
        notes: notes || 'Input log harian armada pasca-sewa/masuk pool garasi',
      };

      await sawService.createOperationalLog(payload);
      setSuccessMessage('Log operasional berhasil disimpan! Engine SAW otomatis mengupdate skor prioritas.');
      
      // Reset form
      setNotes('');
      // Reload logs & units
      loadData();
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.error || 'Gagal menyimpan log operasional');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredLogs = filterUnitId === 'ALL'
    ? logs
    : logs.filter((l) => l.unit_id === Number(filterUnitId));

  return (
    <div className="page-container" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header Halaman */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText className="text-primary" size={28} style={{ color: '#2563eb' }} />
            Log Operasional Armada (Variabel Keputusan SPK)
          </h1>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>
            Input dan konfirmasi variabel mentah harian forklift (Hour Meter, Usia, Kerusakan, Hari Bebas) pembentuk Matriks Keputusan X
          </p>
        </div>
      </div>

      {/* Alert Notifications */}
      {successMessage && (
        <div style={{
          padding: '14px 18px', background: '#f0fdf4', border: '1px solid #bbf7d0',
          borderRadius: '10px', color: '#166534', marginBottom: '20px',
          display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px'
        }}>
          <CheckCircle2 size={20} />
          <span>{successMessage}</span>
        </div>
      )}

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

      {/* Grid: Form Input (Kiri) & Riwayat Log (Kanan) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '24px', alignItems: 'start' }}>
        {/* Form Input Log Operasional (Gambar 3.6) */}
        <div style={{
          background: '#ffffff', borderRadius: '16px', padding: '24px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0'
        }}>
          <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '14px', marginBottom: '18px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HardHat size={20} style={{ color: '#ea580c' }} />
              Form Input Variabel Harian Unit
            </h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              Aktor: Staf Operasional / Admin Bengkel
            </span>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Dropdown Select Unit Forklift */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Pilih Unit Forklift (Kode & Merk) <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                required
                value={selectedUnitId}
                onChange={(e) => handleSelectUnit(Number(e.target.value))}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: '8px',
                  border: '1px solid #cbd5e1', fontSize: '14px', color: '#0f172a',
                  outline: 'none', background: '#ffffff', boxSizing: 'border-box'
                }}
              >
                <option value="">-- Pilih Unit Forklift --</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.unit_code} - {u.brand} ({u.capacity_ton} Ton) [{u.status}]
                  </option>
                ))}
              </select>
            </div>

            {/* Tanggal Pencatatan Log */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Tanggal Log Operasional <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="date"
                required
                value={logDate}
                onChange={(e) => setLogDate(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: '8px',
                  border: '1px solid #cbd5e1', fontSize: '14px', color: '#0f172a',
                  outline: 'none', boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Field C1 & C2 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>
                  C1: Total Jam Kerja (Hour Meter) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    required
                    value={hourMeter}
                    onChange={(e) => setHourMeter(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 185"
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: '8px',
                      border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box'
                    }}
                  />
                  <span style={{ position: 'absolute', right: '10px', top: '9px', fontSize: '11px', color: '#94a3b8' }}>Jam</span>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>
                  C2: Usia Unit Mesin <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    required
                    value={machineAge}
                    onChange={(e) => setMachineAge(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 8"
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: '8px',
                      border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box'
                    }}
                  />
                  <span style={{ position: 'absolute', right: '10px', top: '9px', fontSize: '11px', color: '#94a3b8' }}>Tahun</span>
                </div>
              </div>
            </div>

            {/* Field C3 & C4 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>
                  C3: Frekuensi Kerusakan <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    required
                    value={breakdownFreq}
                    onChange={(e) => setBreakdownFreq(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 4"
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: '8px',
                      border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box'
                    }}
                  />
                  <span style={{ position: 'absolute', right: '10px', top: '9px', fontSize: '11px', color: '#94a3b8' }}>Kali</span>
                </div>
                <span style={{ fontSize: '10px', color: '#64748b' }}>Historis 3 bulan terakhir</span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>
                  C4: Sisa Hari Bebas Tugas <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    required
                    value={idleDays}
                    onChange={(e) => setIdleDays(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 7"
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: '8px',
                      border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box'
                    }}
                  />
                  <span style={{ position: 'absolute', right: '10px', top: '9px', fontSize: '11px', color: '#94a3b8' }}>Hari</span>
                </div>
                <span style={{ fontSize: '10px', color: '#64748b' }}>Idle time di garasi/pool</span>
              </div>
            </div>

            {/* Catatan / Keterangan */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Catatan Kondisi Mesin / Inspeksi Fisik
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Misal: Indikasi suara kasar pada pompa hidrolik, suhu mesin normal..."
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: '8px',
                  border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a',
                  outline: 'none', resize: 'vertical', boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Tombol Simpan Log & Trigger Calculation */}
            <button
              type="submit"
              disabled={isSubmitting || !selectedUnitId}
              style={{
                marginTop: '10px', padding: '12px 20px', borderRadius: '8px', border: 'none',
                background: isSubmitting ? '#94a3b8' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: '#ffffff', fontSize: '14px', fontWeight: 700,
                cursor: isSubmitting || !selectedUnitId ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: '0 4px 14px rgba(37,99,235,0.35)'
              }}
            >
              {isSubmitting ? (
                <>Menyimpan & Menghitung SAW...</>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  Simpan Log & Trigger Calculation
                </>
              )}
            </button>
          </form>
        </div>

        {/* Tabel Riwayat Log Operasional */}
        <div style={{
          background: '#ffffff', borderRadius: '16px', padding: '24px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0'
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: '1px solid #f1f5f9', paddingBottom: '14px', marginBottom: '16px',
            flexWrap: 'wrap', gap: '10px'
          }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                Riwayat Log Operasional Harian
              </h3>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Total {filteredLogs.length} entri data log tercatat
              </span>
            </div>

            {/* Filter Unit */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Filter:</span>
              <select
                value={filterUnitId}
                onChange={(e) => setFilterUnitId(e.target.value)}
                style={{
                  padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1',
                  fontSize: '12px', color: '#334155', background: '#f8fafc', outline: 'none'
                }}
              >
                <option value="ALL">Semua Unit</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>{u.unit_code} ({u.brand})</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', textAlign: 'left' }}>
                  <th style={{ padding: '10px 12px' }}>Tanggal</th>
                  <th style={{ padding: '10px 12px' }}>Unit Forklift</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>C1 (Jam)</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>C2 (Thn)</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>C3 (Kali)</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>C4 (Hari)</th>
                  <th style={{ padding: '10px 12px' }}>Catatan</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                      Belum ada data log operasional yang dicatat.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: '#334155', whiteSpace: 'nowrap' }}>
                        {log.log_date}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{log.unit?.unit_code || `Unit #${log.unit_id}`}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{log.unit?.brand} ({log.unit?.capacity_ton}T)</div>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: '#2563eb' }}>
                        {log.hour_meter}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', color: '#475569' }}>
                        {log.machine_age}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: log.breakdown_freq > 2 ? '#dc2626' : '#475569' }}>
                        {log.breakdown_freq}x
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', color: '#475569' }}>
                        {log.idle_days} hr
                      </td>
                      <td style={{ padding: '10px 12px', color: '#64748b', fontSize: '12px' }}>
                        {log.notes || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

