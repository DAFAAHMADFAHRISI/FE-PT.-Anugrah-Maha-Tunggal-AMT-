import React, { useState, useEffect } from 'react';
import { Customer } from '../types';
import { api } from '../services/api';
import { Building2, Phone, Mail, MapPin } from 'lucide-react';

export const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([
    {
      id: 1,
      customer_code: 'CUST-001',
      name: 'PT. Pelabuhan Samudera Raya',
      type: 'PT',
      pic_name: 'Pak Rahmat / Pak Herman',
      phone: '081234567890',
      email: 'purchasing@samuderaraya.co.id',
      address: 'Kawasan Industri Cilegon Kav 12, Area Dermaga 3, Banten'
    },
    {
      id: 2,
      customer_code: 'CUST-002',
      name: 'PT. Mega Baja Mandiri',
      type: 'PT',
      pic_name: 'Ibu Maya (Logistik)',
      phone: '081398765432',
      email: 'logistik@megabaja.com',
      address: 'Jl. Raya Narogong Km 14, Bekasi, Jawa Barat'
    },
    {
      id: 3,
      customer_code: 'CUST-003',
      name: 'CV. Makmur Jaya Abadi',
      type: 'CV',
      pic_name: 'Pak Joko',
      phone: '085711223344',
      email: 'makmurjaya@gmail.com',
      address: 'Jl. Industri Pergudangan No. 45, Tangerang'
    }
  ]);

  useEffect(() => {
    api.get('/customers')
      .then((res) => {
        if (res.data.success && res.data.data && res.data.data.length > 0) {
          setCustomers(res.data.data);
        }
      })
      .catch((err) => {
        console.log('Menggunakan data awal pelanggan:', err);
      });
  }, []);

  return (
    <div className="page-body">
      <div className="content-card">
        <div className="card-header-row">
          <div>
            <h2 className="card-title">Master Data Pelanggan (PT / Perorangan)</h2>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
              Database rekanan dan klien penyewa unit forklift di PT. Anugrah Maha Tunggal
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
            {customers.length} Pelanggan Terdaftar
          </span>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Kode</th>
                <th>Nama Perusahaan</th>
                <th>PIC / Kontak Lapangan</th>
                <th>No. Telepon & Email</th>
                <th>Alamat Kantor / Pabrik</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 700, color: '#2563eb' }}>{c.customer_code}</td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{c.name}</div>
                    <span style={{ 
                      fontSize: '10px', 
                      background: '#f1f5f9', 
                      padding: '2px 6px', 
                      borderRadius: '4px',
                      color: '#475569'
                    }}>
                      {c.type}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{c.pic_name}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                      <Phone size={12} color="#16a34a" /> {c.phone}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                      <Mail size={12} /> {c.email}
                    </div>
                  </td>
                  <td style={{ maxWidth: '280px', fontSize: '12px', color: '#334155' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                      <MapPin size={14} color="#64748b" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>{c.address}</span>
                    </div>
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
