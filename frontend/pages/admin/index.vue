<template>
  <div class="p-4 md:p-8 pb-24 md:pb-8">
    <div class="mb-6">
      <h1 class="text-2xl font-bold tracking-tight md:text-3xl">Dashboard Admin</h1>
      <p class="mt-1 text-sm text-muted-foreground">Gambaran operasional platform Peduli Kamu.</p>
    </div>

    <div v-if="pending" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <UiCard v-for="i in 8" :key="i" class="p-5">
        <div class="skeleton-shimmer h-4 w-1/2 rounded" />
        <div class="skeleton-shimmer mt-2 h-7 w-1/3 rounded" />
      </UiCard>
    </div>

    <div v-else-if="loadError" class="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
      <p class="text-sm font-medium text-destructive">{{ loadError }}</p>
      <UiButton variant="outline" size="sm" class="mt-3" @click="refresh()">Coba lagi</UiButton>
    </div>

    <template v-else-if="stats">
      <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Antrian butuh tindakan</p>
      <div class="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <NuxtLink to="/admin/verifikasi">
          <UiCard class="card-lift p-5">
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                <ShieldCheck class="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <div class="text-2xl font-bold">{{ stats.antrian?.verifikasiMitra ?? 0 }}</div>
                <div class="text-sm text-muted-foreground">Verifikasi mitra</div>
              </div>
            </div>
          </UiCard>
        </NuxtLink>
        <NuxtLink to="/admin/uang">
          <UiCard class="card-lift p-5">
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100">
                <Wallet class="h-5 w-5 text-sky-600" />
              </div>
              <div>
                <div class="text-2xl font-bold">{{ (stats.antrian?.pembayaran ?? 0) + (stats.antrian?.payoutLayak ?? 0) + (stats.antrian?.deposit ?? 0) }}</div>
                <div class="text-sm text-muted-foreground">Antrian uang</div>
              </div>
            </div>
          </UiCard>
        </NuxtLink>
        <NuxtLink to="/admin/sengketa">
          <UiCard class="card-lift p-5">
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                <Flag class="h-5 w-5 text-destructive" />
              </div>
              <div>
                <div class="text-2xl font-bold">{{ stats.antrian?.sengketaTerbuka ?? 0 }}</div>
                <div class="text-sm text-muted-foreground">Sengketa terbuka</div>
              </div>
            </div>
          </UiCard>
        </NuxtLink>
        <UiCard class="p-5">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Lock class="h-5 w-5 text-primary" />
            </div>
            <div>
              <div class="text-2xl font-bold">{{ formatRupiah(stats.escrow?.totalDitahan ?? 0) }}</div>
              <div class="text-sm text-muted-foreground">Dana ditahan ({{ stats.escrow?.kontrak ?? 0 }} kontrak)</div>
            </div>
          </div>
        </UiCard>
      </div>

      <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Operasional</p>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <UiCard class="p-5">
          <div class="text-2xl font-bold">{{ stats.pengguna?.pasien ?? 0 }}</div>
          <div class="text-sm text-muted-foreground">Pasien terdaftar</div>
        </UiCard>
        <UiCard class="p-5">
          <div class="text-2xl font-bold">{{ stats.pengguna?.mitra ?? 0 }}</div>
          <div class="text-sm text-muted-foreground">Mitra terdaftar</div>
        </UiCard>
        <UiCard class="p-5">
          <div class="text-2xl font-bold">{{ stats.operasional?.needAktif ?? 0 }}</div>
          <div class="text-sm text-muted-foreground">Kebutuhan aktif</div>
        </UiCard>
        <UiCard class="p-5">
          <div class="text-2xl font-bold">{{ stats.operasional?.minatMenunggu ?? 0 }}</div>
          <div class="text-sm text-muted-foreground">Minat menunggu respon</div>
        </UiCard>
        <UiCard class="p-5">
          <div class="text-2xl font-bold">{{ stats.operasional?.layananBerjalan ?? 0 }}</div>
          <div class="text-sm text-muted-foreground">Layanan berjalan</div>
        </UiCard>
        <UiCard class="p-5">
          <div class="text-2xl font-bold">{{ stats.operasional?.menungguKonfirmasi ?? 0 }}</div>
          <div class="text-sm text-muted-foreground">Menunggu konfirmasi</div>
        </UiCard>
        <UiCard class="p-5">
          <div class="text-2xl font-bold">{{ stats.operasional?.layananSelesai ?? 0 }}</div>
          <div class="text-sm text-muted-foreground">Layanan selesai</div>
        </UiCard>
        <UiCard class="p-5">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-2xl font-bold">{{ stats.antrian?.dokumen ?? 0 }}</div>
              <div class="text-sm text-muted-foreground">Dokumen menunggu</div>
            </div>
            <NuxtLink to="/admin/verifikasi" class="text-xs font-medium text-primary hover:underline">Periksa →</NuxtLink>
          </div>
        </UiCard>
        <NuxtLink to="/admin/monitor">
          <UiCard class="card-lift p-5">
            <div class="text-sm font-bold text-primary">Monitor Operasional →</div>
            <div class="mt-1 text-sm text-muted-foreground">Kebutuhan, kontrak, absensi + wanprestasi & override</div>
          </UiCard>
        </NuxtLink>
        <NuxtLink to="/admin/review">
          <UiCard class="card-lift p-5">
            <div class="text-sm font-bold text-primary">Moderasi Review →</div>
            <div class="mt-1 text-sm text-muted-foreground">Sembunyikan review melanggar</div>
          </UiCard>
        </NuxtLink>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ShieldCheck, Wallet, Flag, Lock } from 'lucide-vue-next'
import { formatRupiah } from '@/lib/format'
import { getApiErrorMessage } from '@/composables/useApi'

definePageMeta({ ssr: false, middleware: ['auth-admin'] })
useSeoMeta({ title: 'Dashboard Admin', robots: 'noindex, nofollow' })

const api = useApi()

const { data: stats, pending, error: fetchError, refresh } = await useAsyncData('admin-stats', () =>
  api<any>('/admin/stats'),
)

const loadError = computed(() => (fetchError.value ? getApiErrorMessage(fetchError.value, 'Gagal memuat statistik.') : ''))
</script>
