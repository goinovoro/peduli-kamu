<template>
  <div class="container mx-auto px-4 py-8 pb-24 md:pb-8">
    <div class="mb-6">
      <h1 class="text-2xl font-bold tracking-tight md:text-3xl">Approval Absensi</h1>
      <p class="mt-1 text-sm text-muted-foreground">Setujui / tolak kehadiran mitra per sesi. Yang disetujui masuk rekap jam untuk gaji & refund.</p>
    </div>

    <div v-if="loading" class="space-y-3">
      <div class="skeleton-shimmer h-20 rounded-xl" />
      <div class="skeleton-shimmer h-20 rounded-xl" />
    </div>
    <div v-else-if="loadError" class="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
      <p class="text-sm font-medium text-destructive">{{ loadError }}</p>
      <UiButton variant="outline" size="sm" class="mt-3" @click="load()">Coba lagi</UiButton>
    </div>
    <template v-else>
      <UiCard v-if="pendingCount" class="mb-4 border-amber-200 bg-amber-50/60 p-4">
        <p class="text-sm font-bold text-amber-800">{{ pendingCount }} sesi menunggu approval Anda</p>
        <p class="text-xs text-muted-foreground">Lewat batas tanpa aksi, admin bisa override berdasarkan bukti.</p>
      </UiCard>

      <div v-if="!groups.length" class="rounded-xl border p-10 text-center">
        <Clock class="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
        <p class="font-medium">Tidak ada absensi</p>
        <p class="mt-1 text-sm text-muted-foreground">Absensi muncul setelah mitra clock-in di lokasi layanan.</p>
      </div>

      <div v-for="g in groups" :key="g.contract.id" class="mb-6">
        <div class="mb-2 flex flex-wrap items-center gap-2">
          <p class="font-bold">{{ g.contract.serviceType }} <span class="font-normal text-muted-foreground">· {{ g.contract.caregiver?.user?.name || 'Mitra' }}</span></p>
          <UiBadge :variant="statusVariant(g.contract.status)" class="text-[11px]">{{ statusLabel(g.contract.status) }}</UiBadge>
          <span v-if="g.recap" class="text-xs text-muted-foreground">Approved: {{ Math.floor((g.recap.workedMinutes || 0) / 60) }}j {{ (g.recap.workedMinutes || 0) % 60 }}m</span>
          <NuxtLink :to="`/family/needs/${g.contract.needId}`" class="text-xs text-primary hover:underline">Kelola →</NuxtLink>
        </div>
        <div class="space-y-2">
          <UiCard v-for="a in g.items" :key="a.id" class="p-4" :class="a.status === 'MENUNGGU_APPROVAL_PASIEN' ? 'border-amber-300' : ''">
            <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p class="text-sm font-bold">{{ a.type === 'CLOCK_IN' ? 'Datang' : 'Pulang' }} · {{ formatDateTime(a.serverTime || a.createdAt) }}</p>
                <p class="text-xs text-muted-foreground">{{ a.insideRadius ? 'Dalam radius lokasi' : '⚠ FLAG_LOKASI (di luar radius)' }} · akurasi ±{{ a.accuracyM || '-' }} m</p>
                <div class="mt-1 flex flex-wrap gap-2">
                  <a v-if="a.photoUrl" :href="uploadUrl(a.photoUrl)" target="_blank" rel="noopener" class="text-xs text-primary hover:underline">Lihat foto</a>
                  <span v-if="a.rejectReason" class="text-xs text-destructive">{{ a.rejectReason }}</span>
                </div>
              </div>
              <div class="flex shrink-0 items-center gap-2">
                <UiBadge :variant="statusVariant(a.status)" class="text-[11px]">{{ statusLabel(a.status) }}</UiBadge>
                <template v-if="a.status === 'MENUNGGU_APPROVAL_PASIEN'">
                  <UiButton size="sm" :disabled="actingId === a.id" @click="review(a, true)">Setujui</UiButton>
                  <UiButton size="sm" variant="outline" :disabled="actingId === a.id" @click="askReject(a)">Tolak</UiButton>
                </template>
              </div>
            </div>
          </UiCard>
        </div>
      </div>
    </template>

    <UiDialog :open="rejectOpen" @update:open="rejectOpen = $event">
      <h2 class="text-xl font-bold">Tolak sesi absensi</h2>
      <form class="mt-4 space-y-4" @submit.prevent="submitReject">
      <UiTextarea v-model="rejectReason" label="Alasan" :rows="3" placeholder="cth: datang telat / foto tidak jelas / lokasi tidak cocok" :error="rejectError" />
        <div class="flex gap-3">
          <UiButton variant="outline" type="button" class="flex-1" @click="rejectOpen = false">Batal</UiButton>
          <UiButton type="submit" class="flex-1" variant="destructive">Tolak Sesi</UiButton>
        </div>
      </form>
    </UiDialog>
  </div>
</template>

<script setup lang="ts">
import { Clock } from 'lucide-vue-next'
import { statusLabel, statusVariant, formatDateTime, uploadUrl } from '@/lib/format'
import { required } from '@/lib/validators'
import { getApiErrorMessage } from '@/composables/useApi'

definePageMeta({ ssr: false, middleware: ['auth-family'] })
useSeoMeta({ title: 'Approval Absensi', robots: 'noindex, nofollow' })

const api = useApi()
const toast = useToast()

const loading = ref(true)
const loadError = ref('')
const groups = ref<any[]>([])
const actingId = ref<string | null>(null)
const pendingCount = computed(() => groups.value.flatMap((g: any) => g.items).filter((a: any) => a.status === 'MENUNGGU_APPROVAL_PASIEN').length)

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const contractsList = await api<any[]>('/contracts/me')
    const active = contractsList.filter((c: any) => ['DIBAYAR_DITAHAN', 'SIAP_JALAN', 'BERJALAN', 'MENUNGGU_KONFIRMASI', 'SELESAI'].includes(c.status))
    const result = await Promise.all(active.map(async (c: any) => {
      const [items, recap] = await Promise.all([
        api<any[]>(`/attendance/contract/${c.id}`).catch(() => []),
        api<any>(`/attendance/contract/${c.id}/recap`).catch(() => null),
      ])
      return { contract: c, items, recap }
    }))
    groups.value = result.filter((g: any) => g.items.length)
  } catch (e: any) {
    loadError.value = getApiErrorMessage(e, 'Gagal memuat absensi.')
  } finally {
    loading.value = false
  }
}

async function review(a: any, approve: boolean) {
  actingId.value = a.id
  try {
    await api(`/attendance/${a.id}/review`, { method: 'PATCH', body: { approve } })
    toast.success(approve ? 'Sesi disetujui' : 'Sesi ditolak', approve ? 'Masuk rekap jam kerja.' : 'Tidak dihitung.')
    await load()
  } catch (e: any) {
    toast.error('Gagal', getApiErrorMessage(e))
  } finally {
    actingId.value = null
  }
}

const rejectOpen = ref(false)
const rejectTarget = ref<any>(null)
const rejectReason = ref('')
const rejectError = ref('')
function askReject(a: any) {
  rejectTarget.value = a
  rejectReason.value = ''
  rejectError.value = ''
  rejectOpen.value = true
}
async function submitReject() {
  rejectError.value = ''
  const err = required(rejectReason.value, 'Alasan')
  if (err) {
    rejectError.value = err
    return
  }
  rejectOpen.value = false
  actingId.value = rejectTarget.value.id
  try {
    await api(`/attendance/${rejectTarget.value.id}/review`, { method: 'PATCH', body: { approve: false, reason: rejectReason.value.trim() } })
    toast.success('Sesi ditolak', 'Tidak masuk rekap jam.')
    await load()
  } catch (e: any) {
    toast.error('Gagal', getApiErrorMessage(e))
  } finally {
    actingId.value = null
  }
}

onMounted(load)
</script>
