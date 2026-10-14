<template>
  <div class="container mx-auto px-4 py-8 pb-24 md:pb-8">
    <div class="mb-6">
      <h1 class="text-2xl font-bold tracking-tight md:text-3xl">Riwayat Pembayaran</h1>
      <p class="mt-1 text-sm text-muted-foreground">Semua pembayaran QRIS Anda: menunggu verifikasi → escrow → diteruskan payout / dikembalikan sebagian.</p>
    </div>

    <UiCard class="mb-6 border-primary/20 bg-primary/[0.04] p-4">
      <p class="text-sm"><span class="font-bold">Belum bayar Deal?</span> Pembayaran dilakukan dari halaman kelola kebutuhan setelah Deal dibuat.
        <NuxtLink to="/family/dashboard" class="font-medium text-primary hover:underline">Ke Dashboard →</NuxtLink>
      </p>
    </UiCard>

    <div v-if="pending" class="space-y-2">
      <div class="skeleton-shimmer h-16 rounded-xl" />
      <div class="skeleton-shimmer h-16 rounded-xl" />
      <div class="skeleton-shimmer h-16 rounded-xl" />
    </div>
    <div v-else-if="loadError" class="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
      <p class="text-sm font-medium text-destructive">{{ loadError }}</p>
      <UiButton variant="outline" size="sm" class="mt-3" @click="refresh()">Coba lagi</UiButton>
    </div>
    <div v-else-if="!items.length" class="rounded-xl border p-10 text-center">
      <Wallet class="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
      <p class="font-medium">Belum ada pembayaran</p>
      <p class="mt-1 text-sm text-muted-foreground">Bayar full via QRIS setelah Deal — tanpa DP/cicil.</p>
    </div>
    <div v-else class="space-y-3">
      <UiCard v-for="p in items" :key="p.id" class="p-5">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p class="font-bold">{{ formatRupiah(p.amount) }}</p>
            <p class="mt-0.5 text-xs text-muted-foreground">Kontrak {{ p.contractId?.slice(0, 8) || '-' }} · {{ formatDateTime(p.submittedAt) }}</p>
            <div v-if="p.proofImageUrl" class="mt-1">
              <a :href="uploadUrl(p.proofImageUrl)" target="_blank" rel="noopener" class="text-xs text-primary hover:underline">Lihat bukti saya</a>
            </div>
            <p v-if="p.rejectReason" class="mt-1 text-xs text-destructive">Ditolak admin: {{ p.rejectReason }} — unggah ulang dari halaman kebutuhan.</p>
            <p v-if="p.refundAmount" class="mt-1 text-xs text-amber-700">Refund: {{ formatRupiah(p.refundAmount) }}</p>
          </div>
          <UiBadge :variant="statusVariant(p.status)" class="w-fit">{{ statusLabel(p.status) }}</UiBadge>
        </div>
      </UiCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Wallet } from 'lucide-vue-next'
import { statusLabel, statusVariant, formatRupiah, formatDateTime, uploadUrl } from '@/lib/format'
import { getApiErrorMessage } from '@/composables/useApi'

definePageMeta({ ssr: false, middleware: ['auth-family'] })
useSeoMeta({ title: 'Riwayat Pembayaran', robots: 'noindex, nofollow' })

const api = useApi()
const { data, pending, error: fetchError, refresh } = await useAsyncData('family-payments-page', () => api<any[]>('/payments/me'), { default: () => [] })
const items = computed(() => data.value ?? [])
const loadError = computed(() => (fetchError.value ? getApiErrorMessage(fetchError.value, 'Gagal memuat pembayaran.') : ''))
</script>
