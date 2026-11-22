import { api } from './api';
import {
  SAWCalculationResult,
  Kriteria,
  BobotKriteria,
  OperationalLog,
  HasilRanking,
  SPKMaintenance,
} from '../types';

export interface WeightInput {
  kriteria_id: number;
  weight: number;
}

export interface OperationalLogInput {
  unit_id: number;
  log_date: string;
  hour_meter: number;
  machine_age: number;
  breakdown_freq: number;
  idle_days: number;
  notes?: string;
}

export interface SPKMaintenanceInput {
  unit_id: number;
  risk_score: number;
  risk_status: string;
  mechanic_name: string;
  complaint_notes: string;
  scheduled_date: string;
  notes?: string;
}

export const sawService = {
  // 1. Rekomendasi Prioritas Servis Terkini (GET /api/v1/saw/ranking)
  async getLatestRanking(): Promise<SAWCalculationResult> {
    const res = await api.get('/saw/ranking');
    return res.data.data;
  },

  // 2. Memicu Kalkulasi Ulang Algoritma SAW (POST /api/v1/saw/calculate)
  async calculateRanking(notes?: string): Promise<SAWCalculationResult> {
    const res = await api.post('/saw/calculate', { notes });
    return res.data.data;
  },

  // 3. Mengambil Data Kriteria & Bobot Preferensi (GET /api/v1/saw/criteria)
  async getCriteriaAndWeights(): Promise<{ kriteria: Kriteria[]; bobot: BobotKriteria[] }> {
    const res = await api.get('/saw/criteria');
    return res.data.data;
  },

  // 4. Memperbarui Bobot Preferensi (PUT /api/v1/saw/weights)
  async updateWeights(weights: WeightInput[]): Promise<SAWCalculationResult> {
    const res = await api.put('/saw/weights', { weights });
    return res.data.data;
  },

  // 5. Riwayat Snapshot Ranking (GET /api/v1/saw/history)
  async getRankingHistory(limit = 10): Promise<HasilRanking[]> {
    const res = await api.get('/saw/history', { params: { limit } });
    return res.data.data;
  },

  // 6. Log Operasional Armada (GET & POST /api/v1/operational-logs)
  async getOperationalLogs(unitId?: number, limit = 50): Promise<OperationalLog[]> {
    const res = await api.get('/operational-logs', { params: { unit_id: unitId, limit } });
    return res.data.data;
  },

  async createOperationalLog(data: OperationalLogInput): Promise<OperationalLog> {
    const res = await api.post('/operational-logs', data);
    return res.data.data;
  },

  // 7. Surat Perintah Kerja (SPK) Pemeliharaan Bengkel (GET & POST /api/v1/maintenance/spk)
  async getSPKMaintenanceList(): Promise<SPKMaintenance[]> {
    const res = await api.get('/maintenance/spk');
    return res.data.data;
  },

  async createSPKMaintenance(data: SPKMaintenanceInput): Promise<SPKMaintenance> {
    const res = await api.post('/maintenance/spk', data);
    return res.data.data;
  },

  async getSPKMaintenanceByID(id: number): Promise<SPKMaintenance> {
    const res = await api.get(`/maintenance/spk/${id}`);
    return res.data.data;
  },
};

