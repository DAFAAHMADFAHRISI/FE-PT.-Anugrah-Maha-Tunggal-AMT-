import React, { useState, useEffect } from 'react';
import {
  Sliders, Save, AlertCircle, CheckCircle2,
  TrendingUp, TrendingDown, Info, ShieldAlert, Award
} from 'lucide-react';
import { Kriteria, BobotKriteria } from '../types';
import { sawService, WeightInput } from '../services/sawService';

export const SAWWeights: React.FC = () => {
  const [kriteriaList, setKriteriaList] = useState<Kriteria[]>([]);
  const [bobotList, setBobotList] = useState<BobotKriteria[]>([]);
  const [weightsMap, setWeightsMap] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await sawService.getCriteriaAndWeights();
      setKriteriaList(data.kriteria || []);
      setBobotList(data.bobot || []);

      const initMap: Record<number, number> = {};
      for (const b of data.bobot) {
        // Simpan dalam persentase bulat / desimal (e.g. 30%)
        initMap[b.kriteria_id] = b.percentage || b.weight * 100;
      }
      setWeightsMap(initMap);
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.error || 'Gagal memuat kriteria dan bobot');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWeightChange = (kriteriaId: number, value: number) => {
    setWeightsMap((prev) => ({
      ...prev,
      [kriteriaId]: Math.max(0, Math.min(100, value)),
    }));
  };

  // Hitung total persentase bobot
  const totalWeight = Object.values(weightsMap).reduce((acc, curr) => acc + (curr || 0), 0);
  const is100Percent = Math.abs(totalWeight - 100) < 0.01;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!is100Percent) {
      setErrorMessage(`Total pembobotan harus tepat 100%. Saat ini: ${totalWeight.toFixed(1)}%`);
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSaving(true);

    try {
      const payload: WeightInput[] = Object.entries(weightsMap).map(([kId, val]) => ({
        kriteria_id: Number(kId),
        weight: val / 100.0, // kirim desimal (e.g. 0.30)
      }));

      await sawService.updateWeights(payload);
      setSuccessMessage('Bobot preferensi kriteria berhasil diperbarui dan peringkat SAW otomatis diselaraskan!');
      loadData();
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.error || 'Gagal memperbarui bobot kriteria');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="page-container" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header Halaman */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sliders className="text-primary" size={28} style={{ color: '#2563eb' }} />
            Pengaturan Bobot Preferensi Kriteria SAW
          </h1>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>
            Fleksibilitas bagi Direktur & Kepala Mekanik menyesuaikan nilai bobot preferensi (W1..W4) dengan validator otomatis 100%
          </p>
        </div>
      </div>

      {/* Notifications */}
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

      {/* Card Utama Pengaturan Bobot (Gambar 3.7) */}
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{
          background: '#ffffff', borderRadius: '16px', padding: '28px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0'
        }}>
          {/* Header Validator 100% */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            paddingBottom: '20px', borderBottom: '1px solid #f1f5f9', marginBottom: '24px',
            flexWrap: 'wrap', gap: '12px'
          }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                Tabel Parameter Kriteria (C1 s.d C4)
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
                Atur bobot preferensi masing-masing kriteria menggunakan slider interaktif atau input angka.
              </p>
            </div>

            {/* Indikator Otomatis Total Weight Check */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 18px',
              borderRadius: '12px', border: is100Percent ? '2px solid #22c55e' : '2px solid #ef4444',
              background: is100Percent ? '#f0fdf4' : '#fef2f2',
            }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>Total Pembobotan:</span>
              <span style={{
                fontSize: '18px', fontWeight: 800,
                color: is100Percent ? '#15803d' : '#b91c1c'
              }}>
                {totalWeight.toFixed(1)}%
              </span>
              <span style={{
                fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px',
                background: is100Percent ? '#dcfce7' : '#fee2e2',
                color: is100Percent ? '#166534' : '#991b1b',
              }}>
                {is100Percent ? 'Valid (100%)' : 'Belum 100%'}
              </span>
            </div>
          </div>

          {/* List Kriteria dengan Slider & Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {kriteriaList.map((k) => {
              const currentWeight = weightsMap[k.id] ?? 0;
              return (
                <div
                  key={k.id}
                  style={{
                    padding: '20px', borderRadius: '12px', background: '#f8fafc',
                    border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        width: '38px', height: '38px', borderRadius: '8px',
                        background: '#2563eb', color: '#ffffff', fontWeight: 800,
                        fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {k.code}
                      </span>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                          {k.name}
                        </h4>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                          Satuan: {k.unit}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {/* Badge Sifat Atribut */}
                      <span style={{
                        padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                        display: 'flex', alignItems: 'center', gap: '5px',
                        background: k.attribute_type === 'benefit' ? '#eff6ff' : '#fef3c7',
                        color: k.attribute_type === 'benefit' ? '#1d4ed8' : '#b45309',
                        border: k.attribute_type === 'benefit' ? '1px solid #bfdbfe' : '1px solid #fde68a'
                      }}>
                        {k.attribute_type === 'benefit' ? (
                          <>
                            <TrendingUp size={14} /> Atribut Keuntungan (Benefit)
                          </>
                        ) : (
                          <>
                            <TrendingDown size={14} /> Atribut Biaya (Cost)
                          </>
                        )}
                      </span>

                      {/* Number Input Nilai Bobot */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          max="100"
                          value={currentWeight}
                          onChange={(e) => handleWeightChange(k.id, Number(e.target.value))}
                          style={{
                            width: '70px', padding: '8px 10px', borderRadius: '8px',
                            border: '1px solid #cbd5e1', fontSize: '15px', fontWeight: 800,
                            textAlign: 'center', color: '#0f172a', background: '#ffffff'
                          }}
                        />
                        <span style={{ fontWeight: 700, color: '#64748b' }}>%</span>
                      </div>
                    </div>
                  </div>

                  {/* Deskripsi Kriteria */}
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: '1.5' }}>
                    {k.description}
                  </p>

                  {/* Range Slider */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={currentWeight}
                      onChange={(e) => handleWeightChange(k.id, Number(e.target.value))}
                      style={{
                        flex: 1, accentColor: '#2563eb', height: '6px', cursor: 'pointer'
                      }}
                    />
                    <span style={{ fontSize: '12px', color: '#475569', fontWeight: 600, minWidth: '45px' }}>
                      (W = {(currentWeight / 100).toFixed(2)})
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Submit Button */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #f1f5f9',
            flexWrap: 'wrap', gap: '12px'
          }}>
            <div style={{ fontSize: '13px', color: is100Percent ? '#15803d' : '#b91c1c', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {is100Percent ? (
                <>
                  <CheckCircle2 size={18} />
                  Validator terpenuhi (Total bobot = 100% / 1.0). Anda dapat menyimpan preferensi ini.
                </>
              ) : (
                <>
                  <ShieldAlert size={18} />
                  Total bobot belum 100%. Sesuaikan slider kriteria di atas agar tombol simpan aktif.
                </>
              )}
            </div>

            <button
              type="submit"
              disabled={isSaving || !is100Percent}
              style={{
                padding: '12px 28px', borderRadius: '10px', border: 'none',
                background: is100Percent
                  ? 'linear-gradient(135deg, #2563eb, #1d4ed8)'
                  : '#cbd5e1',
                color: '#ffffff', fontSize: '15px', fontWeight: 700,
                cursor: is100Percent && !isSaving ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', gap: '8px',
                boxShadow: is100Percent ? '0 4px 14px rgba(37,99,235,0.35)' : 'none'
              }}
            >
              <Save size={18} />
              {isSaving ? 'Menyimpan & Menghitung...' : 'Update Bobot Preferensi'}
            </button>
          </div>
        </div>

        {/* Card Ringkasan Formula Matematis SAW untuk Laporan / Referensi */}
        <div style={{
          background: '#ffffff', borderRadius: '16px', padding: '24px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0'
        }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Info size={18} style={{ color: '#2563eb' }} />
            Landasan Matematis Algoritma SAW (Simple Additive Weighting)
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '12px', color: '#475569' }}>
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <strong>1. Normalisasi Matriks Keputusan R:</strong>
              <ul style={{ margin: '8px 0 0', paddingLeft: '18px', lineHeight: '1.6' }}>
                <li><strong>Benefit (Keuntungan):</strong> <code>r_ij = x_ij / max(x_ij)</code></li>
                <li><strong>Cost (Biaya):</strong> <code>r_ij = min(x_ij) / x_ij</code></li>
              </ul>
            </div>
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <strong>2. Perkalian Terbobot & Nilai Preferensi V:</strong>
              <p style={{ margin: '8px 0 0', lineHeight: '1.6' }}>
                Nilai preferensi setiap alternatif unit forklift dihitung dengan rumus:
                <br />
                <code>V_i = ∑ (w_j × r_ij)</code>
                <br />
                Unit dengan nilai V_i tertinggi (V_max) menempati peringkat 1 yang wajib diprioritaskan untuk pemeliharaan.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
