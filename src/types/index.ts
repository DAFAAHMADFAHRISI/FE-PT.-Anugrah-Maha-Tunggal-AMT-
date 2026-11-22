export type UserRole = 'direktur' | 'admin_staff' | 'operasional' | 'finance';

export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  phone?: string;
}

export interface Customer {
  id: number;
  customer_code: string;
  name: string;
  type: 'PT' | 'CV' | 'Perorangan' | 'Instansi';
  pic_name: string;
  phone: string;
  email: string;
  address: string;
}

export interface ForkliftUnit {
  id: number;
  unit_code: string;
  brand: string;
  model: string;
  capacity_ton: number;
  fuel_type: 'Diesel' | 'Electric' | 'Gasoline' | 'LPG';
  manufacture_year: number;
  hourly_rate: number;
  daily_rate: number;
  monthly_rate: number;
  status: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE';
  notes?: string;
  // Variabel SPK SAW
  hour_meter?: number;
  machine_age?: number;
  breakdown_frequency?: number;
  idle_days?: number;
  last_calculated_score?: number;
  last_risk_status?: 'CRITICAL' | 'WARNING' | 'SAFE' | string;
}

export interface Operator {
  id: number;
  nip: string;
  name: string;
  phone: string;
  sio_number: string;
  status: 'STANDBY' | 'ON_DUTY' | 'OFF';
}

export interface RentalOrder {
  id: number;
  order_number: string;
  customer_id: number;
  customer?: Customer;
  order_date: string;
  start_date: string;
  end_date?: string;
  rental_duration_type: 'JAM' | 'HARI' | 'BULAN';
  duration_value: number;
  project_location: string;
  location_pic_name: string;
  location_pic_phone: string;
  required_capacity_ton: number;
  unit_id?: number;
  unit?: ForkliftUnit;
  agreed_price: number;
  status: 'PENDING' | 'APPROVED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  po_reference?: string;
  notes?: string;
  created_at: string;
}

export type OperationalStatus = 'ASSIGNED' | 'ON_THE_WAY' | 'WORKING' | 'FINISHED';

export interface DeliveryLetter {
  id: number;
  letter_number: string;
  rental_order_id: number;
  rental_order?: RentalOrder;
  unit_id: number;
  unit?: ForkliftUnit;
  operator_id: number;
  operator?: Operator;
  issue_date: string;
  departure_time?: string;
  job_description: string;
  recipient_name?: string;
  operational_status: OperationalStatus;
  notes?: string;
  created_at: string;
}

export interface DashboardData {
  unit_stats: {
    total: number;
    available: number;
    rented: number;
    maintenance: number;
  };
  order_stats: {
    total_pending: number;
    total_active: number;
    total_completed: number;
  };
  total_customers: number;
  active_operations: DeliveryLetter[];
  recent_orders: RentalOrder[];
}

// ====================================================================================
// TIPE DATA MODUL SPK PEMELIHARAAN METODE SAW
// ====================================================================================

export interface Kriteria {
  id: number;
  code: string;
  name: string;
  attribute_type: 'benefit' | 'cost';
  unit: string;
  description: string;
}

export interface BobotKriteria {
  id: number;
  kriteria_id: number;
  kriteria?: Kriteria;
  weight: number;
  percentage: number;
  set_by?: number;
  notes?: string;
  updated_at?: string;
}

export interface OperationalLog {
  id: number;
  unit_id: number;
  unit?: ForkliftUnit;
  log_date: string;
  hour_meter: number;     // C1 (Jam)
  machine_age: number;    // C2 (Tahun)
  breakdown_freq: number; // C3 (Kali)
  idle_days: number;      // C4 (Hari)
  recorded_by?: number;
  recorder?: User;
  notes?: string;
  created_at: string;
}

export interface SAWAlternativeResult {
  unit_id: number;
  unit_code: string;
  brand: string;
  model: string;
  capacity_ton: number;
  raw_values: {
    C1: number;
    C2: number;
    C3: number;
    C4: number;
    [key: string]: number;
  };
  normalized_values: {
    C1: number;
    C2: number;
    C3: number;
    C4: number;
    [key: string]: number;
  };
  score_v: number;
  rank_order: number;
  risk_status: 'CRITICAL' | 'WARNING' | 'SAFE' | string;
  risk_color: 'merah' | 'kuning' | 'hijau' | string;
  recommendation: string;
  spk_status: 'NONE' | 'ISSUED' | string;
}

export interface SAWCalculationResult {
  criteria: Array<{
    id: number;
    code: string;
    name: string;
    attribute_type: string;
    weight: number;
    unit: string;
  }>;
  alternatives: SAWAlternativeResult[];
  max_values?: Record<string, number>;
  min_values?: Record<string, number>;
  total_units: number;
  critical_count: number;
  warning_count: number;
  safe_count: number;
  calculated_at: string;
}

export interface HasilRanking {
  id: number;
  calculation_code: string;
  calculated_at: string;
  calculated_by?: number;
  calculator?: User;
  total_units: number;
  critical_count: number;
  warning_count: number;
  safe_count: number;
  notes: string;
  details?: DetailRanking[];
}

export interface DetailRanking {
  id: number;
  hasil_ranking_id: number;
  unit_id: number;
  unit?: ForkliftUnit;
  rank_order: number;
  c1_raw: number;
  c2_raw: number;
  c3_raw: number;
  c4_raw: number;
  c1_normalized: number;
  c2_normalized: number;
  c3_normalized: number;
  c4_normalized: number;
  score_v: number;
  risk_status: string;
  risk_color: string;
  recommendation: string;
  spk_status: string;
}

export interface SPKMaintenance {
  id: number;
  spk_number: string;
  unit_id: number;
  unit?: ForkliftUnit;
  risk_score: number;
  risk_status: string;
  mechanic_name: string;
  complaint_notes: string;
  scheduled_date: string;
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  issued_by?: number;
  issuer?: User;
  issued_at: string;
  notes?: string;
  created_at: string;
}
