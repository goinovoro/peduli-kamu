<template>
  <div class="min-h-screen flex flex-col bg-background">
    <CommonAccountStatusBanner />
    <LayoutNavbar />

    <div class="flex flex-1 w-full">
      <!-- Sidebar admin: desktop saja -->
      <LayoutAdminSidebar v-if="isAdminArea" :counts="adminCounts" />

      <main class="flex-1 w-full min-w-0">
        <slot />
      </main>
    </div>

    <footer v-if="!isAdminArea" class="border-t bg-muted/30 pb-20 md:pb-0">
      <div class="container mx-auto px-4 py-12">
        <div class="grid gap-8 md:grid-cols-4">
          <div class="md:col-span-2">
            <div class="flex items-center gap-2.5">
              <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Heart class="h-4 w-4 text-primary-foreground" />
              </div>
              <span class="text-lg font-bold">Peduli Kamu</span>
            </div>
            <p class="mt-4 max-w-sm text-sm text-muted-foreground leading-relaxed">
              Platform home care terpercaya yang menghubungkan keluarga dengan lulusan perawat bersertifikat untuk perawatan di rumah.
            </p>
          </div>
          <div>
            <h3 class="mb-4 text-sm font-semibold">Layanan</h3>
            <ul class="space-y-2.5 text-sm text-muted-foreground">
              <li><NuxtLink to="/family/find" class="transition-colors hover:text-foreground">Cari Perawat</NuxtLink></li>
              <li><NuxtLink to="/auth?role=family" class="transition-colors hover:text-foreground">Untuk Keluarga</NuxtLink></li>
              <li><NuxtLink to="/auth?role=caregiver" class="transition-colors hover:text-foreground">Jadi Mitra Perawat</NuxtLink></li>
            </ul>
          </div>
          <div>
            <h3 class="mb-4 text-sm font-semibold">Informasi</h3>
            <ul class="space-y-2.5 text-sm text-muted-foreground">
              <li>Companion Care</li>
              <li>Skilled Medical Care</li>
              <li>FAQ</li>
            </ul>
          </div>
        </div>
        <UiSeparator class="my-8" />
        <div class="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p class="text-sm text-muted-foreground">&copy; 2026 Peduli Kamu. Semua hak dilindungi.</p>
          <p class="text-sm text-muted-foreground">Perawatan di rumah yang terpercaya dari hati.</p>
        </div>
      </div>
    </footer>

    <!-- Bottom navbar: mobile saja (tambah padding bawah konten via pb pada main pages) -->
    <LayoutBottomNav @open-admin-menu="menuOpen = true" />

    <!-- Drawer menu lengkap (mobile, dari tombol Lainnya) -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="menuOpen" class="fixed inset-0 z-[90] md:hidden">
          <div class="absolute inset-0 bg-black/50" @click="menuOpen = false" />
          <div class="absolute inset-x-0 bottom-0 max-h-[75vh] overflow-y-auto rounded-t-2xl bg-card p-4 pb-8">
            <div class="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
            <p class="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Menu {{ menuTitle }}</p>
            <NuxtLink
              v-for="item in menuItems"
              :key="item.to"
              :to="item.to"
              class="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors hover:bg-accent"
              @click="menuOpen = false"
            >
              <component :is="item.icon" class="h-5 w-5 text-muted-foreground" />
              <span>{{ item.label }}</span>
            </NuxtLink>
            <UiSeparator class="my-2" />
            <button
              type="button"
              class="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium text-destructive transition-colors hover:bg-destructive/5"
              @click="logoutFromMenu"
            >
              <LogOut class="h-5 w-5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>

    <UiToastHost />
  </div>
</template>

<script setup lang="ts">
import { Heart, LayoutDashboard, Users, ShieldCheck, Wallet, Flag, Activity, Star, Home, Search, MessageCircle, Clock, Bell, LogOut } from 'lucide-vue-next'
import { toRoleGroup, roleLabel } from '@/lib/roles'
import { mitraNav } from '@/lib/navigation'

const route = useRoute()
const { user, logout } = useAuth()

function logoutFromMenu() {
  menuOpen.value = false
  logout()
}

const isAdminArea = computed(() => route.path.startsWith('/admin'))
const menuOpen = ref(false)
const group = computed(() => toRoleGroup(user.value?.role))
const menuTitle = computed(() => roleLabel(user.value?.role))

// Menu lengkap per role untuk drawer mobile (tombol "Lainnya")
const menuItems = computed(() => {
  if (group.value === 'admin') {
    return [
      { label: 'Dashboard', icon: LayoutDashboard, to: '/admin' },
      { label: 'Pengguna', icon: Users, to: '/admin/pengguna' },
      { label: 'Verifikasi Mitra', icon: ShieldCheck, to: '/admin/verifikasi' },
      { label: 'Monitor', icon: Activity, to: '/admin/monitor' },
      { label: 'Antrian Uang', icon: Wallet, to: '/admin/uang' },
      { label: 'Sengketa', icon: Flag, to: '/admin/sengketa' },
      { label: 'Review', icon: Star, to: '/admin/review' },
    ]
  }
  if (group.value === 'mitra') {
    return [...mitraNav.primary, ...mitraNav.more]
  }
  return [
    { label: 'Beranda', icon: Home, to: '/' },
    { label: 'Cari Perawat', icon: Search, to: '/family/find' },
    { label: 'Dashboard', icon: LayoutDashboard, to: '/family/dashboard' },
    { label: 'Chat', icon: MessageCircle, to: '/chat' },
    { label: 'Riwayat Pembayaran', icon: Wallet, to: '/family/pembayaran' },
    { label: 'Approval Absensi', icon: Clock, to: '/family/approval' },
    { label: 'Notifikasi', icon: Bell, to: '/notifikasi' },
  ]
})

// Badge sidebar admin: hanya fetch saat admin membuka area admin
const adminCounts = ref<Record<string, number>>({})
watch(() => ({ path: route.path, id: user.value?.id }), async ({ path, id }) => {
  if (!path.startsWith('/admin') || !id || toRoleGroup(user.value?.role) !== 'admin') return
  try {
    const api = useApi()
    const stats = await api<any>('/admin/stats')
    adminCounts.value = {
      verifikasiMitra: stats?.antrian?.verifikasiMitra ?? 0,
      sengketa: stats?.antrian?.sengketaTerbuka ?? 0,
      deposit: stats?.antrian?.deposit ?? 0,
      pembayaran: stats?.antrian?.pembayaran ?? 0,
      payout: stats?.antrian?.payoutLayak ?? 0,
    }
  } catch {
    // badge opsional — jangan ganggu halaman
  }
}, { immediate: true })
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
