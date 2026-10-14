<template>
  <div class="p-4 md:p-8 pb-24 md:pb-8">
    <div class="mb-6">
      <h1 class="text-2xl font-bold tracking-tight md:text-3xl">Moderasi Review</h1>
      <p class="mt-1 text-sm text-muted-foreground">Sembunyikan review melanggar + rating terhitung ulang otomatis (N-05).</p>
    </div>

    <div v-if="pending" class="space-y-3">
      <UiCard v-for="i in 3" :key="i" class="p-5">
        <div class="skeleton-shimmer h-4 w-1/2 rounded" />
        <div class="skeleton-shimmer mt-2 h-3 w-1/3 rounded" />
      </UiCard>
    </div>

    <div v-else-if="loadError" class="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
      <p class="text-sm font-medium text-destructive">{{ loadError }}</p>
      <UiButton variant="outline" size="sm" class="mt-3" @click="refresh()">Coba lagi</UiButton>
    </div>

    <div v-else-if="!items.length" class="rounded-xl border p-10 text-center">
      <Star class="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
      <p class="font-medium">Belum ada review</p>
    </div>

    <div v-else class="space-y-3">
      <UiCard v-for="r in items" :key="r.id" class="p-5" :class="r.hiddenByAdmin ? 'opacity-70' : ''">
        <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p class="font-bold">★ {{ r.overall }}/5 <span class="font-normal text-muted-foreground">· {{ r.reviewer?.name || '-' }} → {{ r.reviewedCaregiver?.user?.name || '-' }}</span></p>
            <p class="mt-0.5 text-xs text-muted-foreground">Ketepatan {{ r.punctuality }} · Profesional {{ r.professionalism }} · Komunikasi {{ r.communication }} · Kualitas {{ r.quality }} · {{ formatDateTime(r.createdAt) }}</p>
            <p v-if="r.comment" class="mt-2 text-sm">“{{ r.comment }}”</p>
            <div class="mt-2">
              <UiBadge :variant="r.hiddenByAdmin ? 'destructive' : 'success'">{{ r.hiddenByAdmin ? 'Disembunyikan' : 'Tampil' }}</UiBadge>
            </div>
          </div>
          <div class="flex shrink-0 gap-2">
            <UiButton v-if="!r.hiddenByAdmin" size="sm" variant="destructive" :disabled="actingId === r.id" @click="moderate(r, true)">Sembunyikan</UiButton>
            <UiButton v-else size="sm" variant="outline" :disabled="actingId === r.id" @click="moderate(r, false)">Tampilkan</UiButton>
          </div>
        </div>
      </UiCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Star, Loader2 } from 'lucide-vue-next'
import { formatDateTime } from '@/lib/format'
import { getApiErrorMessage } from '@/composables/useApi'

definePageMeta({ ssr: false, middleware: ['auth-admin'] })
useSeoMeta({ title: 'Moderasi Review', robots: 'noindex, nofollow' })

const api = useApi()
const toast = useToast()

const { data, pending, error: fetchError, refresh } = await useAsyncData('admin-reviews', () => api<any[]>('/admin/reviews'), { default: () => [] })
const items = computed(() => data.value ?? [])
const loadError = computed(() => (fetchError.value ? getApiErrorMessage(fetchError.value, 'Gagal memuat review.') : ''))
const actingId = ref<string | null>(null)

async function moderate(r: any, hide: boolean) {
  actingId.value = r.id
  try {
    const res = await api<any>(`/reviews/${r.id}/moderate`, { method: 'PATCH', body: { hide } })
    toast.success(hide ? 'Review disembunyikan' : 'Review ditampilkan', `Rating mitra kini ${Number(res?.ratingAvg || 0).toFixed(1)}.`)
    await refresh()
  } catch (e: any) {
    toast.error('Gagal', getApiErrorMessage(e))
  } finally {
    actingId.value = null
  }
}
</script>
