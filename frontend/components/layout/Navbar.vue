<template>
  <header class="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
    <div class="container mx-auto flex h-16 items-center justify-between px-4">
      <NuxtLink to="/" class="flex items-center gap-2.5">
        <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Heart class="h-4 w-4 text-primary-foreground" />
        </div>
        <span class="text-lg font-bold tracking-tight">Peduli Kamu</span>
      </NuxtLink>

      <nav class="hidden items-center gap-1 md:flex">
        <NuxtLink to="/" class="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
          Beranda
        </NuxtLink>
        <template v-if="user">
          <template v-if="group === 'pasien'">
            <NuxtLink
              to="/family/dashboard"
              class="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Dashboard
            </NuxtLink>
            <NuxtLink
              to="/family/find"
              class="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Cari Perawat
            </NuxtLink>
            <NuxtLink
              to="/chat"
              class="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Chat
            </NuxtLink>
            <NuxtLink
              to="/family/pembayaran"
              class="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Pembayaran
            </NuxtLink>
            <NuxtLink
              to="/family/approval"
              class="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Approval
            </NuxtLink>
          </template>
          <template v-if="group === 'mitra'">
            <NuxtLink
              v-for="item in mitraDesktopLinks"
              :key="item.to"
              :to="item.to"
              class="rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              :class="isNavActive(route.path, item.to) ? 'bg-accent text-foreground' : 'text-muted-foreground'"
            >
              {{ item.label }}
            </NuxtLink>
          </template>
        </template>
      </nav>

      <div class="hidden items-center gap-3 md:flex">
        <template v-if="user">
          <NuxtLink to="/notifikasi" class="relative rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground" aria-label="Notifikasi">
            <Bell class="h-5 w-5" />
            <span v-if="unread > 0" class="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {{ unread > 99 ? '99+' : unread }}
            </span>
          </NuxtLink>
          <NuxtLink
            v-if="group === 'mitra'"
            to="/mitra/profil"
            class="flex items-center gap-2 rounded-md p-1 pr-2 transition-colors hover:bg-accent"
            :title="`Profil ${user.name}`"
          >
            <UiAvatar class="h-8 w-8" :fallback="user.name.charAt(0).toUpperCase()" />
            <span class="max-w-28 truncate text-sm font-medium">{{ user.name }}</span>
          </NuxtLink>
          <div v-else class="flex items-center gap-2">
            <UiAvatar class="h-8 w-8" :fallback="user.name.charAt(0).toUpperCase()" />
            <div class="flex flex-col">
              <span class="max-w-28 truncate text-sm font-medium leading-none">{{ user.name }}</span>
              <span class="text-xs text-muted-foreground">{{ roleLabel(user.role) }}</span>
            </div>
          </div>
          <UiSeparator orientation="vertical" class="h-8" />
          <UiButton variant="ghost" size="sm" @click="logout">
            <LogOut class="mr-1 h-4 w-4" />
            Keluar
          </UiButton>
        </template>
        <template v-else>
          <NuxtLink to="/auth">
            <UiButton variant="ghost" size="sm">Masuk</UiButton>
          </NuxtLink>
          <NuxtLink to="/auth?role=family">
            <UiButton size="sm">Daftar Sekarang</UiButton>
          </NuxtLink>
        </template>
      </div>

      <!-- Mobile: mitra memakai bottom nav + drawer "Lainnya", jadi hamburger tidak diperlukan -->
      <div class="flex items-center gap-1 md:hidden">
        <NuxtLink v-if="user && group === 'mitra'" to="/notifikasi" class="relative rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent" aria-label="Notifikasi">
          <Bell class="h-5 w-5" />
          <span v-if="unread > 0" class="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {{ unread > 99 ? '99+' : unread }}
          </span>
        </NuxtLink>
        <button v-if="group !== 'mitra'" class="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent" @click="isOpen = !isOpen">
          <X v-if="isOpen" class="h-5 w-5" />
          <Menu v-else class="h-5 w-5" />
        </button>
      </div>
    </div>

    <Transition name="slide">
      <div v-if="isOpen && group !== 'mitra'" class="border-t bg-background p-4 md:hidden">
        <nav class="flex flex-col gap-1">
          <template v-if="user">
            <NuxtLink :to="dashTo" class="rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent" @click="isOpen = false">Dashboard</NuxtLink>
            <template v-if="group === 'pasien'">
              <NuxtLink to="/family/find" class="rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent" @click="isOpen = false">Cari Perawat</NuxtLink>
              <NuxtLink to="/chat" class="rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent" @click="isOpen = false">Chat</NuxtLink>
              <NuxtLink to="/family/pembayaran" class="rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent" @click="isOpen = false">Riwayat Pembayaran</NuxtLink>
              <NuxtLink to="/family/approval" class="rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent" @click="isOpen = false">Approval Absensi</NuxtLink>
            </template>
            <NuxtLink to="/notifikasi" class="flex items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent" @click="isOpen = false">
              <span>Notifikasi</span>
              <span v-if="unread > 0" class="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[11px] font-bold text-destructive-foreground">{{ unread > 99 ? '99+' : unread }}</span>
            </NuxtLink>
            <UiSeparator class="my-2" />
            <div class="flex items-center gap-2 px-3 py-2">
              <UiAvatar class="h-8 w-8" :fallback="user.name.charAt(0).toUpperCase()" />
              <span class="text-sm font-medium">{{ user.name }}</span>
            </div>
            <UiButton variant="outline" class="mt-2 w-full justify-start" @click="logout(); isOpen = false">
              <LogOut class="mr-2 h-4 w-4" /> Keluar
            </UiButton>
          </template>
          <template v-else>
            <UiSeparator class="my-2" />
            <NuxtLink to="/auth" @click="isOpen = false"><UiButton variant="ghost" class="w-full justify-start">Masuk</UiButton></NuxtLink>
            <NuxtLink to="/auth?role=family" @click="isOpen = false"><UiButton class="mt-1 w-full">Daftar Sekarang</UiButton></NuxtLink>
          </template>
        </nav>
      </div>
    </Transition>
  </header>
</template>

<script setup lang="ts">
import { Heart, LogOut, Menu, X, Bell } from 'lucide-vue-next'
import { toRoleGroup, dashboardPath, roleLabel } from '@/lib/roles'
import { mitraNav, isNavActive } from '@/lib/navigation'

const route = useRoute()
const { user, logout } = useAuth()
const { unread, refreshUnread } = useNotifications()
const isOpen = ref(false)

const group = computed(() => toRoleGroup(user.value?.role))
const dashTo = computed(() => dashboardPath(user.value?.role))
const mitraDesktopLinks = [...mitraNav.primary, ...mitraNav.desktopExtra]

// Polling ringan badge notifikasi (client-only, 60 detik)
let timer: ReturnType<typeof setInterval> | null = null
onMounted(async () => {
  if (user.value) {
    await refreshUnread()
    timer = setInterval(() => refreshUnread(), 60000)
  }
})
watch(() => user.value?.id, async (id) => {
  if (id) await refreshUnread()
})
onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.slide-enter-active, .slide-leave-active { transition: all 0.2s ease; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
