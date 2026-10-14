<template>
  <nav class="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur-md md:hidden" style="padding-bottom: env(safe-area-inset-bottom);">
    <div class="grid" :style="{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }">
      <template v-for="item in items" :key="item.label">
        <button
          v-if="item.action"
          class="relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-all duration-200 active:scale-95"
          :class="item.active ? 'text-primary' : 'text-muted-foreground'"
          @click="item.action"
        >
          <component :is="item.icon" class="h-5 w-5 transition-transform duration-200" :class="item.active && 'scale-110'" />
          <span>{{ item.label }}</span>
          <span v-if="item.badge" class="absolute right-1/2 top-1 flex h-4 min-w-4 translate-x-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {{ item.badge }}
          </span>
        </button>
        <NuxtLink
          v-else
          :to="item.to!"
          class="relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-all duration-200 active:scale-95"
          :class="isActive(item.to!) ? 'text-primary' : 'text-muted-foreground'"
        >
          <component :is="item.icon" class="h-5 w-5 transition-transform duration-200" :class="isActive(item.to!) && 'scale-110'" />
          <span>{{ item.label }}</span>
          <span v-if="isActive(item.to!)" class="absolute -top-px h-0.5 w-8 rounded-full bg-primary" />
          <span v-if="item.badge" class="absolute right-1/2 top-1 flex h-4 min-w-4 translate-x-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {{ item.badge }}
          </span>
        </NuxtLink>
      </template>
    </div>
  </nav>
</template>

<script setup lang="ts">
import {
  Home, Search, LayoutDashboard, LogIn, UserPlus,
  ShieldCheck, Wallet, Flag, Menu, MessageCircle,
} from 'lucide-vue-next'
import { toRoleGroup } from '@/lib/roles'
import { mitraNav } from '@/lib/navigation'

interface NavItem {
  label: string
  icon: any
  to?: string
  badge?: number | string | null
  active?: boolean
  action?: () => void
}

const emit = defineEmits(['open-admin-menu'])

const route = useRoute()
const { user } = useAuth()
const { unread } = useNotifications()

const group = computed(() => toRoleGroup(user.value?.role))

const items = computed<NavItem[]>(() => {
  const notifBadge = unread.value > 0 ? (unread.value > 99 ? '99+' : unread.value) : null
  if (group.value === 'admin') {
    return [
      { label: 'Dashboard', icon: LayoutDashboard, to: '/admin' },
      { label: 'Verifikasi', icon: ShieldCheck, to: '/admin/verifikasi' },
      { label: 'Uang', icon: Wallet, to: '/admin/uang' },
      { label: 'Sengketa', icon: Flag, to: '/admin/sengketa' },
      { label: 'Lainnya', icon: Menu, action: () => emit('open-admin-menu') },
    ]
  }
  if (group.value === 'mitra') {
    return [
      ...mitraNav.primary.map((item) => ({ label: item.label, icon: item.icon, to: item.to })),
      { label: 'Lainnya', icon: Menu, action: () => emit('open-admin-menu') },
    ]
  }
  if (group.value === 'pasien') {
    return [
      { label: 'Beranda', icon: Home, to: '/' },
      { label: 'Cari', icon: Search, to: '/family/find' },
      { label: 'Dashboard', icon: LayoutDashboard, to: '/family/dashboard' },
      { label: 'Chat', icon: MessageCircle, to: '/chat' },
      { label: 'Lainnya', icon: Menu, action: () => emit('open-admin-menu') },
    ]
  }
  return [
    { label: 'Beranda', icon: Home, to: '/' },
    { label: 'Cari', icon: Search, to: '/family/find' },
    { label: 'Masuk', icon: LogIn, to: '/auth' },
    { label: 'Daftar', icon: UserPlus, to: '/auth?role=family' },
  ]
})

function isActive(to: string) {
  const path = to.split('?')[0]
  if (path === '/') return route.path === '/'
  return route.path === path || route.path.startsWith(`${path}/`)
}
</script>
