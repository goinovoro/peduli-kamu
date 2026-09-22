import { create } from 'zustand';

export type Role = 'family' | 'caregiver' | null;
export type CareTier = 'companion' | 'skilled';

export interface User {
  id: string;
  name: string;
  role: Role;
  email: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  tier: CareTier;
}

export interface Caregiver {
  id: string;
  name: string;
  university: string;
  graduationYear: number;
  ratePerHour: number;
  strStatus: 'Menunggu STR' | 'STR Aktif';
  tier: CareTier;
  location: string;
}

export interface Booking {
  id: string;
  patientId: string;
  caregiverId: string;
  date: string;
  status: 'upcoming' | 'past' | 'pending';
}

interface PeduliState {
  user: User | null;
  patients: Patient[];
  caregivers: Caregiver[];
  bookings: Booking[];
  login: (user: User) => void;
  logout: () => void;
  addPatient: (patient: Patient) => void;
  acceptBooking: (bookingId: string) => void;
  declineBooking: (bookingId: string) => void;
}

const mockCaregivers: Caregiver[] = [
  {
    id: 'c1',
    name: 'Siti Rahma',
    university: 'Poltekkes Kemenkes Jakarta I',
    graduationYear: 2023,
    ratePerHour: 75000,
    strStatus: 'STR Aktif',
    tier: 'skilled',
    location: 'Jakarta Selatan'
  },
  {
    id: 'c2',
    name: 'Budi Santoso',
    university: 'Universitas Padjadjaran',
    graduationYear: 2024,
    ratePerHour: 50000,
    strStatus: 'Menunggu STR',
    tier: 'companion',
    location: 'Bandung'
  },
  {
    id: 'c3',
    name: 'Ayu Lestari',
    university: 'Poltekkes Kemenkes Bandung',
    graduationYear: 2022,
    ratePerHour: 80000,
    strStatus: 'STR Aktif',
    tier: 'skilled',
    location: 'Jakarta Timur'
  }
];

const mockPatients: Patient[] = [
  { id: 'p1', name: 'Opa Hendra', age: 75, tier: 'skilled' },
];

const mockBookings: Booking[] = [
  { id: 'b1', patientId: 'p1', caregiverId: 'c1', date: '2026-10-01T09:00:00Z', status: 'upcoming' },
  { id: 'b2', patientId: 'p1', caregiverId: 'c2', date: '2026-10-05T14:00:00Z', status: 'pending' },
];

export const usePeduliStore = create<PeduliState>((set) => ({
  user: null, // Start logged out
  patients: mockPatients,
  caregivers: mockCaregivers,
  bookings: mockBookings,
  login: (user) => set({ user }),
  logout: () => set({ user: null }),
  addPatient: (patient) => set((state) => ({ patients: [...state.patients, patient] })),
  acceptBooking: (bookingId) => set((state) => ({
    bookings: state.bookings.map((b) => b.id === bookingId ? { ...b, status: 'upcoming' } : b)
  })),
  declineBooking: (bookingId) => set((state) => ({
    bookings: state.bookings.filter((b) => b.id !== bookingId)
  }))
}));
