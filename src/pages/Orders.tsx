import React, { useState, useEffect } from 'react';
import { Plus, Search, FileText, CheckCircle, Clock } from 'lucide-react';
import { api } from '../services/api';

// Helper: format angka ke format desimal Indonesia (1500000 → 1.500.000)
const formatRupiah = (value: number): string => {
  return value.toLocaleString('id-ID');
};

// Helper: parse string format desimal kembali ke number (1.500.000 → 1500000)
const parseRupiah = (value: string): number => {
  return Number(value.replace(/\./g, '').replace(/[^0-9]/g, '')) || 0;
};

interface CustomerOption {
  id: number;
  name: string;
}

interface UnitOption {
  id: number;
  unit_code: string;
  brand: string;
  capacity_ton: number;
  status: string;
}

export const Orders: React.FC = () => {
  const [orders, setOrders] = useState([
    {
      id: 1,
      order_number: 'ORD-202609-0001',
      customer_name: 'PT. Pelabuhan Samudera Raya',
      order_date: '2026-09-24',
      start_date: '2026-09-24',
      end_date: '2026-09-26',
      rental_duration_type: 'HARI',
      duration_value: 3,
      project_location: 'Kawasan Industri Cilegon Kav 12, Area Dermaga 3',
      required_capacity_ton: 5.0,
      unit_code: 'FL-02 (5.0 Ton)',
      agreed_price: 5400000,
      status: 'ACTIVE',
      po_reference: 'PO-PSR/IX/2026/88'
    },
    {
      id: 2,
      order_number: 'ORD-202609-0002',
      customer_name: 'PT. Mega Baja Mandiri',
      order_date: '2026-09-24',
      start_date: '2026-09-25',
      end_date: '2026-09-25',
      rental_duration_type: 'HARI',
      duration_value: 1,
      project_location: 'Jl. Raya Narogong Km 14, Bekasi',
      required_capacity_ton: 7.0,
      unit_code: 'FL-03 (7.0 Ton)',
      agreed_price: 2500000,
      status: 'ACTIVE',
      po_reference: 'PO-MBM-2026-44'
    },
    {
      id: 3,
      order_number: 'ORD-202609-0003',
      customer_name: 'CV. Makmur Jaya Abadi',
      order_date: '2026-09-24',
      start_date: '2026-09-27',
      end_date: '2026-09-28',
      rental_duration_type: 'HARI',
      duration_value: 2,
      project_location: 'Jl. Industri Pergudangan No. 45, Tangerang',
      required_capacity_ton: 3.0,
      unit_code: 'FL-01 (3.0 Ton)',
      agreed_price: 2400000,
      status: 'PENDING',
      po_reference: 'Via Telepon (Pak Joko)'
    }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [priceDisplay, setPriceDisplay] = useState('1.500.000');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getDefaultFormData = () => ({
    customer_id: 0,
    po_reference: '',
    rental_duration_type: 'HARI',
    duration_value: 1,
    start_date: new Date().toISOString().split('T')[0],
    required_capacity_ton: 3.0,
    unit_id: 0,
    project_location: '',
    location_pic_name: '',
    location_pic_phone: '',
    agreed_price: 1500000,
  });

  const [formData, setFormData] = useState(getDefaultFormData());

  // Ambil data customers dari backend
  useEffect(() => {
    api.get('/customers')
      .then((res) => {
        if (res.data.success && res.data.data) {
          const mapped = res.data.data.map((c: any) => ({ id: c.id, name: c.name }));
          setCustomers(mapped);
          if (mapped.length > 0) {
            setFormData(prev => ({ ...prev, customer_id: mapped[0].id }));
          }
        }
      })
      .catch(() => {});
  }, []);

  // Ambil data units dari backend
  useEffect(() => {
    api.get('/units')
      .then((res) => {
        if (res.data.success && res.data.data) {
          const mapped = res.data.data.map((u: any) => ({
            id: u.id,
            unit_code: u.unit_code,
            brand: u.brand,
            capacity_ton: u.capacity_ton,
            status: u.status,
          }));
          setUnits(mapped);
          const available = mapped.filter((u: UnitOption) => u.status === 'AVAILABLE');
          if (available.length > 0) {
            setFormData(prev => ({ ...prev, unit_id: available[0].id, required_capacity_ton: available[0].capacity_ton }));
          }
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    // Ambil data order langsung dari backend Golang
    api.get('/orders')
      .then((res) => {
        if (res.data.success && res.data.data && res.data.data.length > 0) {
          const mapped = res.data.data.map((item: any) => ({
            id: item.id,
            order_number: item.order_number,
            customer_name: item.customer ? item.customer.name : 'PT. Pelabuhan Samudera Raya',
            order_date: item.order_date,
            start_date: item.start_date,
            end_date: item.end_date || item.start_date,
            rental_duration_type: item.rental_duration_type,
            duration_value: item.duration_value,
            project_location: item.project_location,
            required_capacity_ton: item.required_capacity_ton,
            unit_code: item.unit ? `${item.unit.unit_code} (${item.unit.capacity_ton}T)` : 'FL-01',
            agreed_price: item.agreed_price,
            status: item.status,
            po_reference: item.po_reference || '-'
          }));
          setOrders(mapped);
        }
      })
      .catch((err) => {
        console.log('Backend sync offline fallback:', err);
      });
  }, []);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setIsSubmitting(true);

    // Cari nama customer berdasarkan ID
    const selectedCustomer = customers.find(c => c.id === formData.customer_id);
    const selectedUnit = units.find(u => u.id === formData.unit_id);

    try {
      const res = await api.post('/orders', {
        customer_id: Number(formData.customer_id),
        order_date: new Date().toISOString().split('T')[0],
        start_date: formData.start_date,
        rental_duration_type: formData.rental_duration_type,
        duration_value: Number(formData.duration_value),
        project_location: formData.project_location || 'Area Proyek Klien',
        location_pic_name: formData.location_pic_name,
        location_pic_phone: formData.location_pic_phone,
        required_capacity_ton: Number(formData.required_capacity_ton),
        unit_id: Number(formData.unit_id),
        agreed_price: Number(formData.agreed_price),
        po_reference: formData.po_reference || 'Pesanan Telepon/Online'
      });

      if (res.data.success) {
        // Order berhasil disimpan — tambahkan ke tabel lokal dari respons server
        const item = res.data.data;
        const newOrder = {
          id: item.id,
          order_number: item.order_number,
          customer_name: selectedCustomer?.name || 'Customer',
          order_date: item.order_date,
          start_date: item.start_date,
          end_date: item.end_date || item.start_date,
          rental_duration_type: item.rental_duration_type,
          duration_value: item.duration_value,
          project_location: item.project_location,
          required_capacity_ton: item.required_capacity_ton,
          unit_code: selectedUnit ? `${selectedUnit.unit_code} (${selectedUnit.capacity_ton} Ton)` : 'FL-01',
          agreed_price: item.agreed_price,
          status: item.status,
          po_reference: item.po_reference || '-'
        };
        setOrders([newOrder, ...orders]);
        setShowModal(false);
        setFormData(getDefaultFormData());
        setPriceDisplay('1.500.000');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || 'Gagal menyimpan pesanan. Periksa koneksi ke server.';
      setSubmitError(msg);
      console.error('Error creating order:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler perubahan input harga dengan format desimal otomatis
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\./g, '').replace(/[^0-9]/g, '');
    const num = Number(raw) || 0;
    setPriceDisplay(formatRupiah(num));
    setFormData({ ...formData, agreed_price: num });
  };

  // Handler ketika modal dibuka — reset state
  const openModal = () => {
    setSubmitError('');
    setPriceDisplay(formatRupiah(formData.agreed_price));
    setShowModal(true);
  };

  return (
    <div className="page-body">
      <div className="content-card">
        <div className="card-header-row">
          <div>
            <h2 className="card-title">Daftar Pesanan Sewa (Rental Orders)</h2>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
              Pencatatan pesanan dari customer (Telepon / Formulir PO) oleh Staff Administrasi
            </p>
          </div>
          <button className="btn-primary" onClick={openModal}>
            <Plus size={18} />
            Input Pesanan Baru
          </button>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>No. Pesanan</th>
                <th>Tanggal</th>
                <th>Customer / Referensi PO</th>
                <th>Durasi Sewa</th>
                <th>Kapasitas & Unit</th>
                <th>Lokasi Proyek</th>
                <th>Total Nilai</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td style={{ fontWeight: 700, color: '#2563eb' }}>{order.order_number}</td>
                  <td>{order.start_date}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{order.customer_name}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Ref: {order.po_reference}</div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{order.duration_value} {order.rental_duration_type}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{order.required_capacity_ton} Ton</div>
                    <div style={{ fontSize: '11px', color: '#475569' }}>{order.unit_code}</div>
                  </td>
                  <td style={{ maxWidth: '240px', fontSize: '12px' }}>
                    {order.project_location}
                  </td>
                  <td style={{ fontWeight: 700, color: '#0f172a' }}>
                    Rp {order.agreed_price.toLocaleString('id-ID')}
                  </td>
                  <td>
                    {order.status === 'ACTIVE' && (
                      <span className="badge badge-working">
                        AKTIF / BERJALAN
                      </span>
                    )}
                    {order.status === 'PENDING' && (
                      <span className="badge badge-assigned">
                        MENUNGGU SJ
                      </span>
                    )}
                    {order.status === 'COMPLETED' && (
                      <span className="badge badge-ready">
                        SELESAI
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Input Pesanan (Form Input Pesanan Sesuai Diagram Alur) */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
              Form Input Pesanan Sewa Baru
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
              Input data pesanan yang diterima dari customer via telepon atau dokumen PO
            </p>

            {submitError && (
              <div style={{
                background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b',
                padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px',
              }}>
                ⚠️ {submitError}
              </div>
            )}

            <form onSubmit={handleCreateOrder}>
              <div className="form-group">
                <label>Nama Customer / Perusahaan</label>
                <select 
                  className="form-control"
                  value={formData.customer_id}
                  onChange={(e) => {
                    setFormData({ ...formData, customer_id: Number(e.target.value) });
                  }}
                  required
                >
                  {customers.length === 0 && (
                    <option value={0} disabled>Memuat data customer...</option>
                  )}
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Nomor Referensi PO / Kontak</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Contoh: PO-PSR/09/2026 atau Telepon"
                    value={formData.po_reference}
                    onChange={(e) => setFormData({ ...formData, po_reference: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Tanggal Mulai Kerja</label>
                  <input 
                    type="date" 
                    className="form-control"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Jenis Durasi</label>
                  <select 
                    className="form-control"
                    value={formData.rental_duration_type}
                    onChange={(e) => setFormData({ ...formData, rental_duration_type: e.target.value })}
                  >
                    <option value="JAM">Jam (Shift)</option>
                    <option value="HARI">Harian</option>
                    <option value="BULAN">Bulanan</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Lama Durasi</label>
                  <input 
                    type="number" 
                    min={1} 
                    className="form-control"
                    value={formData.duration_value}
                    onChange={(e) => setFormData({ ...formData, duration_value: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Kapasitas Berat Forklift (Ton)</label>
                  <select 
                    className="form-control"
                    value={formData.required_capacity_ton}
                    onChange={(e) => setFormData({ ...formData, required_capacity_ton: Number(e.target.value) })}
                  >
                    <option value={2.5}>2.5 Ton (Indoor / Listrik)</option>
                    <option value={3.0}>3.0 Ton (Standard Diesel)</option>
                    <option value={5.0}>5.0 Ton (Medium Heavy)</option>
                    <option value={7.0}>7.0 Ton (Heavy Duty)</option>
                    <option value={10.0}>10.0 Ton (Extra Heavy)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Unit Forklift Dialokasikan</label>
                  <select 
                    className="form-control"
                    value={formData.unit_id}
                    onChange={(e) => setFormData({ ...formData, unit_id: Number(e.target.value) })}
                    required
                  >
                    {units.length === 0 && (
                      <option value={0} disabled>Memuat data unit...</option>
                    )}
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.unit_code} - {u.brand} {u.capacity_ton}T ({u.status === 'AVAILABLE' ? 'READY' : u.status})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Alamat Lengkap Lokasi Proyek</label>
                <textarea 
                  className="form-control" 
                  rows={2}
                  placeholder="Kawasan Industri, Dermaga, atau Nama Gudang Tujuan"
                  value={formData.project_location}
                  onChange={(e) => setFormData({ ...formData, project_location: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>PIC / Penerima di Lapangan</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Nama Penanggung Jawab Lapangan"
                    value={formData.location_pic_name}
                    onChange={(e) => setFormData({ ...formData, location_pic_name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Total Kesepakatan Biaya Sewa (Rp)</label>
                  <input 
                    type="text" 
                    className="form-control"
                    value={priceDisplay}
                    onChange={handlePriceChange}
                    placeholder="Contoh: 1.500.000"
                    style={{ fontWeight: 600 }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setShowModal(false)}
                  disabled={isSubmitting}
                >
                  Batal
                </button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Pesanan ke Sistem'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

