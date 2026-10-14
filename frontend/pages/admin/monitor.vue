<template>
  <div class="p-4 md:p-8 pb-24 md:pb-8">
    <div class="mb-6">
      <h1 class="text-2xl font-bold tracking-tight md:text-3xl">Monitor Operasional</h1>
      <p class="mt-1 text-sm text-muted-foreground">Telusur Pasien → Perawat → Layanan → Pembayaran (N-03). Aksi kritis tercatat atas nama Anda.</p>
    </div>

    <UiTabsList class="w-full">
      <UiTabsTrigger value="needs" :model-value="tab" @update:model-value="tab = $event">
        <ClipboardList class="mr-2 h-4 w-4" />
        Kebutuhan
      </UiTabsTrigger>
      <UiTabsTrigger value="contracts" :model-value="tab" @update:model-value="tab = $event">
        <Handshake class="mr-2 h-4 w-4" />
        Kontrak & Layanan
      </UiTabsTrigger>
      <UiTabsTrigger value="attendance" :model-value="tab" @update:model-value="tab = $event">
        <Clock class="mr-2 h-4 w-4" />
        Absensi
      </UiTabsTrigger>
    </UiTabsList>

    <!-- KEBUTUHAN -->
    <UiTabsContent :value="'needs'" :model-value="tab">
      <div class="mb-4 flex items-center gap-3">
        <UiSelect v-model="needFilter" class="w-auto min-w-48">
          <option value="">Semua status</option>
          <option v-for="s in ['DRAFT', 'DIPUBLIKASIKAN', 'DALAM_PEMBAHASAN', 'DEAL', 'MENUNGGU_PEMBAYARAN', 'SIAP_JALAN', 'BERJALAN', 'SELESAI', 'DIBATALKAN', 'SENGKETA']" :key="s" :value="s">{{ statusLabel(s) }}</option>
        </UiSelect>
      </div>
      <div class="space-y-3">
        <UiCard v-for="n in needs" :key="n.id" class="p-4">
          <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p class="font-bold">{{ n.serviceType }} <span class="font-normal text-muted-foreground">· {{ n.patientUser?.name || '-' }} ({{ n.patientUser?.email || '-' }})</span></p>
              <p class="mt-0.5 text-xs text-muted-foreground">{{ n.locationText }} · {{ n.totalHours }} jam · {{ n._count?.interests || 0 }} minat · kontrak: {{ n.contract?.id?.slice(0, 8) || '-' }}</p>
              <div class="mt-2 flex flex-wrap gap-2">
                <UiBadge :variant="statusVariant(n.status)">{{ statusLabel(n.status) }}</UiBadge>
              </div>
            </div>
          </div>
        </UiCard>
        <p v-if="!needPending && !needs.length" class="rounded-xl border p-8 text-center text-sm text-muted-foreground">Tidak ada kebutuhan pada filter ini.</p>
      </div>
    </UiTabsContent>

    <!-- KONTRAK -->
    <UiTabsContent :value="'contracts'" :model-value="tab">
      <div class="mb-4 flex items-center gap-3">
        <UiSelect v-model="contractFilter" class="w-auto min-w-48">
          <option value="">Semua status</option>
          <option v-for="s in ['DEAL_MENUNGGU_BAYAR', 'DIBAYAR_DITAHAN', 'SIAP_JALAN', 'BERJALAN', 'MENUNGGU_KONFIRMASI', 'SELESAI', 'DIBATALKAN_PASIEN', 'DIBATALKAN_MITRA', 'SENGKETA']" :key="s" :value="s">{{ statusLabel(s) }}</option>
        </UiSelect>
      </div>
      <div class="space-y-3">
        <UiCard v-for="c in contracts" :key="c.id" class="p-4">
          <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p class="font-bold">{{ c.serviceType }} · {{ formatRupiah(c.totalCost) }} <span class="font-normal text-muted-foreground">({{ c.totalHours }} jam × {{ formatRupiah(c.hourlyRate) }})</span></p>
              <p class="mt-0.5 text-xs text-muted-foreground">Mitra: {{ c.caregiver?.user?.name || '-' }} · Bayar: {{ c.payments?.map((p: any) => statusLabel(p.status)).join(', ') || '-' }} · Payout: {{ c.payout ? `${formatRupiah(c.payout.netAmount)} (${statusLabel(c.payout.status)})` : '-' }}</p>
              <div class="mt-2 flex flex-wrap gap-2">
                <UiBadge :variant="statusVariant(c.status)">{{ statusLabel(c.status) }}</UiBadge>
              </div>
            </div>
            <div class="flex shrink-0 flex-wrap gap-2">
              <UiButton v-if="c.status === 'MENUNGGU_KONFIRMASI'" size="sm" :disabled="actingId === c.id" @click="confirmOverride(c)">Override Konfirmasi</UiButton>
              <UiButton v-if="['DIBAYAR_DITAHAN', 'SIAP_JALAN', 'BERJALAN'].includes(c.status)" size="sm" variant="destructive" :disabled="actingId === c.id" @click="openMisconduct(c)">Wanprestasi</UiButton>
            </div>
          </div>
        </UiCard>
        <p v-if="!contractPending && !contracts.length" class="rounded-xl border p-8 text-center text-sm text-muted-foreground">Tidak ada kontrak pada filter ini.</p>
      </div>
    </UiTabsContent>

    <!-- ABSENSI -->
    <UiTabsContent :value="'attendance'" :model-value="tab">
      <div class="mb-4 flex flex-wrap items-center gap-3">
        <UiSelect v-model="attFilter" class="w-auto min-w-48">
          <option value="">Semua status</option>
          <option v-for="s in ['MENUNGGU_APPROVAL_PASIEN', 'DISETUJUI', 'DITOLAK', 'DISETUJUI_ADMIN', 'DITOLAK_ADMIN']" :key="s" :value="s">{{ statusLabel(s) }}</option>
        </UiSelect>
        <UiCheckbox v-model="flagOnly">Hanya FLAG_LOKASI (di luar radius)</UiCheckbox>
      </div>
      <div class="space-y-2">
        <UiCard v-for="a in attendances" :key="a.id" class="p-4">
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p class="text-sm font-bold">{{ a.type === 'CLOCK_IN' ? 'Datang' : 'Pulang' }} · {{ a.caregiver?.user?.name || '-' }} · {{ formatDateTime(a.serverTime || a.createdAt) }}</p>
              <p class="text-xs text-muted-foreground">Kontrak: {{ a.contract?.serviceType || a.contractId?.slice(0, 8) }} · {{ a.insideRadius ? 'Dalam radius' : 'FLAG_LOKASI' }} · ±{{ a.accuracyM || '-' }} m</p>
              <div class="mt-1 flex flex-wrap gap-2">
                <UiBadge :variant="statusVariant(a.status)" class="text-[11px]">{{ statusLabel(a.status) }}</UiBadge>
                <a v-if="a.photoUrl" :href="uploadUrl(a.photoUrl)" target="_blank" rel="noopener" class="text-xs text-primary hover:underline">Foto</a>
              </div>
            </div>
            <div v-if="['MENUNGGU_APPROVAL_PASIEN', 'DITOLAK', 'DISETUJUI'].includes(a.status)" class="flex shrink-0 gap-2">
              <UiButton size="sm" :disabled="actingId === a.id" @click="overrideAtt(a, true)">Setujui Admin</UiButton>
              <UiButton size="sm" variant="outline" :disabled="actingId === a.id" @click="overrideAtt(a, false)">Tolak Admin</UiButton>
            </div>
          </div>
        </UiCard>
        <p v-if="!attPending && !attendances.length" class="rounded-xl border p-8 text-center text-sm text-muted-foreground">Tidak ada absensi pada filter ini.</p>
      </div>
    </UiTabsContent>

    <!-- Dialog wanprestasi (K-02) -->
    <UiDialog :open="misOpen" @update:open="misOpen = $event">
      <h2 class="text-xl font-bold">Putusan Wanprestasi</h2>
      <p class="mt-1 text-sm text-muted-foreground">Akun dibekukan s.d. periode deposit berikut + deposit hangus + refund pasien = missingHours × hourlyRate.</p>
      <form class="mt-4 space-y-4" @submit.prevent="submitMisconduct">
        <UiInput v-model="misForm.workedHours" label="Jam valid dikerjakan (0..total)" type="number" :error="misError" />
        <p v-if="misTarget" class="rounded-lg bg-muted/40 p-3 text-xs">Kontrak {{ misTarget.totalHours }} jam × {{ formatRupiah(misTarget.hourlyRate) }} → refund dihitung server dari rekap approved + input ini.</p>
        <UiTextarea v-model="misForm.description" label="Keterangan putusan" :rows="3" placeholder="Bukti chat/absensi/laporan..." />
        <div class="flex gap-3">
          <UiButton variant="outline" type="button" class="flex-1" @click="misOpen = false">Batal</UiButton>
          <UiButton type="submit" class="flex-1" variant="destructive" :disabled="actingId !== null">Bekukan + Hanguskan</UiButton>
        </div>
      </form>
    </UiDialog>
  </div>
</template>

<script setup lang="ts">
import { ClipboardList, Handshake, Clock, Loader2 } from 'lucide-vue-next'
import { statusLabel, statusVariant, formatRupiah, formatDateTime, uploadUrl } from '@/lib/format'
import { validatePositiveInt } from '@/lib/validators'
import { getApiErrorMessage } from '@/composables/useApi'

definePageMeta({ ssr: false, middleware: ['auth-admin'] })
useSeoMeta({ title: 'Monitor Operasional', robots: 'noindex, nofollow' })

const api = useApi()
const toast = useToast()
const tab = ref('needs')
const actingId = ref<string | null>(null)

// --- Needs ---
const needFilter = ref('')
const { data: needData, pending: needPending, refresh: refreshNeeds } = await useAsyncData(
  'admin-mon-needs',
  () => api<any[]>('/admin/needs', { params: needFilter.value ? { status: needFilter.value } : {} }),
  { watch: [needFilter], default: () => [] },
)
const needs = computed(() => needData.value ?? [])

// --- Contracts ---
const contractFilter = ref('')
const { data: contractData, pending: contractPending, refresh: refreshContracts } = await useAsyncData(
  'admin-mon-contracts',
  () => api<any[]>('/admin/contracts', { params: contractFilter.value ? { status: contractFilter.value } : {} }),
  { watch: [contractFilter], default: () => [] },
)
const contracts = computed(() => contractData.value ?? [])

async function confirmOverride(c: any) {
  actingId.value = c.id
  try {
    await api(`/contracts/${c.id}/confirm-override`, { method: 'POST' })
    toast.success('Override berhasil', 'Kontrak → SELESAI + payout LAYAK_BAYAR.')
    await refreshContracts()
  } catch (e: any) { toast.error('Gagal', getApiErrorMessage(e)) } finally { actingId.value = null }
}

// --- Misconduct (K-02) ---
const misOpen = ref(false)
const misTarget = ref<any>(null)
const misError = ref('')
const misForm = reactive({ workedHours: '', description: '' })
function openMisconduct(c: any) {
  misTarget.value = c
  misForm.workedHours = ''
  misForm.description = ''
  misError.value = ''
  misOpen.value = true
}
async function submitMisconduct() {
  misError.value = ''
  const err = validatePositiveInt(misForm.workedHours || '0', 'Jam valid')
  // 0 jam valid diperbolehkan (kabur total) — validasi manual:
  const n = Number(misForm.workedHours)
  if (misForm.workedHours === '' || !Number.isInteger(n) || n < 0 || n > (misTarget.value?.totalHours || 0)) {
    misError.value = `Isi 0..${misTarget.value?.totalHours || 0} jam.`
    return
  }
  if (err && n !== 0) { misError.value = err; return }
  actingId.value = misTarget.value.id
  try {
    const res = await api<any>(`/contracts/${misTarget.value.id}/misconduct`, { method: 'POST', body: { workedHours: n, description: misForm.description || undefined } })
    toast.success('Putusan diterapkan', `Refund pasien ${formatRupiah(res?.refundAmount || 0)}. Akun dibekukan + deposit hangus.`)
    misOpen.value = false
    await refreshContracts()
  } catch (e: any) { misError.value = getApiErrorMessage(e) } finally { actingId.value = null }
}

// --- Attendance ---
const attFilter = ref('')
const flagOnly = ref(false)
const { data: attData, pending: attPending, refresh: refreshAtt } = await useAsyncData(
  'admin-mon-att',
  () => api<any[]>('/admin/attendances', { params: { ...(attFilter.value ? { status: attFilter.value } : {}), ...(flagOnly.value ? { flag: 'lokasi' } : {}) } }),
  { watch: [attFilter, flagOnly], default: () => [] },
)
const attendances = computed(() => attData.value ?? [])

async function overrideAtt(a: any, approve: boolean) {
  actingId.value = a.id
  try {
    await api(`/attendance/${a.id}/override`, { method: 'PATCH', body: { approve } })
    toast.success(approve ? 'Disetujui admin' : 'Ditolak admin', 'Masuk rekap jika disetujui.')
    await refreshAtt()
  } catch (e: any) { toast.error('Gagal', getApiErrorMessage(e)) } finally { actingId.value = null }
}
</script>
