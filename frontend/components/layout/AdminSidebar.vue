<template>
  <aside class="hidden w-64 shrink-0 flex-col border-r bg-card md:flex" :class="collapsed ? 'md:w-16' : ''">
    <div class="flex h-16 items-center gap-2.5 border-b px-4">
      <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
        <ShieldCheck class="h-4 w-4 text-primary-foreground" />
      </div>
      <div v-if="!collapsed" class="min-w-0">
        <p class="truncate text-sm font-bold leading-none">Admin Panel</p>
        <p class="mt-1 text-xs text-muted-foreground leading-none">Peduli Kamu</p>
      </div>
    </div>

    <nav class="flex-1 space-y-1 overflow-y-auto p-3">
      <p v-if="!collapsed" class="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Operasional</p>
      <NuxtLink
        v-for="item in mainItems"
        :key="item.to"
        :to="item.to"
        class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
        :class="isActive(item.to) ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'"
        :title="item.label"
      >
        <component :is="item.icon" class="h-4 w-4 shrink-0" />
        <span v-if="!collapsed" class="truncate">{{ item.label }}</span>
        <span v-if="!collapsed && item.badge" class="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[11px] font-bold text-destructive-foreground">
          {{ item.badge }}
        </span>
      </NuxtLink>

      <p v-if="!collapsed" class="px-2 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Keuangan</p>
      <NuxtLink
        v-for="item in moneyItems"
        :key="item.to"
        :to="item.to"
        class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
        :class="isActive(item.to) ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'"
        :title="item.label"
      >
        <component :is="item.icon" class="h-4 w-4 shrink-0" />
        <span v-if="!collapsed" class="truncate">{{ item.label }}</span>
        <span v-if="!collapsed && item.badge" class="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[11px] font-bold text-destructive-foreground">
          {{ item.badge }}
        </span>
      </NuxtLink>
    </nav>

    <div class="border-t p-3">
      <button class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground" @click="collapsed = !collapsed">
        <component :is="collapsed ? ChevronsRight : ChevronsLeft" class="h-4 w-4 shrink-0" />
        <span v-if="!collapsed">Ciutkan</span>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import {
  LayoutDashboard, Users, ShieldCheck, Wallet,
  Flag, ChevronsLeft, ChevronsRight, Activity, Star,
} from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  counts?: Record<string, number>
}>(), { counts: () => ({}) })

const route = useRoute()
const collapsed = ref(false)

const badge = (n?: number) => (n && n > 0 ? (n > 99 ? '99+' : n) : null)

const mainItems = computed(() => [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/admin' },
  { label: 'Pengguna', icon: Users, to: '/admin/pengguna' },
  { label: 'Verifikasi Mitra', icon: ShieldCheck, to: '/admin/verifikasi', badge: badge(props.counts.verifikasiMitra) },
  { label: 'Monitor', icon: Activity, to: '/admin/monitor' },
  { label: 'Sengketa', icon: Flag, to: '/admin/sengketa', badge: badge(props.counts.sengketa) },
  { label: 'Review', icon: Star, to: '/admin/review' },
])

const moneyItems = computed(() => [
  { label: 'Antrian Uang', icon: Wallet, to: '/admin/uang', badge: badge((props.counts.deposit ?? 0) + (props.counts.pembayaran ?? 0) + (props.counts.payout ?? 0)) },
])

function isActive(to: string) {
  if (to === '/admin') return route.path === '/admin'
  return route.path === to || route.path.startsWith(`${to}/`)
}
</script>
