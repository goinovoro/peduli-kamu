<template>
  <div class="container mx-auto px-4 py-8 pb-24 md:pb-8">
    <LayoutBackLink to="/mitra/dashboard" label="Dashboard" />
    <div class="mb-6">
      <h1 class="text-2xl font-bold tracking-tight md:text-3xl">Pendapatan</h1>
      <p class="mt-1 text-sm text-muted-foreground">Gaji dari layanan selesai: gross − admin = net, ditransfer manual oleh admin.</p>
    </div>

    <div class="mb-6 grid gap-4 sm:grid-cols-3">
      <UiCard class="p-5">
        <div class="text-2xl font-bold text-emerald-600">{{ formatRupiah(paidTotal) }}</div>
        <div class="text-sm text-muted-foreground">Total diterima</div>
      </UiCard>
      <UiCard class="p-5">
        <div class="text-2xl font-bold">{{ pendingCount }}</div>
        <div class="text-sm text-muted-foreground">Menunggu / diproses</div>
      </UiCard>
      <UiCard class="p-5">
        <div class="text-sm font-medium">Pastikan rekening di <NuxtLink to="/mitra/profil" class="text-primary hover:underline">Profil</NuxtLink> valid agar TF tidak gagal.</div>
      </UiCard>
    </div>

    <div v-if="pending" class="space-y-2">
      <div class="skeleton-shimmer h-16 rounded-xl" />
      <div class="skeleton-shimmer h-16 rounded-xl" />
    </div>
    <div v-else-if="loadError" class="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
      <p class="text-sm font-medium text-destructive">{{ loadError }}</p>
      <UiButton variant="outline" size="sm" class="mt-3" @click="refresh()">Coba lagi</UiButton>
    </div>
    <div v-else-if="!items.length" class="rounded-xl border p-10 text-center">
      <Wallet class="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
      <p class="font-medium">Belum ada payout</p>
      <p class="mt-1 text-sm text-muted-foreground">Selesaikan kontrak + tunggu konfirmasi pasien, payout layak bayar muncul di sini.</p>
    </div>
    <div v-else class="space-y-3">
      <UiCard v-for="p in items" :key="p.id" class="p-5">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p class="font-bold">{{ formatRupiah(p.netAmount) }} <span class="font-normal text-muted-foreground">bersih (gross {{ formatRupiah(p.grossAmount) }} − admin {{ p.adminFeePercent }}%)</span></p>
            <p class="mt-0.5 text-xs text-muted-foreground">{{ p.reason === 'PASIEN_BATAL' ? 'Kasus pasien batal' : 'Selesai normal' }} · {{ p.bankNameSnap || '-' }} {{ p.bankAccountNoSnap || '' }} · {{ formatDateTime(p.paidAt || p.createdAt) }}</p>
            <a v-if="p.proofTfUrl" :href="uploadUrl(p.proofTfUrl)" target="_blank" rel="noopener" class="text-xs text-primary hover:underline">Bukti transfer admin</a>
            <p v-if="p.status === 'GAGAL'" class="text-xs text-destructive">Gagal — perbaiki rekening di Profil lalu hubungi admin untuk proses ulang.</p>
            <p v-if="p.status === 'DITAHAN'" class="text-xs text-amber-700">Ditahan — menunggu putusan sengketa/pemeriksaan.</p>
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

definePageMeta({ ssr: false, middleware: ['auth-caregiver'] })
useSeoMeta({ title: 'Pendapatan Mitra', robots: 'noindex, nofollow' })

const api = useApi()
const { data, pending, error: fetchError, refresh } = await useAsyncData('mitra-payouts-page', () => api<any[]>('/payouts/me'), { default: () => [] })
const items = computed(() => data.value ?? [])
const loadError = computed(() => (fetchError.value ? getApiErrorMessage(fetchError.value, 'Gagal memuat pendapatan.') : ''))
const paidTotal = computed(() => items.value.filter((p: any) => ['DIBAYARKAN', 'DIBAYARKAN_SEBAGIAN'].includes(p.status)).reduce((s: number, p: any) => s + Number(p.netAmount || 0), 0))
const pendingCount = computed(() => items.value.filter((p: any) => ['LAYAK_BAYAR', 'DIPROSES', 'DITAHAN'].includes(p.status)).length)
</script>
