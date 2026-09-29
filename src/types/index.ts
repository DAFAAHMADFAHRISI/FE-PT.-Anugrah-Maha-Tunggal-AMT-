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
