import React, { useState, useEffect } from 'react';
import {
  Printer,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  HardHat,
  UserCheck,
  FileText,
  AlertCircle,
  X,
  Edit3,
  Calendar,
  Eye,
  Check,
  RefreshCw,
  Info
} from 'lucide-react';
import { api } from '../../services/api';
import { OperationalStatus } from '../../types';

export interface AdminDeliveryRecord {
  id: number;
  letter_number: string;
  order_id: number;
  order_number: string;
  customer_name: string;
  customer_address: string;
  unit_code: string;
  brand: string;
  capacity_ton: number;
  fuel_type: string;
  vehicle_number: string;     // Nomor Kendaraan / Pengangkut (e.g. B 9205 U)
  operator_name: string;
  operator_sio: string;
  rigger_name: string;        // Reger / Rigger lapangan
  issue_date: string;         // Tanggal (e.g. 2026-09-28)
  departure_time: string;     // Jam Berangkat (e.g. 09:00 WIB)
  return_time: string;        // Jam Kembali (e.g. 15:00 WIB)
  notes: string;              // Ket / Keterangan (e.g. 1 Shift, Bongkar Kontainer)
  job_description: string;
  operational_status: OperationalStatus;
  recipient_name: string;
  recipient_phone?: string;
  approver_name: string;      // Penanggung Jawab (default: ABDUL GHOFUR)
}

interface OrderOption {
  id: number;
  order_number: string;
  customer_name: string;
  project_location: string;
  location_pic_name: string;
  location_pic_phone?: string;
  unit_id?: number;
  required_capacity_ton: number;
}

interface UnitOption {
  id: number;
  unit_code: string;
  brand: string;
  model?: string;
  capacity_ton: number;
  fuel_type: string;
}

interface OperatorOption {
  id: number;
  name: string;
  sio_number?: string;
  phone?: string;
}

export const SuratJalanAdmin: React.FC = () => {
  // ── State Data Utama ──────────────────────────────────────────
  const [letters, setLetters] = useState<AdminDeliveryRecord[]>([
    {
      id: 1,
      letter_number: 'SJ-202609-0001',
      order_id: 1,
      order_number: 'ORD-202609-0001',
      customer_name: 'PT. Aluminium Ind.',
      customer_address: 'Tipar Cakung, Jakarta Timur',
      unit_code: 'FL-05',
      brand: 'Komatsu FD50AY',
      capacity_ton: 5.0,
      fuel_type: 'Diesel',
      vehicle_number: 'B 9205 UPA',
      operator_name: 'Romi Prasetyo',
      operator_sio: 'SIO-K3-2023-089',
      rigger_name: 'Dedi Sutrisno',
      issue_date: '2026-09-28',
      departure_time: '09:00 WIB',
      return_time: '15:00 WIB',
      notes: '1 Shift (Bongkar Muat Bahan Baku)',
      job_description: 'Bongkar muat bahan baku aluminium dari kontainer pelabuhan',
      operational_status: 'WORKING',
      recipient_name: 'Pak Bambang (Gudang)',
      recipient_phone: '0812-3456-7890',
      approver_name: 'ABDUL GHOFUR',
    },
    {
      id: 2,
      letter_number: 'SJ-202609-0002',
      order_id: 2,
      order_number: 'ORD-202609-0002',
      customer_name: 'PT. Mega Baja Mandiri',
      customer_address: 'Jl. Raya Narogong Km 14, Bekasi Timur',
      unit_code: 'FL-07',
      brand: 'Mitsubishi FD70N',
      capacity_ton: 7.0,
      fuel_type: 'Diesel',
      vehicle_number: 'B 9811 TBC',
      operator_name: 'Doni Kurniawan',
      operator_sio: 'SIO-K3-2023-0145',
      rigger_name: 'Agung Hendra',
      issue_date: '2026-09-29',
      departure_time: '08:30 WIB',
      return_time: '-',
      notes: 'Relokasi plat baja coil & penyusunan gudang',
      job_description: 'Pemindahan gulungan baja coil kapasitas 7 ton',
      operational_status: 'ON_THE_WAY',
      recipient_name: 'Ibu Maya (Logistik)',
      recipient_phone: '0813-9876-5432',
      approver_name: 'ABDUL GHOFUR',
    },
  ]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Master options untuk form buat baru
  const [orders, setOrders] = useState<OrderOption[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [operators, setOperators] = useState<OperatorOption[]>([]);

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedRecord, setSelectedRecord] = useState<AdminDeliveryRecord | null>(null);
  const [printDocument, setPrintDocument] = useState<AdminDeliveryRecord | null>(null);

  // Form State untuk Surat Jalan Baru
  const [formData, setFormData] = useState({
    rental_order_id: '',
    customer_name: '',
    customer_address: '',
    unit_id: '',
    unit_code: '',
    capacity_ton: 5.0,
    vehicle_number: 'B 9205 UPA',
    operator_id: '',
    operator_name: '',
    operator_sio: '',
    rigger_name: '',
    issue_date: new Date().toISOString().split('T')[0],
    departure_time: '',
    return_time: '',
    notes: '1 Shift Operasional',
    job_description: 'Bongkar muat dan relokasi muatan di lokasi klien',
    recipient_name: '',
    recipient_phone: '',
    approver_name: 'ABDUL GHOFUR',
  });

  // Edit Form State
  const [editFormData, setEditFormData] = useState<Partial<AdminDeliveryRecord>>({});

  // ── Muat Data dari Backend Golang ─────────────────────────────
  const loadDeliveryLetters = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/delivery-letters');
      if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        const mapped: AdminDeliveryRecord[] = res.data.data.map((item: any) => {
          // Parse structured notes if available (format: Rigger: ... | Jam Kembali: ... | No. Pol: ...)
          let parsedRigger = 'Reger Lapangan';
          let parsedReturn = '-';
          let parsedVehicle = 'B 9205 UPA';
          let parsedNotes = item.notes || 'Operasional Forklift';

          if (item.notes && item.notes.includes('||')) {
            const parts = item.notes.split('||');
            parts.forEach((p: string) => {
              const [k, v] = p.split(':').map((s: string) => s.trim());
              if (k === 'Rigger') parsedRigger = v;
              if (k === 'JamKembali') parsedReturn = v;
              if (k === 'NoKendaraan') parsedVehicle = v;
              if (k === 'Ket') parsedNotes = v;
            });
          }

          return {
            id: item.id,
            letter_number: item.letter_number,
            order_id: item.rental_order_id || 1,
            order_number: item.rental_order ? item.rental_order.order_number : `ORD-${item.id}`,
            customer_name: item.rental_order?.customer ? item.rental_order.customer.name : 'PT. Aluminium Ind.',
            customer_address: item.rental_order ? item.rental_order.project_location : 'Jakarta',
            unit_code: item.unit ? item.unit.unit_code : 'FL-05',
            brand: item.unit ? `${item.unit.brand} ${item.unit.model || ''}` : 'Komatsu FD50',
            capacity_ton: item.unit ? item.unit.capacity_ton : 5.0,
            fuel_type: item.unit ? item.unit.fuel_type : 'Diesel',
            vehicle_number: parsedVehicle,
            operator_name: item.operator ? item.operator.name : 'Romi Prasetyo',
            operator_sio: item.operator?.sio_number || 'SIO-K3-RESMI',
            rigger_name: parsedRigger,
            issue_date: item.issue_date,
            departure_time: item.departure_time || '08:30 WIB',
            return_time: parsedReturn,
            notes: parsedNotes,
            job_description: item.job_description || 'Bongkar muat material berat',
            operational_status: item.operational_status || 'ASSIGNED',
            recipient_name: item.recipient_name || 'PIC Penerima Klien',
            recipient_phone: item.rental_order?.location_pic_phone || '',
            approver_name: 'ABDUL GHOFUR',
          };
        });
        setLetters(mapped);
      }
    } catch (err) {
      console.log('Menggunakan data lokal surat jalan:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDropdownOptions = async () => {
    try {
      const [orderRes, unitRes, opRes] = await Promise.all([
        api.get('/orders').catch(() => null),
        api.get('/units').catch(() => null),
        api.get('/operators').catch(() => null),
      ]);

      if (orderRes?.data?.data) {
        setOrders(
          orderRes.data.data.map((o: any) => ({
            id: o.id,
            order_number: o.order_number,
            customer_name: o.customer ? o.customer.name : `Customer #${o.customer_id}`,
            project_location: o.project_location,
            location_pic_name: o.location_pic_name,
            location_pic_phone: o.location_pic_phone,
            unit_id: o.unit_id,
            required_capacity_ton: o.required_capacity_ton,
          }))
        );
      }

      if (unitRes?.data?.data) {
        setUnits(unitRes.data.data);
      }

      if (opRes?.data?.data) {
        setOperators(opRes.data.data);
      }
    } catch (err) {
      console.error('Gagal mengambil dropdown master:', err);
    }
  };

  useEffect(() => {
    loadDeliveryLetters();
    loadDropdownOptions();
  }, []);

  // ── Helper Order Selection ────────────────────────────────────
  const handleOrderChange = (orderIdStr: string) => {
    const selected = orders.find((o) => o.id === parseInt(orderIdStr));
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        rental_order_id: orderIdStr,
        customer_name: selected.customer_name,
        customer_address: selected.project_location,
        recipient_name: selected.location_pic_name || '',
        recipient_phone: selected.location_pic_phone || '',
        capacity_ton: selected.required_capacity_ton || 5.0,
        unit_id: selected.unit_id ? String(selected.unit_id) : prev.unit_id,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        rental_order_id: orderIdStr,
      }));
    }
  };

  // ── Helper Operator Selection ─────────────────────────────────
  const handleOperatorChange = (opIdStr: string) => {
    const op = operators.find((o) => o.id === parseInt(opIdStr));
    if (op) {
      setFormData((prev) => ({
        ...prev,
        operator_id: opIdStr,
        operator_name: op.name,
        operator_sio: op.sio_number || 'SIO-K3-RESMI',
      }));
    }
  };

  // ── Helper Unit Selection ─────────────────────────────────────
  const handleUnitChange = (unitIdStr: string) => {
    const u = units.find((item) => item.id === parseInt(unitIdStr));
    if (u) {
      setFormData((prev) => ({
        ...prev,
        unit_id: unitIdStr,
        unit_code: u.unit_code,
        capacity_ton: u.capacity_ton,
      }));
    }
  };

  // ── Submit Surat Jalan Baru ───────────────────────────────────
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.rental_order_id) {
      alert('Pilih Pesanan Sewa terlebih dahulu.');
      return;
    }
    if (!formData.unit_id) {
      alert('Pilih Unit Forklift yang dialokasikan.');
      return;
    }
    if (!formData.operator_id) {
      alert('Pilih Operator Forklift yang bertugas.');
      return;
    }

    const generatedNumber = `SJ-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(letters.length + 1).padStart(4, '0')}`;
    const structuredNotes = `Rigger: ${formData.rigger_name || '-'} || JamKembali: ${formData.return_time || '-'} || NoKendaraan: ${formData.vehicle_number || '-'} || Ket: ${formData.notes || '-'}`;

    try {
      const res = await api.post('/delivery-letters', {
        letter_number: generatedNumber,
        rental_order_id: parseInt(formData.rental_order_id),
        unit_id: parseInt(formData.unit_id),
        operator_id: parseInt(formData.operator_id),
        issue_date: formData.issue_date,
        departure_time: formData.departure_time || '',
        job_description: formData.job_description,
        recipient_name: formData.recipient_name,
        operational_status: 'ASSIGNED',
        notes: structuredNotes,
      });

      if (res.data?.success) {
        await loadDeliveryLetters();
        setIsCreateModalOpen(false);
        // Reset form ke kondisi awal kosong
        setFormData({
          rental_order_id: '',
          customer_name: '',
          customer_address: '',
          unit_id: '',
          unit_code: '',
          capacity_ton: 5.0,
          vehicle_number: '',
          operator_id: '',
          operator_name: '',
          operator_sio: '',
          rigger_name: '',
          issue_date: new Date().toISOString().split('T')[0],
          departure_time: '',
          return_time: '',
          notes: '1 Shift Operasional',
          job_description: 'Bongkar muat dan relokasi muatan di lokasi klien',
          recipient_name: '',
          recipient_phone: '',
          approver_name: 'ABDUL GHOFUR',
        });
        alert(`Surat Jalan ${generatedNumber} berhasil disimpan ke database!`);
        return;
      }
    } catch (err: any) {
      console.error('Gagal menyimpan ke database:', err);
      const errMsg = err?.response?.data?.message || err?.message || 'Gagal menyimpan ke database.';
      alert(`Peringatan: ${errMsg}`);
    }
  };

  // ── Update Data Lapangan (Rigger, Jam Kembali, Keterangan) ───
  const handleOpenEdit = (rec: AdminDeliveryRecord) => {
    setSelectedRecord(rec);
    setEditFormData({
      rigger_name: rec.rigger_name,
      return_time: rec.return_time,
      departure_time: rec.departure_time,
      vehicle_number: rec.vehicle_number,
      notes: rec.notes,
      approver_name: rec.approver_name,
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (!selectedRecord) return;
    setLetters((prev) =>
      prev.map((item) =>
        item.id === selectedRecord.id ? { ...item, ...editFormData } : item
      )
    );
    setIsEditModalOpen(false);
  };

  // ── Update Alur Status Operasional ───────────────────────────
  const handleUpdateStatus = (id: number, nextStatus: OperationalStatus) => {
    setLetters((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, operational_status: nextStatus };
          if (nextStatus === 'FINISHED' && (item.return_time === '-' || !item.return_time)) {
            const now = new Date();
            updated.return_time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;
          }
          return updated;
        }
        return item;
      })
    );

    api.patch(`/delivery-letters/${id}/operational-status`, {
      status: nextStatus,
      notes: `Status diupdate ke ${nextStatus} oleh Admin Staff`,
    }).catch((err) => console.log('Update tersimpan lokal:', err));
  };

  // ── Print Action ──────────────────────────────────────────────
  const handleTriggerPrint = (rec: AdminDeliveryRecord) => {
    setPrintDocument(rec);
    setTimeout(() => {
      window.print();
    }, 250);
  };

  // ── Filter & Search Logic ─────────────────────────────────────
  const filteredLetters = letters.filter((item) => {
    const matchSearch =
      item.letter_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.operator_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.rigger_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.unit_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterStatus === 'ALL') return matchSearch;
    return matchSearch && item.operational_status === filterStatus;
  });

  return (
    <div className="page-body">
      {/* ── HEADER HALAMAN ADMIN ──────────────────────────────────── */}
      <div className="content-card no-print" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                background: '#eff6ff', color: '#1d4ed8', padding: '4px 10px',
                borderRadius: '6px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px'
              }}>
                ROLE: ADMIN STAFF
              </span>
              <span style={{ fontSize: '12px', color: '#64748b' }}>• Manajemen Dokumen Lapangan</span>
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: '6px 0 2px' }}>
              Kelola Dokumen Surat Jalan
            </h1>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
              Penerbitan surat jalan resmi, alokasi operator & rigger, nomor kendaraan pengangkut, serta cetak fisik standar PT. AMT
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn-secondary"
              onClick={loadDeliveryLetters}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Refresh Data"
            >
              <RefreshCw size={15} /> Refresh
            </button>
            <button
              className="btn-primary"
              onClick={() => setIsCreateModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={16} /> + Terbitkan Surat Jalan Baru
            </button>
          </div>
        </div>

        {/* ── STATS RINGKAS ────────────────────────────────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid #f1f5f9'
        }}>
          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Total Surat Jalan Terbit</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
              {letters.length} <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>Dokumen</span>
            </div>
          </div>

          <div style={{ background: '#fef2f2', padding: '14px', borderRadius: '10px', border: '1px solid #fee2e2' }}>
            <div style={{ fontSize: '12px', color: '#991b1b', fontWeight: 600 }}>Sedang Bekerja di Lokasi</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#b91c1c', marginTop: '4px' }}>
              {letters.filter((l) => l.operational_status === 'WORKING').length} <span style={{ fontSize: '13px', fontWeight: 500, color: '#991b1b' }}>Unit</span>
            </div>
          </div>

          <div style={{ background: '#fefce8', padding: '14px', borderRadius: '10px', border: '1px solid #fef08a' }}>
            <div style={{ fontSize: '12px', color: '#854d0e', fontWeight: 600 }}>Menuju Lokasi Proyek (OTW)</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#a16207', marginTop: '4px' }}>
              {letters.filter((l) => l.operational_status === 'ON_THE_WAY').length} <span style={{ fontSize: '13px', fontWeight: 500, color: '#854d0e' }}>Unit</span>
            </div>
          </div>

          <div style={{ background: '#f0fdf4', padding: '14px', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
            <div style={{ fontSize: '12px', color: '#166534', fontWeight: 600 }}>Operasional Selesai</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#15803d', marginTop: '4px' }}>
              {letters.filter((l) => l.operational_status === 'FINISHED').length} <span style={{ fontSize: '13px', fontWeight: 500, color: '#166534' }}>Selesai</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── TOOLBAR FILTER & SEARCH ───────────────────────────────── */}
      <div className="content-card no-print" style={{ marginBottom: '16px', padding: '14px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '280px' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Cari No. SJ, Customer, Operator, Rigger, No Kendaraan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-control"
                style={{ paddingLeft: '36px', fontSize: '13px' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
            {[
              { id: 'ALL', label: 'Semua Status' },
              { id: 'ASSIGNED', label: '1. Unit Diambil' },
              { id: 'ON_THE_WAY', label: '2. Menuju Lokasi' },
              { id: 'WORKING', label: '3. Sedang Bekerja' },
              { id: 'FINISHED', label: '4. Selesai' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: filterStatus === tab.id ? '1px solid #2563eb' : '1px solid #e2e8f0',
                  background: filterStatus === tab.id ? '#eff6ff' : '#fff',
                  color: filterStatus === tab.id ? '#1d4ed8' : '#64748b',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── TABEL SURAT JALAN ADMIN ───────────────────────────────── */}
      <div className="content-card no-print">
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>No. Surat Jalan</th>
                <th>Tanggal & Jam</th>
                <th>Customer & Lokasi</th>
                <th>Unit & No. Kendaraan</th>
                <th>Operator & Rigger</th>
                <th>Kembali & Ket</th>
                <th>Siklus Operasional</th>
                <th style={{ textAlign: 'center' }}>Aksi Admin</th>
              </tr>
            </thead>
            <tbody>
              {filteredLetters.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                    Tidak ada dokumen Surat Jalan yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredLetters.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#2563eb', fontSize: '13px' }}>{row.letter_number}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Ref: {row.order_number}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{row.issue_date}</div>
                      <div style={{ fontSize: '11px', color: '#059669', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Clock size={11} /> Berangkat: {row.departure_time}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{row.customer_name}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {row.customer_address}
                      </div>
                      <div style={{ fontSize: '11px', color: '#0284c7' }}>PIC: {row.recipient_name}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>
                        {row.unit_code} ({row.capacity_ton}T)
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{row.brand}</div>
                      <div style={{
                        marginTop: '3px',
                        display: 'inline-block',
                        padding: '1px 6px',
                        background: '#f1f5f9',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#334155'
                      }}>
                        🚗 No Pol: {row.vehicle_number || '-'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{row.operator_name}</div>
                      <div style={{ fontSize: '11px', color: '#16a34a' }}>SIO: {row.operator_sio}</div>
                      <div style={{ fontSize: '11px', color: '#b45309', fontWeight: 600, marginTop: '2px' }}>
                        👷 Rigger: {row.rigger_name || '-'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: row.return_time !== '-' ? '#166534' : '#64748b' }}>
                        Kembali: {row.return_time || '-'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#475569', fontStyle: 'italic', maxWidth: '160px' }}>
                        Ket: {row.notes || '-'}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {row.operational_status === 'ASSIGNED' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className="badge badge-assigned">1. UNIT DIAMBIL OPERATOR</span>
                            <button
                              className="btn-secondary"
                              style={{ padding: '3px 8px', fontSize: '11px' }}
                              onClick={() => handleUpdateStatus(row.id, 'ON_THE_WAY')}
                              title="Tandai unit sudah keluar & berangkat"
                            >
                              Jalan ➔
                            </button>
                          </div>
                        )}

                        {row.operational_status === 'ON_THE_WAY' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className="badge badge-on-the-way">2. MENUJU LOKASI</span>
                            <button
                              className="btn-primary"
                              style={{ padding: '3px 8px', fontSize: '11px', background: '#991b1b' }}
                              onClick={() => handleUpdateStatus(row.id, 'WORKING')}
                              title="Tandai unit sudah tiba dan mulai kerja"
                            >
                              Kerja ▶
                            </button>
                          </div>
                        )}

                        {row.operational_status === 'WORKING' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className="badge badge-working">3. SEDANG BEKERJA</span>
                            <button
                              className="btn-secondary"
                              style={{ padding: '3px 8px', fontSize: '11px', background: '#15803d', color: '#fff', border: 'none' }}
                              onClick={() => handleUpdateStatus(row.id, 'FINISHED')}
                              title="Tandai pekerjaan selesai dan unit kembali"
                            >
                              Selesai ✓
                            </button>
                          </div>
                        )}

                        {row.operational_status === 'FINISHED' && (
                          <span className="badge badge-ready">✓ SELESAI (UNIT READY)</span>
                        )}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button
                          className="btn-primary"
                          style={{
                            padding: '6px 10px',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: '#1d4ed8',
                          }}
                          onClick={() => handleTriggerPrint(row)}
                          title="Cetak Surat Jalan Resmi PT. AMT"
                        >
                          <Printer size={14} /> Cetak SJ
                        </button>
                        <button
                          className="btn-secondary"
                          style={{ padding: '6px 8px', fontSize: '12px' }}
                          onClick={() => handleOpenEdit(row)}
                          title="Lengkapi / Edit Rigger, Jam Kembali, Keterangan"
                        >
                          <Edit3 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL: BUAT SURAT JALAN BARU (ADMIN) ──────────────────── */}
      {isCreateModalOpen && (
        <div className="modal-overlay no-print">
          <div className="modal-content" style={{ maxWidth: '750px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  Terbitkan Surat Jalan Baru
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#64748b' }}>
                  Alokasikan pesanan sewa pelanggan dengan unit, operator, rigger, dan kendaraan pengangkut
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              {/* Baris 1: Pilih Pesanan Sewa */}
              <div className="form-group">
                <label>Pilih Pesanan Sewa (PO Ref) *</label>
                <select
                  required
                  className="form-control"
                  value={formData.rental_order_id}
                  onChange={(e) => handleOrderChange(e.target.value)}
                >
                  <option value="">-- Pilih Pesanan Sewa Aktif --</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.order_number} - {o.customer_name} ({o.required_capacity_ton}T) - {o.project_location}
                    </option>
                  ))}
                  {/* Fallback jika list orders kosong */}
                  {orders.length === 0 && (
                    <>
                      <option value="1">ORD-202609-0001 - PT. Aluminium Ind. (5T)</option>
                      <option value="2">ORD-202609-0002 - PT. Mega Baja Mandiri (7T)</option>
                      <option value="3">ORD-202609-0003 - CV. Berkah Logistik (3T)</option>
                    </>
                  )}
                </select>
              </div>

              {/* Baris 2: Nama Customer & Alamat */}
              <div className="form-row">
                <div className="form-group">
                  <label>Nama Customer / Perusahaan *</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="Contoh: PT. Aluminium Ind."
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Alamat Proyek / Pengiriman *</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="Contoh: Tipar Cakung, Jakarta Timur"
                    value={formData.customer_address}
                    onChange={(e) => setFormData({ ...formData, customer_address: e.target.value })}
                  />
                </div>
              </div>

              {/* Baris 3: Unit Forklift & Nomor Kendaraan Pengangkut */}
              <div className="form-row">
                <div className="form-group">
                  <label>Unit Alat Berat / Forklift *</label>
                  <select
                    required
                    className="form-control"
                    value={formData.unit_id}
                    onChange={(e) => handleUnitChange(e.target.value)}
                  >
                    <option value="">-- Pilih Unit Tersedia --</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.unit_code} - {u.brand} ({u.capacity_ton} Ton - {u.fuel_type})
                      </option>
                    ))}
                    {units.length === 0 && (
                      <>
                        <option value="1">FL-01 - Toyota 3 Ton (Diesel)</option>
                        <option value="2">FL-02 - Komatsu 5 Ton (Diesel)</option>
                        <option value="3">FL-03 - Mitsubishi 7 Ton (Diesel)</option>
                        <option value="4">FL-05 - Komatsu 5 Ton (Diesel)</option>
                      </>
                    )}
                  </select>
                </div>
                <div className="form-group">
                  <label>Nomor Kendaraan / Pengangkut (Towing) *</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="Contoh: B 9205 UPA"
                    value={formData.vehicle_number}
                    onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
                  />
                </div>
              </div>

              {/* Baris 4: Operator & Reger / Rigger */}
              <div className="form-row">
                <div className="form-group">
                  <label>Operator Forklift (SIO) *</label>
                  <select
                    required
                    className="form-control"
                    value={formData.operator_id}
                    onChange={(e) => handleOperatorChange(e.target.value)}
                  >
                    <option value="">-- Pilih Operator Bertugas --</option>
                    {operators.map((op) => (
                      <option key={op.id} value={op.id}>
                        {op.name} ({op.sio_number || 'SIO Resmi'})
                      </option>
                    ))}
                    {operators.length === 0 && (
                      <>
                        <option value="1">Romi Prasetyo (SIO-K3-089)</option>
                        <option value="2">Agus Prasetyo (SIO-K3-0091)</option>
                        <option value="3">Doni Kurniawan (SIO-K3-0145)</option>
                      </>
                    )}
                  </select>
                </div>
                <div className="form-group">
                  <label>Reger / Rigger Lapangan</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Contoh: Dedi Sutrisno / Romi"
                    value={formData.rigger_name}
                    onChange={(e) => setFormData({ ...formData, rigger_name: e.target.value })}
                  />
                </div>
              </div>

              {/* Baris 5: Tanggal, Jam Berangkat & Jam Kembali */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label>Tanggal Terbit *</label>
                  <input
                    type="date"
                    required
                    className="form-control"
                    value={formData.issue_date}
                    onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Jam Berangkat (Opsional)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Contoh: 09:00 WIB (Bisa dikosongkan)"
                    value={formData.departure_time}
                    onChange={(e) => setFormData({ ...formData, departure_time: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Jam Kembali (Opsional)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Contoh: 15:00 WIB (Bisa dikosongkan)"
                    value={formData.return_time}
                    onChange={(e) => setFormData({ ...formData, return_time: e.target.value })}
                  />
                </div>
              </div>

              {/* Baris 6: Keterangan & PIC */}
              <div className="form-row">
                <div className="form-group">
                  <label>Ket (Keterangan Pekerjaan)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Contoh: 1 Shift / Normal / Bongkar Muatan"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>PIC Lapangan (Penerima Klien)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Nama PIC Penerima di Lokasi"
                    value={formData.recipient_name}
                    onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ background: '#1d4ed8' }}
                >
                  ✓ Terbitkan Surat Jalan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: EDIT DATA LAPANGAN (RIGGER, JAM KEMBALI, KETERANGAN) ── */}
      {isEditModalOpen && selectedRecord && (
        <div className="modal-overlay no-print">
          <div className="modal-content" style={{ maxWidth: '550px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                  Lengkapi Data Lapangan Surat Jalan
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                  {selectedRecord.letter_number} - {selectedRecord.customer_name}
                </p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Nomor Kendaraan / Pengangkut</label>
                <input
                  type="text"
                  className="form-control"
                  value={editFormData.vehicle_number || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, vehicle_number: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Reger / Rigger</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Nama Rigger yang bertugas"
                  value={editFormData.rigger_name || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, rigger_name: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Jam Berangkat</label>
                <input
                  type="text"
                  className="form-control"
                  value={editFormData.departure_time || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, departure_time: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Jam Kembali</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Contoh: 15:00 WIB"
                  value={editFormData.return_time || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, return_time: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Ket (Keterangan)</label>
              <textarea
                rows={2}
                className="form-control"
                placeholder="Contoh: 1 Shift / Pekerjaan selesai lancar"
                value={editFormData.notes || ''}
                onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Nama Penanggung Jawab / Pimpinan</label>
              <input
                type="text"
                className="form-control"
                value={editFormData.approver_name || 'ABDUL GHOFUR'}
                onChange={(e) => setEditFormData({ ...editFormData, approver_name: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <button
                className="btn-secondary"
                onClick={() => setIsEditModalOpen(false)}
              >
                Batal
              </button>
              <button
                className="btn-primary"
                onClick={handleSaveEdit}
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── AREA CETAK RESMI SURAT JALAN (SESUAI DOKUMEN FISIK PT. AMT) ── */}
      {printDocument && (
        <div className="print-area">
          <div className="surat-jalan-document" style={{
            background: '#ffffff',
            padding: '24px 30px',
            color: '#000000',
            fontFamily: "'Segoe UI', Arial, Helvetica, sans-serif",
            fontSize: '13px',
            lineHeight: 1.4,
            maxWidth: '900px',
            margin: '0 auto',
            border: '2px solid #000'
          }}>
            {/* ── KOP SURAT RESMI PT. ANUGRAH MAHA TUNGGAL ── */}
            <div style={{ textAlign: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', marginBottom: '6px' }}>
                {/* Logo Bintang Merah AMT */}
                <div style={{ flexShrink: 0 }}>
                  <svg viewBox="0 0 120 120" width="75" height="75">
                    {/* Bintang Merah dengan outline kuning */}
                    <polygon
                      points="60,5 73,42 112,42 80,65 90,103 60,80 30,103 40,65 8,42 47,42"
                      fill="#FF0000"
                      stroke="#FFD700"
                      strokeWidth="3"
                    />
                    {/* Tulisan AMT Kuning Miring */}
                    <text
                      x="60" y="67"
                      textAnchor="middle"
                      fill="#FFD700"
                      fontWeight="900"
                      fontStyle="italic"
                      fontFamily="'Brush Script MT', cursive, sans-serif"
                      fontSize="24"
                    >AMT</text>
                  </svg>
                </div>

                {/* Teks Kop Perusahaan */}
                <div style={{ textAlign: 'center' }}>
                  <h1 style={{
                    fontSize: '26px',
                    fontWeight: 900,
                    color: '#D80000',
                    margin: 0,
                    letterSpacing: '1.2px',
                    fontFamily: 'Arial, sans-serif'
                  }}>
                    PT. ANUGRAH MAHA TUNGGAL
                  </h1>
                  <p style={{ margin: '4px 0', fontSize: '14px', fontStyle: 'italic', fontWeight: 600, color: '#000' }}>
                    Jual Beli, Menyewakan Forklift, Crane, dan Hiyap Crane
                  </p>
                  <p style={{ margin: '2px 0', fontSize: '11px', color: '#000' }}>
                    Office : Jl. Logistik No. 56 Pegangsaan Dua Jakarta Utara
                  </p>
                  <p style={{ margin: '2px 0', fontSize: '11px', color: '#000' }}>
                    Workshop : Jl. Rawa Indah No. 15 Kelapa Gading Jakarta Utara
                  </p>
                  <p style={{ margin: '2px 0', fontSize: '11px', color: '#000' }}>
                    Email : <span style={{ textDecoration: 'underline' }}>ptamtforklift@gmail.com</span> | Tlp : (0813-1665-4476 / 0821-1400-0516)
                  </p>
                </div>
              </div>

              {/* Garis Ganda Kop Surat (1 Garis Tebal, 1 Garis Tipis) */}
              <div style={{ borderBottom: '3px solid #000', marginTop: '6px' }}></div>
              <div style={{ borderBottom: '1px solid #000', marginTop: '2px', marginBottom: '14px' }}></div>
            </div>

            {/* ── JUDUL DOKUMEN: SURAT JALAN ── */}
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: 900,
                textDecoration: 'underline',
                margin: 0,
                letterSpacing: '1px'
              }}>
                SURAT JALAN
              </h2>
              <div style={{ fontSize: '12px', fontWeight: 700, marginTop: '2px' }}>
                No: {printDocument.letter_number}
              </div>
            </div>

            {/* ── DATA HEADER SURAT JALAN (SEBELAH KIRI SESUAI PERMINTAAN USER) ── */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-start',
              marginBottom: '16px'
            }}>
              <table style={{ borderCollapse: 'collapse', fontSize: '12px', minWidth: '450px', textAlign: 'left' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '160px', padding: '3px 0', fontWeight: 700 }}>Nama Customer</td>
                    <td style={{ width: '15px', padding: '3px 0' }}>:</td>
                    <td style={{ padding: '3px 0', fontWeight: 600 }}>{printDocument.customer_name}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '3px 0', fontWeight: 700 }}>Alat dan Kapasitas</td>
                    <td style={{ padding: '3px 0' }}>:</td>
                    <td style={{ padding: '3px 0', fontWeight: 600 }}>
                      Forklift {printDocument.capacity_ton} Ton ({printDocument.brand})
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '3px 0', fontWeight: 700 }}>Nomor Kendaraan</td>
                    <td style={{ padding: '3px 0' }}>:</td>
                    <td style={{ padding: '3px 0', fontWeight: 600 }}>
                      {printDocument.vehicle_number || '-'}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '3px 0', fontWeight: 700 }}>Alamat</td>
                    <td style={{ padding: '3px 0' }}>:</td>
                    <td style={{ padding: '3px 0' }}>{printDocument.customer_address}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '3px 0', fontWeight: 700 }}>PIC</td>
                    <td style={{ padding: '3px 0' }}>:</td>
                    <td style={{ padding: '3px 0' }}>
                      {printDocument.recipient_name} {printDocument.recipient_phone ? `(${printDocument.recipient_phone})` : ''}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ── TABEL UTAMA SURAT JALAN (8 KOLOM SESUAI GAMBAR FISIK) ── */}
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              border: '1.5px solid #000',
              fontSize: '12px',
              marginBottom: '20px'
            }}>
              <thead>
                <tr style={{ background: '#f8fafc', textAlign: 'center' }}>
                  <th style={{ border: '1px solid #000', padding: '8px 4px', width: '10%' }}>Tanggal</th>
                  <th style={{ border: '1px solid #000', padding: '8px 4px', width: '11%' }}>Jam Berangkat</th>
                  <th style={{ border: '1px solid #000', padding: '8px 6px', width: '18%' }}>Alat Yang Dikirim</th>
                  <th style={{ border: '1px solid #000', padding: '8px 6px', width: '13%' }}>Operator</th>
                  <th style={{ border: '1px solid #000', padding: '8px 6px', width: '13%' }}>Reger / Rigger</th>
                  <th style={{ border: '1px solid #000', padding: '8px 4px', width: '11%' }}>Jam Kembali</th>
                  <th style={{ border: '1px solid #000', padding: '8px 6px', width: '12%' }}>Ket</th>
                  <th style={{ border: '1px solid #000', padding: '8px 6px', width: '12%' }}>Tanda Tangan Customer</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ minHeight: '80px', verticalAlign: 'top' }}>
                  {/* 1. Tanggal */}
                  <td style={{ border: '1px solid #000', padding: '12px 6px', textAlign: 'center', fontWeight: 600 }}>
                    {printDocument.issue_date}
                  </td>
                  {/* 2. Jam Berangkat */}
                  <td style={{ border: '1px solid #000', padding: '12px 6px', textAlign: 'center', fontWeight: 600 }}>
                    {printDocument.departure_time}
                  </td>
                  {/* 3. Alat Yang Dikirim */}
                  <td style={{ border: '1px solid #000', padding: '12px 8px' }}>
                    <div style={{ fontWeight: 700 }}>Forklift {printDocument.capacity_ton}T</div>
                    <div style={{ fontSize: '11px', color: '#333' }}>{printDocument.brand}</div>
                    <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>Kode: {printDocument.unit_code}</div>
                  </td>
                  {/* 4. Operator */}
                  <td style={{ border: '1px solid #000', padding: '12px 8px' }}>
                    <div style={{ fontWeight: 700 }}>{printDocument.operator_name}</div>
                    <div style={{ fontSize: '10px', color: '#555' }}>{printDocument.operator_sio}</div>
                  </td>
                  {/* 5. Reger / Rigger */}
                  <td style={{ border: '1px solid #000', padding: '12px 8px', fontWeight: 600 }}>
                    {printDocument.rigger_name || '-'}
                  </td>
                  {/* 6. Jam Kembali */}
                  <td style={{ border: '1px solid #000', padding: '12px 6px', textAlign: 'center', fontWeight: 600 }}>
                    {printDocument.return_time || '-'}
                  </td>
                  {/* 7. Ket (Keterangan) */}
                  <td style={{ border: '1px solid #000', padding: '12px 8px', fontSize: '11px' }}>
                    {printDocument.notes || '-'}
                  </td>
                  {/* 8. Tanda Tangan Customer */}
                  <td style={{
                    border: '1px solid #000',
                    padding: '8px',
                    textAlign: 'center',
                    height: '80px',
                    position: 'relative'
                  }}>
                    <div style={{ fontSize: '10px', color: '#888', marginBottom: '35px' }}>Cap & Tanda Tangan</div>
                    <div style={{ borderTop: '1px dotted #888', paddingTop: '2px', fontSize: '10px' }}>( Penerima )</div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* ── AREA BAWAH TABEL: NOTE PERINGATAN (KIRI) SEJEJER DENGAN TANDA TANGAN (KANAN) ── */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginTop: '16px',
              padding: '0 8px',
              gap: '24px'
            }}>
              {/* Sisi Kiri: Note Peringatan Warna Merah Sejejer dengan Tanda Tangan */}
              <div style={{
                flex: 1,
                maxWidth: '460px',
                color: '#d00000',
                fontSize: '11px',
                fontStyle: 'italic',
                fontWeight: 600,
                lineHeight: 1.45,
                padding: '8px 12px',
                borderLeft: '3px solid #d00000',
                background: '#fff5f5'
              }}>
                <div style={{ fontWeight: 800, marginBottom: '2px', textDecoration: 'underline' }}>Note :</div>
                Untuk setiap Kegiatan yang Dilakukan oleh Alat ini sebaiknya dilakukan Pengawasan dalam melakukan Pekerjaan. Setiap kerusakan atas barang dalam Penggunaan alat ini Adalah Tanggung Jawab Penyewa Alat.
              </div>

              {/* Sisi Kanan: Jakarta, [Tanggal] & Pimpinan (ABDUL GHOFUR) */}
              <div style={{ textAlign: 'center', minWidth: '220px' }}>
                <div style={{ fontSize: '12px' }}>
                  Jakarta, {new Date(printDocument.issue_date).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </div>
                <div style={{ marginTop: '4px', fontSize: '11px', color: '#555' }}>
                  Hormat kami,
                </div>
                {/* Ruang Tanda Tangan */}
                <div style={{ height: '55px' }}></div>
                <div style={{
                  fontWeight: 900,
                  fontSize: '13px',
                  textDecoration: 'underline'
                }}>
                  ( {printDocument.approver_name || 'ABDUL GHOFUR'} )
                </div>
                <div style={{ fontSize: '11px', color: '#222', fontWeight: 600, marginTop: '2px' }}>
                  PT. ANUGRAH MAHA TUNGGAL
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuratJalanAdmin;
