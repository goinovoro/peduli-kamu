<template>
  <div class="container mx-auto max-w-3xl px-4 py-8 pb-24 md:pb-8">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight md:text-3xl">Notifikasi</h1>
        <p class="mt-1 text-sm text-muted-foreground">Aktivitas penting akun Anda.</p>
      </div>
      <UiButton v-if="hasUnread" variant="outline" size="sm" :disabled="markingAll" @click="onReadAll">
        <CheckCheck class="mr-1 h-4 w-4" />
        Tandai dibaca
      </UiButton>
    </div>

    <div v-if="pending" class="space-y-3">
      <UiCard v-for="i in 3" :key="i" class="p-4">
        <div class="skeleton-shimmer h-4 w-2/3 rounded" />
        <div class="skeleton-shimmer mt-2 h-3 w-1/2 rounded" />
      </UiCard>
    </div>

    <div v-else-if="loadError" class="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
      <p class="text-sm font-medium text-destructive">{{ loadError }}</p>
      <UiButton variant="outline" size="sm" class="mt-3" @click="refresh()">Coba lagi</UiButton>
    </div>

    <div v-else-if="!items.length" class="rounded-xl border p-10 text-center">
      <Bell class="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
      <p class="font-medium">Belum ada notifikasi</p>
      <p class="mt-1 text-sm text-muted-foreground">Aktivitas seperti minat, pembayaran, dan verifikasi akan muncul di sini.</p>
    </div>

    <div v-else class="space-y-2">
      <component
        :is="n.linkUrl ? 'NuxtLink' : 'div'"
        v-for="n in items"
        :key="n.id"
        :to="n.linkUrl || undefined"
        class="flex items-start gap-3 rounded-xl border p-4 transition-colors hover:bg-muted/40"
        :class="n.read ? 'bg-card' : 'border-primary/30 bg-primary/[0.03]'"
        @click="n.linkUrl ? onOpen(n) : null"
      >
        <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" :class="n.read ? 'bg-muted' : 'bg-primary/10'">
          <Bell class="h-4 w-4" :class="n.read ? 'text-muted-foreground' : 'text-primary'" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex items-start justify-between gap-2">
            <p class="text-sm font-semibold leading-snug">{{ n.title }}</p>
            <span v-if="!n.read" class="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
          </div>
          <p v-if="n.body" class="mt-0.5 text-[13px] text-muted-foreground leading-relaxed">{{ n.body }}</p>
          <p class="mt-1 text-xs text-muted-foreground">{{ formatDateTime(n.createdAt) }}</p>
        </div>
      </component>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Bell, CheckCheck } from 'lucide-vue-next'
import { formatDateTime } from '@/lib/format'
import { getApiErrorMessage } from '@/composables/useApi'
import type { AppNotification } from '@/composables/useNotifications'

definePageMeta({ ssr: false, middleware: ['auth'] })
useSeoMeta({ title: 'Notifikasi', robots: 'noindex, nofollow' })

const api = useApi()
const toast = useToast()
const { refreshUnread, markRead, markAllRead } = useNotifications()

const { data, pending, error: fetchError, refresh } = await useAsyncData('notifications', () =>
  api<AppNotification[]>('/notifications/me'),
)

const items = computed(() => data.value ?? [])
const hasUnread = computed(() => items.value.some((n) => !n.read))
const loadError = computed(() => (fetchError.value ? getApiErrorMessage(fetchError.value, 'Gagal memuat notifikasi.') : ''))

async function onOpen(n: AppNotification) {
  if (!n.read) {
    await markRead(n.id)
    n.read = true
  }
}

const markingAll = ref(false)
async function onReadAll() {
  markingAll.value = true
  try {
    await markAllRead()
    items.value.forEach((n) => { n.read = true })
    toast.success('Semua notifikasi ditandai dibaca.')
  } catch (e: any) {
    toast.error('Gagal', getApiErrorMessage(e))
  } finally {
    markingAll.value = false
  }
}

onMounted(() => refreshUnread())
</script>
