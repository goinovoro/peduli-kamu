<template>
  <div class="container mx-auto px-4 py-8 pb-24 md:pb-8">
    <LayoutBackLink to="/mitra/dashboard" label="Dashboard" />
    <div class="mb-6">
      <h1 class="text-2xl font-bold tracking-tight md:text-3xl">Absensi</h1>
      <p class="mt-1 text-sm text-muted-foreground">Clock-in/out foto live + GPS di lokasi. Durasi dihitung sistem, disetujui pasien.</p>
    </div>

    <UiCard class="mb-4 p-4">
      <div class="space-y-2">
        <UiLabel>Pilih kontrak / layanan</UiLabel>
        <UiSelect v-model="contractId">
          <option value="" disabled>Pilih layanan...</option>
          <option v-for="c in contracts" :key="c.id" :value="c.id">{{ c.serviceType }} · {{ formatRupiah(c.totalCost) }} · {{ statusLabel(c.status) }}</option>
        </UiSelect>
      </div>
      <div v-if="!contractsLoading && !contracts.length" class="mt-3 flex flex-col items-start gap-2 rounded-lg border border-dashed p-4 sm:flex-row sm:items-center sm:justify-between">
        <p class="text-sm text-muted-foreground">Belum ada kontrak. Absensi tersedia setelah minat Anda diterima pasien dan kontrak dibuat.</p>
        <NuxtLink to="/mitra/kebutuhan"><UiButton size="sm" variant="outline">Cari Kerja</UiButton></NuxtLink>
      </div>
    </UiCard>

    <template v-if="contract">
      <div class="mb-4 flex flex-wrap items-center gap-2">
        <UiBadge :variant="statusVariant(contract.status)">{{ statusLabel(contract.status) }}</UiBadge>
        <span v-if="recap" class="text-sm text-muted-foreground">Approved: <b>{{ Math.floor((recap.workedMinutes || 0) / 60) }}j {{ (recap.workedMinutes || 0) % 60 }}m</b> ({{ recap.approvedSessions || 0 }} sesi)</span>
        <span class="text-sm text-muted-foreground">Sesi terbuka: <b>{{ hasOpen ? 'YA — clock-out dulu' : 'tidak ada' }}</b></span>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <UiCard class="space-y-2 p-4">
          <p class="text-sm font-bold">Clock-In (datang)</p>
          <input type="file" accept="image/jpeg,image/png" capture="environment" class="block w-full text-xs" @change="onPhoto($event, 'in')" />
          <UiButton size="sm" :disabled="clockBusy || hasOpen || !!clockInToday" @click="doClock('in')">
            <Loader2 v-if="clockBusy" class="mr-1 h-3.5 w-3.5 animate-spin" />
            Clock-In + GPS
          </UiButton>
        </UiCard>
        <UiCard class="space-y-2 p-4">
          <p class="text-sm font-bold">Clock-Out (pulang)</p>
          <input type="file" accept="image/jpeg,image/png" capture="environment" class="block w-full text-xs" @change="onPhoto($event, 'out')" />
          <UiButton size="sm" :disabled="clockBusy || !hasOpen || !!clockOutToday" @click="doClock('out')">
            <Loader2 v-if="clockBusy" class="mr-1 h-3.5 w-3.5 animate-spin" />
            Clock-Out + GPS
          </UiButton>
        </UiCard>
      </div>
      <p class="mt-2 text-xs text-muted-foreground">Wajib kamera (bukan galeri), JPG/PNG ≤ 5MB, GPS ± &lt; 100 m.
        <span v-if="coord">📍 {{ coord.lat.toFixed(6) }}, {{ coord.lng.toFixed(6) }} (±{{ coord.accuracy }} m)</span>
      </p>
      <div class="mt-3 rounded-lg border bg-muted/30 p-3 text-sm">
        <p>
          <span class="text-muted-foreground">Hari ini:</span>
          Clock-in <b>{{ clockInToday ? timeOf(clockInToday) : 'belum' }}</b>
          · Clock-out <b>{{ clockOutToday ? timeOf(clockOutToday) : 'belum' }}</b>
        </p>
        <p class="mt-1 text-xs text-muted-foreground">Satu clock-in dan satu clock-out per hari untuk layanan ini.</p>
      </div>
      <p v-if="clockError" class="mt-2 text-sm font-medium text-destructive">{{ clockError }}</p>

      <div class="mb-2 mt-6 flex items-center justify-between">
        <h2 class="font-bold">Riwayat ({{ items.length }})</h2>
        <UiButton size="sm" variant="outline" @click="loadAttendance()">Muat ulang</UiButton>
      </div>
      <div v-if="!items.length" class="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">Belum ada absensi. Clock-in saat tiba di lokasi.</div>
      <div v-else class="space-y-2">
        <UiCard v-for="a in items" :key="a.id" class="p-4">
          <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p class="text-sm font-bold">{{ a.type === 'CLOCK_IN' ? 'Datang' : 'Pulang' }} · {{ formatDateTime(a.serverTime || a.createdAt) }}</p>
              <p class="text-xs text-muted-foreground">{{ a.insideRadius ? 'Dalam radius' : '⚠ FLAG_LOKASI' }} · ±{{ a.accuracyM || '-' }} m</p>
              <a v-if="a.photoUrl" :href="uploadUrl(a.photoUrl)" target="_blank" rel="noopener" class="text-xs text-primary hover:underline">Foto</a>
              <span v-if="a.rejectReason" class="ml-2 text-xs text-destructive">{{ a.rejectReason }}</span>
            </div>
            <UiBadge :variant="statusVariant(a.status)" class="w-fit text-[11px]">{{ statusLabel(a.status) }}</UiBadge>
          </div>
        </UiCard>
      </div>

      <div class="mt-4 flex flex-wrap gap-2">
        <UiButton v-if="contract.status === 'SIAP_JALAN'" :disabled="acting" @click="start()">Mulai Layanan</UiButton>
        <UiButton v-if="contract.status === 'BERJALAN'" :disabled="acting" @click="finish()">Selesaikan Layanan</UiButton>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'
import { statusLabel, statusVariant, formatRupiah, formatDateTime, uploadUrl } from '@/lib/format'
import { getApiErrorMessage } from '@/composables/useApi'

definePageMeta({ ssr: false, middleware: ['auth-caregiver'] })
useSeoMeta({ title: 'Absensi Mitra', robots: 'noindex, nofollow' })

const api = useApi()
const toast = useToast()
const route = useRoute()

const contractId = ref('')
const contracts = ref<any[]>([])
const contractsLoading = ref(true)
const contract = computed(() => contracts.value.find((c: any) => c.id === contractId.value) ?? null)
const items = ref<any[]>([])
const recap = ref<any>(null)
const coord = ref<{ lat: number; lng: number; accuracy: number } | null>(null)
const photos = ref<{ in: File | null; out: File | null }>({ in: null, out: null })
const clockBusy = ref(false)
const clockError = ref('')
const locating = ref(false)
const acting = ref(false)

// Batas "per hari" memakai tanggal lokal WIB, sama dengan backend.
const WORK_TZ = 'Asia/Jakarta'
const dayKey = (value: string | Date) => new Intl.DateTimeFormat('en-CA', { timeZone: WORK_TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value))
const timeOf = (a: any) => new Date(a.serverTime || a.createdAt).toLocaleTimeString('id-ID', { timeZone: WORK_TZ, hour: '2-digit', minute: '2-digit' })
const todayRecords = computed(() => {
  const today = dayKey(new Date())
  return items.value.filter((a: any) => dayKey(a.serverTime || a.createdAt) === today)
})
const clockInToday = computed(() => todayRecords.value.find((a: any) => a.type === 'CLOCK_IN') ?? null)
const clockOutToday = computed(() => todayRecords.value.find((a: any) => a.type === 'CLOCK_OUT') ?? null)

const hasOpen = computed(() => {
  const ins = items.value.filter((a: any) => a.type === 'CLOCK_IN').length
  const outs = items.value.filter((a: any) => a.type === 'CLOCK_OUT').length
  return ins > outs
})

async function loadContracts() {
  contractsLoading.value = true
  try {
    contracts.value = await api<any[]>('/contracts/me')
    // Prioritas: kontrak dari tautan (?kontrak=) → kontrak aktif → kontrak pertama.
    const requested = typeof route.query.kontrak === 'string' ? route.query.kontrak : null
    const pick =
      contracts.value.find((c: any) => c.id === requested) ??
      contracts.value.find((c: any) => ['SIAP_JALAN', 'BERJALAN'].includes(c.status)) ??
      contracts.value[0]
    if (pick) contractId.value = pick.id
  } catch {
    contracts.value = []
  } finally {
    contractsLoading.value = false
  }
}
async function loadAttendance() {
  if (!contractId.value) return
  try {
    items.value = await api<any[]>(`/attendance/contract/${contractId.value}`)
    recap.value = await api<any>(`/attendance/contract/${contractId.value}/recap`).catch(() => null)
  } catch {
    items.value = []
  }
}
watch(contractId, loadAttendance)

function onPhoto(e: Event, kind: 'in' | 'out') {
  photos.value[kind] = (e.target as HTMLInputElement).files?.[0] ?? null
}
function locate() {
  locating.value = true
  if (!('geolocation' in navigator)) {
    toast.error('GPS tidak tersedia', 'Aktifkan GPS di perangkat Anda.')
    locating.value = false
    return Promise.resolve(false)
  }
  return new Promise<boolean>((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        coord.value = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: Math.round(pos.coords.accuracy) }
        locating.value = false
        if ((pos.coords.accuracy || 999) > 100) toast.warning('Akurasi GPS jelek', `±${Math.round(pos.coords.accuracy)} m — ulangi.`)
        resolve(true)
      },
      (err) => {
        locating.value = false
        toast.error('Gagal GPS', err.message || 'Izin lokasi ditolak.')
        resolve(false)
      },
      { enableHighAccuracy: true, timeout: 15000 },
    )
  })
}
async function doClock(kind: 'in' | 'out') {
  clockError.value = ''
  const photo = photos.value[kind]
  if (!photo) {
    clockError.value = 'Foto live wajib (kamera, bukan galeri).'
    return
  }
  if (!['image/jpeg', 'image/png'].includes(photo.type)) {
    clockError.value = 'Foto harus JPG/PNG.'
    return
  }
  if (photo.size > 5 * 1024 * 1024) {
    clockError.value = 'Foto maksimal 5MB.'
    return
  }
  const ok = await locate()
  if (!ok || !coord.value) {
    clockError.value = 'GPS gagal — ulangi.'
    return
  }
  clockBusy.value = true
  try {
    const fd = new FormData()
    fd.append('photo', photo)
    fd.append('contractId', contractId.value)
    fd.append('lat', String(coord.value.lat))
    fd.append('lng', String(coord.value.lng))
    fd.append('accuracyM', String(coord.value.accuracy))
    await api(kind === 'in' ? '/attendance/clock-in' : '/attendance/clock-out', { method: 'POST', body: fd })
    toast.success(kind === 'in' ? 'Clock-in tercatat' : 'Clock-out tercatat', 'Menunggu approval pasien.')
    photos.value[kind] = null
    await loadAttendance()
  } catch (e: any) {
    clockError.value = getApiErrorMessage(e, 'Gagal clock.')
  } finally {
    clockBusy.value = false
  }
}
async function start() {
  acting.value = true
  try {
    await api(`/contracts/${contractId.value}/start`, { method: 'POST' })
    toast.success('Layanan dimulai', 'Jangan lupa clock-in.')
    await loadContracts()
  } catch (e: any) {
    toast.error('Gagal', getApiErrorMessage(e))
  } finally {
    acting.value = false
  }
}
async function finish() {
  acting.value = true
  try {
    await api(`/contracts/${contractId.value}/finish`, { method: 'POST' })
    toast.success('Menunggu konfirmasi pasien', 'Jam ditarik dari rekap approved.')
    await loadContracts()
  } catch (e: any) {
    toast.error('Gagal', getApiErrorMessage(e, 'Pastikan ada absensi yang sudah di-approve.'))
  } finally {
    acting.value = false
  }
}

onMounted(async () => {
  await loadContracts()
  await loadAttendance()
})
</script>
