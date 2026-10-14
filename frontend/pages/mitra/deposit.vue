<template>
  <div class="container mx-auto px-4 py-8 pb-24 md:pb-8">
    <LayoutBackLink to="/mitra/dashboard" label="Dashboard" />
    <div class="mb-6">
      <h1 class="text-2xl font-bold tracking-tight md:text-3xl">Deposit / Commitment Fee</h1>
      <p class="mt-1 text-sm text-muted-foreground">
        Aktivasi keanggotaan Mitra Perawat — bayar deposit agar bisa melihat kebutuhan pasien &amp; mengajukan minat.
        Berlaku 2 bulan, bulan ke-3 terkunci bila belum perpanjang.
      </p>
    </div>

    <!-- Status berjalan -->
    <UiCard v-if="current" class="mb-6 p-5" :class="current.active ? 'border-emerald-200 bg-emerald-50/50' : 'border-amber-200 bg-amber-50/60'">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-start gap-3">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" :class="current.active ? 'bg-emerald-100' : 'bg-amber-100'">
            <ShieldCheck v-if="current.active" class="h-5 w-5 text-emerald-600" />
            <Lock v-else class="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p class="font-bold">
              {{ current.active ? 'Akun Aktif — deposit berlaku' : isExpired ? 'Deposit kedaluwarsa' : 'Deposit belum aktif' }}
              <UiBadge :variant="current.active ? 'success' : 'warning'" class="ml-2">{{ current.active ? 'AKTIF' : isExpired ? 'KEDALUWARSA' : statusLabel(current.latest?.status ?? 'BELUM_BAYAR') }}</UiBadge>
            </p>
            <p class="mt-1 text-sm text-muted-foreground">
              <template v-if="current.active">
                Berlaku sampai {{ formatDate(current.expiresAt) }} · nominal {{ formatRupiah(current.amount) }} / {{ current.durationMonths }} bulan.
              </template>
              <template v-else-if="isExpired">
                Masa berlaku deposit berakhir {{ formatDate(current.expiresAt) }}. Akun Anda terkunci sampai deposit periode baru disetujui Admin.
              </template>
              <template v-else-if="current.latest?.status === 'MENUNGGU_VERIFIKASI'">
                Bukti Anda sudah diterima, menunggu verifikasi Admin. Anda belum bisa melihat kebutuhan sampai disetujui.
              </template>
              <template v-else>
                Sesuai <span class="font-medium">FLOWMITRA-PERAWAT #7–#8</span>: kebutuhan pasien hanya terbuka setelah deposit terverifikasi.
              </template>
            </p>
          </div>
        </div>
        <NuxtLink v-if="current.active" to="/mitra/kebutuhan">
          <UiButton size="sm">Lihat Kebutuhan Pasien</UiButton>
        </NuxtLink>
      </div>
    </UiCard>

    <div v-if="!depositActive" class="mb-6 rounded-xl border border-destructive/30 bg-destructive/5 p-5" role="alert">
      <div class="flex items-start gap-3">
        <TriangleAlert class="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
        <div class="flex-1">
          <p class="font-bold text-destructive">
            {{ isExpired ? 'Deposit kedaluwarsa — bayar deposit periode baru untuk lanjut' : 'Anda harus melakukan deposit terlebih dahulu' }}
          </p>
          <p class="mt-1 text-sm text-muted-foreground">
            Tanpa deposit aktif, daftar pekerjaan pasien <span class="font-medium">tidak ditampilkan</span> dan tombol
            <span class="font-medium">Ajukan Minat</span> diblokir sistem (403: Deposit kedaluwarsa).
            Bayar {{ formatRupiah(depositConfig?.amount) }} via QRIS di bawah lalu unggah bukti.
          </p>
          <a href="#bayar" class="mt-3 inline-flex text-sm font-semibold text-primary hover:underline">Lanjut ke pembayaran deposit ↓</a>
        </div>
      </div>
    </div>

    <div id="bayar" class="grid scroll-mt-24 gap-6 lg:grid-cols-2">
      <!-- Cara bayar -->
      <UiCard class="p-5">
        <h2 class="font-bold">1. Bayar via QRIS perusahaan</h2>
        <p class="mt-1 text-sm text-muted-foreground">Scan QRIS lalu bayar persis sebesar nominal deposit.</p>
        <div class="mt-4 rounded-lg border bg-muted/30 p-4 text-center">
          <p class="text-3xl font-extrabold tracking-tight">{{ formatRupiah(depositConfig?.amount) }}</p>
          <p class="mt-1 text-xs text-muted-foreground">Berlaku {{ depositConfig?.durationMonths ?? 2 }} bulan · metode QRIS_MANUAL</p>
          <img
            v-if="payConfig?.qrisImageUrl"
            :src="payConfig.qrisImageUrl"
            alt="QRIS Peduli Kamu"
            class="mx-auto mt-4 h-56 w-56 rounded-lg border bg-white object-contain p-2"
          />
          <p v-else class="mx-auto mt-4 max-w-xs rounded-lg border border-dashed p-4 text-xs text-muted-foreground">
            Gambar QRIS belum dikonfigurasi admin (<code>QRIS_IMAGE_URL</code>). Bayar ke QRIS resmi Peduli Kamu yang
            diinformasikan Admin, lalu unggah bukti di langkah 2.
          </p>
        </div>
        <ol class="mt-4 list-decimal space-y-1 pl-5 text-[13px] text-muted-foreground">
          <li>Buka e-wallet / m-banking → scan QRIS di atas.</li>
          <li>Bayar <span class="font-medium text-foreground">{{ formatRupiah(depositConfig?.amount) }}</span> (jangan kurang/lebih agar verifikasi cepat).</li>
          <li>Screenshot / simpan bukti bayar (JPG/PNG/PDF, maks 5MB).</li>
        </ol>
      </UiCard>

      <!-- Upload bukti -->
      <UiCard class="p-5">
        <h2 class="font-bold">2. Unggah bukti bayar</h2>
        <p class="mt-1 text-sm text-muted-foreground">Bukti masuk antrian Admin. Status bisa dipantau di riwayat bawah.</p>
        <form class="mt-4 space-y-4" novalidate @submit.prevent="submitDeposit">
          <UiFileInput label="Bukti bayar deposit" placeholder="Klik untuk memilih bukti bayar" :error="proofError" @update:file="proofFile = $event" />
          <div v-if="submitError" class="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{{ submitError }}</div>
          <UiButton type="submit" class="w-full" :disabled="uploading || hasPending">
            <Loader2 v-if="uploading" class="mr-2 h-4 w-4 animate-spin" />
            {{ hasPending ? 'Menunggu verifikasi Admin' : 'Saya Sudah Bayar — Kirim Bukti' }}
          </UiButton>
          <p v-if="hasPending" class="text-center text-xs text-muted-foreground">Sudah ada pembayaran menunggu verifikasi. Tunggu Admin menyetujui sebelum unggah lagi.</p>
        </form>

        <div class="mt-6 border-t pt-4">
          <h3 class="text-sm font-semibold">Ketentuan singkat</h3>
          <ul class="mt-2 list-disc space-y-1 pl-5 text-[13px] text-muted-foreground">
            <li>2 bulan tanpa klien → deposit hangus, akun terkunci bulan ke-3.</li>
            <li>Minimal 1 Deal dibayar → deposit dikembalikan awal bulan ke-3 (TF manual).</li>
            <li>Wanprestasi → akun dibekukan + deposit hangus + refund pasien per jam.</li>
          </ul>
        </div>
      </UiCard>
    </div>

    <!-- Riwayat -->
    <UiCard class="mt-6 p-5">
      <div class="mb-3 flex items-center justify-between">
        <h2 class="font-bold">Riwayat deposit saya</h2>
        <UiButton variant="outline" size="sm" @click="refreshAll()">Muat ulang</UiButton>
      </div>
      <div v-if="historyPending" class="space-y-2">
        <div class="skeleton-shimmer h-12 rounded-lg" />
        <div class="skeleton-shimmer h-12 rounded-lg" />
      </div>
      <p v-else-if="!history.length" class="rounded-lg border p-6 text-center text-sm text-muted-foreground">Belum ada riwayat deposit.</p>
      <div v-else class="space-y-2">
        <div v-for="d in history" :key="d.id" class="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p class="text-sm font-bold">{{ formatRupiah(d.amount) }} <span class="font-normal text-muted-foreground">· {{ formatDateTime(d.createdAt ?? d.submittedAt) }}</span></p>
            <p class="mt-0.5 text-xs text-muted-foreground">Periode: {{ formatDate(d.periodStart) }} → {{ formatDate(d.periodEnd) }}</p>
          </div>
          <UiBadge :variant="statusVariant(d.status)">{{ statusLabel(d.status) }}</UiBadge>
        </div>
      </div>
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import { ShieldCheck, Lock, TriangleAlert, Loader2 } from 'lucide-vue-next'
import { statusLabel, statusVariant, formatRupiah, formatDate, formatDateTime } from '@/lib/format'
import { validateUploadFile } from '@/lib/validators'
import { getApiErrorMessage } from '@/composables/useApi'

definePageMeta({ ssr: false, middleware: ['auth-caregiver'] })
useSeoMeta({ title: 'Deposit Mitra', robots: 'noindex, nofollow' })

const api = useApi()
const toast = useToast()

const { data: depositConfig } = await useAsyncData('deposit-config', () => api<any>('/deposits/config'), { default: () => null })
const { data: payConfig } = await useAsyncData('pay-config', () => api<any>('/payments/config').catch(() => null), { default: () => null })
const { data: current, refresh: refreshCurrent } = await useAsyncData('deposit-current', () => api<any>('/deposits/current'), { default: () => null })
const { data: historyData, pending: historyPending, refresh: refreshHistory } = await useAsyncData('deposit-mine', () => api<any[]>('/deposits/me'), { default: () => [] })

const history = computed(() => historyData.value ?? [])
const depositActive = computed(() => !!current.value?.active)
const isExpired = computed(() => !!current.value?.expired)
const hasPending = computed(() => current.value?.latest?.status === 'MENUNGGU_VERIFIKASI' || history.value.some((d: any) => d.status === 'MENUNGGU_VERIFIKASI'))

const proofFile = ref<File | null>(null)
const proofError = ref('')
const submitError = ref('')
const uploading = ref(false)

function refreshAll() {
  refreshCurrent()
  refreshHistory()
}

async function submitDeposit() {
  proofError.value = ''
  submitError.value = ''
  const err = validateUploadFile(proofFile.value, { field: 'Bukti bayar' })
  if (err) {
    proofError.value = err
    return
  }
  uploading.value = true
  try {
    const fd = new FormData()
    fd.append('proof', proofFile.value!)
    await api('/deposits', { method: 'POST', body: fd })
    toast.success('Bukti terkirim', 'Menunggu verifikasi Admin. Anda akan diberi tahu saat deposit aktif.')
    proofFile.value = null
    await refreshAll()
  } catch (e: any) {
    const msg = getApiErrorMessage(e, 'Gagal mengunggah bukti.')
    submitError.value = msg
    toast.error('Gagal mengunggah', msg)
  } finally {
    uploading.value = false
  }
}
</script>
