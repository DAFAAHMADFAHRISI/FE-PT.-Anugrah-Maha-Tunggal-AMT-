import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';
import { Users as UsersIcon, Shield, Mail, Phone, CheckCircle2 } from 'lucide-react';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([
    {
      id: 1,
      name: 'Siti Rahma (Staff Administrasi)',
      username: 'admin',
      email: 'admin@anugrahmahatunggal.com',
      role: 'admin_staff',
      phone: '081234567890'
    },
    {
      id: 2,
      name: 'Bapak Hendra (Direktur)',
      username: 'direktur',
      email: 'direktur@anugrahmahatunggal.com',
      role: 'direktur',
      phone: '081199887766'
    }
  ]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    api.get('/users')
      .then((res) => {
        if (res.data.success && res.data.data && res.data.data.length > 0) {
          setUsers(res.data.data);
        }
      })
      .catch((err) => {
        console.log('Menggunakan data inisial users:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="page-body">
      <div className="content-card">
        <div className="card-header-row">
          <div>
            <h2 className="card-title">Manajemen Akun Pengguna (Tabel Users)</h2>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
              Data akun pegawai dan hak akses sistem (Role-Based Access Control) terdaftar di MySQL
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
            {users.length} Akun Terdaftar
          </span>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nama Lengkap</th>
                <th>Username</th>
                <th>Email Perusahaan</th>
                <th>Role / Hak Akses</th>
                <th>No. Telepon</th>
                <th>Status Akun</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 700, color: '#64748b' }}>#{u.id}</td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{u.name}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>ID Pegawai: AMT-EMP-0{u.id}</div>
                  </td>
                  <td>
                    <code style={{ 
                      background: '#f1f5f9', 
                      padding: '2px 6px', 
                      borderRadius: '4px',
                      fontSize: '12px',
                      color: '#2563eb',
                      fontWeight: 600
                    }}>
                      @{u.username}
                    </code>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                      <Mail size={13} color="#64748b" /> {u.email}
                    </div>
                  </td>
                  <td>
                    {u.role === 'admin_staff' && (
                      <span className="badge badge-assigned" style={{ background: '#0284c7' }}>
                        ADMIN STAFF
                      </span>
                    )}
                    {u.role === 'direktur' && (
                      <span className="badge" style={{ background: '#7c3aed', color: '#fff' }}>
                        DIREKTUR
                      </span>
                    )}
                    {u.role === 'operasional' && (
                      <span className="badge badge-on-the-way">
                        OPERASIONAL
                      </span>
                    )}
                    {u.role === 'finance' && (
                      <span className="badge badge-ready">
                        FINANCE
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                      <Phone size={13} color="#16a34a" /> {u.phone || '-'}
                    </div>
                  </td>
                  <td>
                    <span style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '4px', 
                      color: '#16a34a', 
                      fontSize: '12px', 
                      fontWeight: 600 
                    }}>
                      <CheckCircle2 size={14} /> Aktif
                    </span>
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
