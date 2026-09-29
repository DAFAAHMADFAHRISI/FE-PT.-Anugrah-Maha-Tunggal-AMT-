import React, { useState, useEffect } from 'react';
import { ForkliftUnit } from '../types';
import { api } from '../services/api';
import { HardHat, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

export const ForkliftUnits: React.FC = () => {
  const [units, setUnits] = useState<ForkliftUnit[]>([
    {
      id: 1,
      unit_code: 'FL-01',
      brand: 'Toyota',
      model: '8FD30',
      capacity_ton: 3.0,
      fuel_type: 'Diesel',
      manufacture_year: 2021,
      hourly_rate: 180000,
      daily_rate: 1200000,
      monthly_rate: 22000000,
      status: 'AVAILABLE',
      notes: 'Kondisi prima, servis berkala rutin'
    },
    {
      id: 2,
      unit_code: 'FL-02',
      brand: 'Komatsu',
      model: 'FD50AY-10',
      capacity_ton: 5.0,
      fuel_type: 'Diesel',
      manufacture_year: 2020,
      hourly_rate: 260000,
      daily_rate: 1800000,
      monthly_rate: 34000000,
      status: 'RENTED',
      notes: 'Sedang bertugas di PT. Pelabuhan Samudera Raya'
    },
    {
      id: 3,
      unit_code: 'FL-03',
      brand: 'Mitsubishi',
      model: 'FD70N',
      capacity_ton: 7.0,
      fuel_type: 'Diesel',
      manufacture_year: 2019,
      hourly_rate: 350000,
      daily_rate: 2500000,
      monthly_rate: 45000000,
      status: 'AVAILABLE',
      notes: 'Siap pakai'
    },
    {
      id: 4,
      unit_code: 'FL-04',
      brand: 'Toyota',
      model: '8FB25',
      capacity_ton: 2.5,
      fuel_type: 'Electric',
      manufacture_year: 2022,
      hourly_rate: 160000,
      daily_rate: 1100000,
      monthly_rate: 20000000,
      status: 'AVAILABLE',
      notes: 'Baterai lithium, ideal untuk operasional dalam gudang (bebas emisi)'
    },
    {
      id: 5,
      unit_code: 'FL-05',
      brand: 'TCM',
      model: 'FD100-2',
      capacity_ton: 10.0,
      fuel_type: 'Diesel',
      manufacture_year: 2018,
      hourly_rate: 550000,
      daily_rate: 3800000,
      monthly_rate: 68000000,
      status: 'MAINTENANCE',
      notes: 'Jadwal servis hidrolik dan pergantian oli mesin'
    }
  ]);

  useEffect(() => {
    api.get('/units')
      .then((res) => {
        if (res.data.success && res.data.data && res.data.data.length > 0) {
          setUnits(res.data.data);
        }
      })
      .catch((err) => {
        console.log('Menggunakan data awal unit:', err);
      });
  }, []);

  return (
    <div className="page-body">
      <div className="content-card">
        <div className="card-header-row">
          <div>
            <h2 className="card-title">Master Data Unit Forklift & Kapasitas Tonase</h2>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
              Data inventaris aset forklift milik PT. Anugrah Maha Tunggal
            </p>
          </div>
          <span style={{ 
            fontSize: '12px', 
            background: '#eff6ff', 
            color: '#1d4ed8', 
            padding: '6px 12px', 
            borderRadius: '6px', 
            fontWeight: 600,
            border: '1px solid #bfdbfe'
          }}>
            {units.length} Unit Terdaftar
          </span>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Kode Unit</th>
                <th>Brand & Model</th>
                <th>Kapasitas Beban</th>
                <th>Bahan Bakar</th>
                <th>Tarif Sewa Harian</th>
                <th>Status Ketersediaan</th>
                <th>Keterangan / Lokasi</th>
              </tr>
            </thead>
            <tbody>
              {units.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 700, color: '#1e3a8a' }}>{u.unit_code}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{u.brand}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Model: {u.model} (Thn {u.manufacture_year})</div>
                  </td>
                  <td>
                    <span style={{ 
                      background: '#f1f5f9', 
                      padding: '4px 10px', 
                      borderRadius: '6px', 
                      fontWeight: 700, 
                      fontSize: '13px' 
                    }}>
                      {u.capacity_ton} Ton
                    </span>
                  </td>
                  <td>{u.fuel_type}</td>
                  <td style={{ fontWeight: 600 }}>Rp {u.daily_rate.toLocaleString('id-ID')}</td>
                  <td>
                    {u.status === 'AVAILABLE' && (
                      <span className="badge badge-ready">READY (POOL)</span>
                    )}
                    {u.status === 'RENTED' && (
                      <span className="badge badge-working">DISEWA / LAPANGAN</span>
                    )}
                    {u.status === 'MAINTENANCE' && (
                      <span className="badge badge-maint">MAINTENANCE</span>
                    )}
                  </td>
                  <td style={{ fontSize: '12px', color: '#475569', maxWidth: '250px' }}>
                    {u.notes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
