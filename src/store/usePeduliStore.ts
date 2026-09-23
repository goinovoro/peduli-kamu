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

export interface Job {
  id: string;
  familyId: string;
  title: string;
  description: string;
  location: string;
  budget: number;
  status: 'open' | 'closed';
  createdAt: string;
}

interface PeduliState {
  user: User | null;
  patients: Patient[];
  caregivers: Caregiver[];
  bookings: Booking[];
  jobs: Job[];
  login: (user: User) => void;
  logout: () => void;
  addPatient: (patient: Patient) => void;
  acceptBooking: (bookingId: string) => void;
  declineBooking: (bookingId: string) => void;
  addJob: (job: Job) => void;
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

const mockJobs: Job[] = [
  {
    id: 'j1',
    familyId: 'f1',
    title: 'Perawatan Pasca Operasi Jantung',
    description: 'Dibutuhkan perawat terampil (STR Aktif) untuk merawat ayah saya pasca operasi selama 2 minggu ke depan. Tugas meliputi pemantauan vital dan perawatan luka.',
    location: 'Jakarta Selatan',
    budget: 120000,
    status: 'open',
    createdAt: new Date().toISOString()
  },
  {
    id: 'j2',
    familyId: 'f2',
    title: 'Pendampingan Harian Nenek',
    description: 'Mencari perawat tier 1 untuk mendampingi nenek jalan pagi, mengingatkan obat, dan menemani aktivitas ringan dari jam 8 pagi sampai 12 siang.',
    location: 'Bandung',
    budget: 50000,
    status: 'open',
    createdAt: new Date().toISOString()
  }
];

export const usePeduliStore = create<PeduliState>((set) => ({
  user: null, // Start logged out
  patients: mockPatients,
  caregivers: mockCaregivers,
  bookings: mockBookings,
  jobs: mockJobs,
  login: (user) => set({ user }),
  logout: () => set({ user: null }),
  addPatient: (patient) => set((state) => ({ patients: [...state.patients, patient] })),
  acceptBooking: (bookingId) => set((state) => ({
    bookings: state.bookings.map((b) => b.id === bookingId ? { ...b, status: 'upcoming' } : b)
  })),
  declineBooking: (bookingId) => set((state) => ({
    bookings: state.bookings.filter((b) => b.id !== bookingId)
  })),
  addJob: (job) => set((state) => ({ jobs: [job, ...state.jobs] }))
}));
