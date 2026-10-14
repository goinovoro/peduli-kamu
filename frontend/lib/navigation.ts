// Sumber tunggal menu mitra. Dipakai oleh Navbar (desktop), BottomNav (mobile),
// dan drawer "Lainnya" agar nama & urutan menu konsisten di semua tempat.
import { Briefcase, Clock, LayoutDashboard, MessageCircle, ShieldCheck, User, Wallet, Bell } from 'lucide-vue-next'

export interface NavLink {
  label: string
  to: string
  icon: any
}

export const mitraNav = {
  /** Menu utama: bottom nav (mobile) dan bagian awal navbar (desktop). */
  primary: [
    { label: 'Dashboard', to: '/mitra/dashboard', icon: LayoutDashboard },
    { label: 'Cari Kerja', to: '/mitra/kebutuhan', icon: Briefcase },
    { label: 'Chat', to: '/chat', icon: MessageCircle },
    { label: 'Absensi', to: '/mitra/absensi', icon: Clock },
  ] as NavLink[],
  /** Menu di navbar desktop setelah menu utama. Profil diakses dari avatar, notifikasi dari ikon lonceng. */
  desktopExtra: [
    { label: 'Pendapatan', to: '/mitra/pendapatan', icon: Wallet },
    { label: 'Deposit', to: '/mitra/deposit', icon: ShieldCheck },
  ] as NavLink[],
  /** Menu drawer "Lainnya" (mobile). */
  more: [
    { label: 'Pendapatan', to: '/mitra/pendapatan', icon: Wallet },
    { label: 'Deposit', to: '/mitra/deposit', icon: ShieldCheck },
    { label: 'Profil', to: '/mitra/profil', icon: User },
    { label: 'Notifikasi', to: '/notifikasi', icon: Bell },
  ] as NavLink[],
}

/** Menu aktif jika path sekarang sama dengan menu atau berada di bawahnya. */
export function isNavActive(currentPath: string, to: string): boolean {
  const path = to.split('?')[0]
  if (path === '/') return currentPath === '/'
  return currentPath === path || currentPath.startsWith(`${path}/`)
}
