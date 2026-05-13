export type Role = 'ADMIN' | 'USER';

export interface User {
  id: string;
  email: string;
  role: Role;
  name: string;
}

export interface Guide {
  id: string;
  title: string;
  category: 'Luka Bakar' | 'Patah Tulang' | 'Tersedak' | 'Serangan Jantung' | 'Pendarahan Berat' | 'Pingsan' | 'Digigit Ular' | 'Keracunan' | 'Lainnya';
  symptoms?: string[];
  steps: string[];
  lastUpdated: string;
}

export interface Facility {
  id: string;
  name: string;
  address: string;
  phone: string;
  type: 'RS' | 'Klinik';
  lat?: number;
  lng?: number;
}

export interface Metric {
  totalSeaches: number;
  activeUsers: number;
}
