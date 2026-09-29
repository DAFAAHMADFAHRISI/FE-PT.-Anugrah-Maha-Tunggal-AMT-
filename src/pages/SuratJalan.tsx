import React, { useState, useEffect } from 'react';
import { Printer, Eye, CheckCircle2, ArrowRight, Play, Check } from 'lucide-react';
import { OperationalStatus } from '../types';
import { api } from '../services/api';

interface DeliveryRecord {
  id: number;
  letter_number: string;
  order_number: string;
  customer_name: string;
  customer_address: string;
  unit_code: string;
  brand: string;
  capacity_ton: number;
  fuel_type: string;
  operator_name: string;
  operator_sio: string;
  issue_date: string;
  departure_time: string;
  job_description: string;
  operational_status: OperationalStatus;
  recipient_name: string;
}

export const SuratJalan: React.FC = () => {
  const [letters, setLetters] = useState<DeliveryRecord[]>([
    {
      id: 1,
      letter_number: 'SJ-202609-0001',
      order_number: 'ORD-202609-0001',
      customer_name: 'PT. Pelabuhan Samudera Raya',
      customer_address: 'Kawasan Industri Cilegon Kav 12, Area Dermaga 3',
      unit_code: 'FL-02',
      brand: 'Komatsu FD50AY-10',
      capacity_ton: 5.0,
      fuel_type: 'Diesel',
      operator_name: 'Agus Prasetyo',
      operator_sio: 'SIO-K3-2022-0091',
      issue_date: '2026-09-24',
      departure_time: '08:30 WIB',
      job_description: 'Bongkar muat kontainer baja plat dan relokasi material berat di dermaga utama',
      operational_status: 'WORKING', // STATUS SEDANG BEKERJA (BG MERAH)
      recipient_name: 'Pak Herman (Koordinator Lapangan PT. PSR)'
    },
    {
      id: 2,
      letter_number: 'SJ-202609-0002',
      order_number: 'ORD-202609-0002',
      customer_name: 'PT. Mega Baja Mandiri',
      customer_address: 'Jl. Raya Narogong Km 14, Bekasi',
      unit_code: 'FL-03',
      brand: 'Mitsubishi FD70N',
      capacity_ton: 7.0,
      fuel_type: 'Diesel',
      operator_name: 'Doni Kurniawan',
      operator_sio: 'SIO-K3-2023-0145',
      issue_date: '2026-09-24',
      departure_time: '13:15 WIB',
      job_description: 'Pemindahan gulungan baja coil kapasitas 6-7 ton',
      operational_status: 'ON_THE_WAY', // MENUJU ALAMAT TUJUAN
      recipient_name: 'Ibu Maya (Logistik)'
    }
  ]);

  const [activePrintLetter, setActivePrintLetter] = useState<DeliveryRecord | null>(null);

  // Ambil data surat jalan dari backend Golang saat komponen dimuat
  useEffect(() => {
    api.get('/delivery-letters')
      .then((res) => {
        if (res.data.success && res.data.data && res.data.data.length > 0) {
          const mapped = res.data.data.map((item: any) => ({
            id: item.id,
            letter_number: item.letter_number,
            order_number: item.rental_order ? item.rental_order.order_number : 'ORD-202609-0001',
            customer_name: item.rental_order && item.rental_order.customer ? item.rental_order.customer.name : 'PT. Pelabuhan Samudera Raya',
            customer_address: item.rental_order ? item.rental_order.project_location : 'Area Dermaga Cilegon',
            unit_code: item.unit ? item.unit.unit_code : 'FL-01',
            brand: item.unit ? `${item.unit.brand} ${item.unit.model || ''}` : 'Toyota',
            capacity_ton: item.unit ? item.unit.capacity_ton : 3.0,
            fuel_type: item.unit ? item.unit.fuel_type : 'Diesel',
            operator_name: item.operator ? item.operator.name : 'Agus Prasetyo',
            operator_sio: item.operator ? item.operator.sio_number : 'SIO-K3-2022',
            issue_date: item.issue_date,
            departure_time: item.departure_time || '08:30 WIB',
            job_description: item.job_description || 'Operasional bongkar muat',
            operational_status: item.operational_status,
            recipient_name: item.recipient_name || 'Koordinator Lapangan'
          }));
          setLetters(mapped);
        }
      })
      .catch(() => {});
  }, []);

  // Fungsi transisi status operasional (Sesuai Diagram Alur Operasional)
  const handleUpdateStatus = (id: number, nextStatus: OperationalStatus) => {
    setLetters((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, operational_status: nextStatus };
        }
        return item;
      })
    );

    // Kirim pembaruan status ke backend Golang
    api.patch(`/delivery-letters/${id}/operational-status`, {
      status: nextStatus,
      notes: `Status diperbarui menjadi ${nextStatus} via antarmuka ERP`
    }).catch((err) => {
      console.log('Update status tersimpan secara lokal:', err);
    });
  };

  const handlePrint = (record: DeliveryRecord) => {
    setActivePrintLetter(record);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  return (
    <div className="page-body">
      <div className="content-card no-print">
        <div className="card-header-row">
          <div>
            <h2 className="card-title">Modul Surat Jalan & Siklus Operasional Unit</h2>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
              Dokumen Surat Jalan dicetak otomatis dan diserahkan ke Operator untuk operasional lapangan
            </p>
          </div>
        </div>

        {/* Tabel Surat Jalan */}
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>No. Surat Jalan</th>
                <th>Tanggal Terbit</th>
                <th>Penerima (Customer)</th>
                <th>Unit & Kapasitas Berat</th>
                <th>Operator Bertugas</th>
                <th>Alur Siklus Operasional</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {letters.map((row) => (
                <tr key={row.id}>
                  <td style={{ fontWeight: 700, color: '#2563eb' }}>{row.letter_number}</td>
                  <td>{row.issue_date}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{row.customer_name}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{row.customer_address}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{row.unit_code} ({row.capacity_ton} Ton)</div>
                    <div style={{ fontSize: '11px', color: '#475569' }}>{row.brand}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{row.operator_name}</div>
                    <div style={{ fontSize: '11px', color: '#16a34a' }}>{row.operator_sio}</div>
                  </td>
                  <td>
                    {/* Status Tracker Interaktif sesuai diagram user */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {row.operational_status === 'ASSIGNED' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="badge badge-assigned">1. UNIT DIAMBIL OPERATOR</span>
                          <button 
                            className="btn-secondary" 
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                            onClick={() => handleUpdateStatus(row.id, 'ON_THE_WAY')}
                            title="Lanjut: Berangkat menuju lokasi"
                          >
                            Menuju Lokasi ➔
                          </button>
                        </div>
                      )}

                      {row.operational_status === 'ON_THE_WAY' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="badge badge-on-the-way">2. MENUJU LOKASI TUJUAN</span>
                          <button 
                            className="btn-primary" 
                            style={{ padding: '4px 8px', fontSize: '11px', background: '#991b1b' }}
                            onClick={() => handleUpdateStatus(row.id, 'WORKING')}
                            title="Tiba di lokasi dan mulai bekerja"
                          >
                            Mulai Bekerja ▶
                          </button>
                        </div>
                      )}

                      {row.operational_status === 'WORKING' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {/* BG MERAH - STATUSNYA BEKERJA/PROSES */}
                          <span className="badge badge-working">
                            3. SEDANG BEKERJA (PROSES)
                          </span>
                          <button 
                            className="btn-secondary" 
                            style={{ padding: '4px 8px', fontSize: '11px', background: '#15803d', color: '#fff', border: 'none' }}
                            onClick={() => handleUpdateStatus(row.id, 'FINISHED')}
                            title="Pekerjaan selesai, unit kembali ke pool"
                          >
                            Selesai & Pulang ✓
                          </button>
                        </div>
                      )}

                      {row.operational_status === 'FINISHED' && (
                        <span className="badge badge-ready">
                          ✓ OPERASIONAL SELESAI (UNIT READY)
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button 
                        className="btn-secondary" 
                        style={{ padding: '6px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        onClick={() => handlePrint(row)}
                        title="Cetak Surat Jalan Resmi"
                      >
                        <Printer size={14} /> Cetak SJ
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DOKUMEN CETAK SURAT JALAN RESMI (Tampil saat Cetak / Print Mode) */}
      {activePrintLetter && (
        <div className="print-area">
          <div className="surat-jalan-document">
            {/* Header Dokumen */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img
                  src="/logo-amt.jpg"
                  alt="Logo AMT"
                  style={{
                    width: '60px', height: '60px',
                    objectFit: 'contain',
                  }}
                />
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>PT. ANUGRAH MAHA TUNGGAL</h2>
                  <p style={{ margin: '4px 0 0', fontSize: '12px' }}>
                    Layanan Penyewaan Alat Berat, Forklift & Logistik Terpadu
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: '11px' }}>
                    Pool & Workshop: Jl. Raya Industri No. 88 | Telp: (021) 8899-7711 | Email: ops@anugrahmahatunggal.com
                  </p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, textDecoration: 'underline' }}>SURAT JALAN OPERASIONAL</h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', fontWeight: 700 }}>No: {activePrintLetter.letter_number}</p>
                <p style={{ margin: '2px 0 0', fontSize: '12px' }}>Tanggal: {activePrintLetter.issue_date}</p>
              </div>
            </div>

            {/* Informasi Pengiriman */}
            <table style={{ width: '100%', marginBottom: '16px', fontSize: '12px', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ width: '20%', fontWeight: 700, padding: '4px 0' }}>Nama Customer</td>
                  <td style={{ width: '30%', padding: '4px 0' }}>: {activePrintLetter.customer_name}</td>
                  <td style={{ width: '20%', fontWeight: 700, padding: '4px 0' }}>No. Referensi PO</td>
                  <td style={{ width: '30%', padding: '4px 0' }}>: {activePrintLetter.order_number}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 700, padding: '4px 0' }}>Alamat Tujuan</td>
                  <td style={{ padding: '4px 0' }}>: {activePrintLetter.customer_address}</td>
                  <td style={{ fontWeight: 700, padding: '4px 0' }}>Jam Berangkat</td>
                  <td style={{ padding: '4px 0' }}>: {activePrintLetter.departure_time}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 700, padding: '4px 0' }}>PIC Penerima</td>
                  <td style={{ padding: '4px 0' }}>: {activePrintLetter.recipient_name}</td>
                  <td style={{ fontWeight: 700, padding: '4px 0' }}>Nama Operator</td>
                  <td style={{ padding: '4px 0' }}>: {activePrintLetter.operator_name} ({activePrintLetter.operator_sio})</td>
                </tr>
              </tbody>
            </table>

            {/* Spesifikasi Unit & Pekerjaan */}
            <table style={{ width: '100%', border: '1px solid #000', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: '#f0f0f0' }}>
                  <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>No</th>
                  <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>Kode Unit</th>
                  <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>Spesifikasi / Brand Unit</th>
                  <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>Kapasitas Beban</th>
                  <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>Deskripsi Tugas / Pekerjaan</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '10px', textAlign: 'center' }}>1</td>
                  <td style={{ border: '1px solid #000', padding: '10px', fontWeight: 700 }}>{activePrintLetter.unit_code}</td>
                  <td style={{ border: '1px solid #000', padding: '10px' }}>{activePrintLetter.brand} ({activePrintLetter.fuel_type})</td>
                  <td style={{ border: '1px solid #000', padding: '10px', textAlign: 'center', fontWeight: 700 }}>{activePrintLetter.capacity_ton} Ton</td>
                  <td style={{ border: '1px solid #000', padding: '10px' }}>{activePrintLetter.job_description}</td>
                </tr>
              </tbody>
            </table>

            {/* Kolom Tanda Tangan */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', textAlign: 'center', marginTop: '30px', fontSize: '12px' }}>
              <div>
                <p>Diserahkan Oleh (Staff Admin),</p>
                <div style={{ height: '70px' }}></div>
                <p style={{ fontWeight: 700, textDecoration: 'underline' }}>( Siti Rahma )</p>
                <p style={{ fontSize: '11px', color: '#555' }}>Staff Administrasi</p>
              </div>
              <div>
                <p>Pengemudi (Operator Forklift),</p>
                <div style={{ height: '70px' }}></div>
                <p style={{ fontWeight: 700, textDecoration: 'underline' }}>( {activePrintLetter.operator_name} )</p>
                <p style={{ fontSize: '11px', color: '#555' }}>Operator Berizin (SIO)</p>
              </div>
              <div>
                <p>Diterima di Lokasi Oleh,</p>
                <div style={{ height: '70px' }}></div>
                <p style={{ fontWeight: 700, textDecoration: 'underline' }}>( ........................................ )</p>
                <p style={{ fontSize: '11px', color: '#555' }}>Tanda Tangan & Stempel Klien</p>
              </div>
            </div>

            <div style={{ marginTop: '24px', fontSize: '10px', color: '#666', borderTop: '1px dashed #999', paddingTop: '6px' }}>
              * Surat Jalan ini sah dan diterbitkan otomatis oleh Sistem ERP Terintegrasi PT. Anugrah Maha Tunggal.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
