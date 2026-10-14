<template>
  <div class="p-4 md:p-8 pb-24 md:pb-8">
    <div class="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight md:text-3xl">Sengketa & Laporan</h1>
        <p class="mt-1 text-sm text-muted-foreground">Periksa bukti, minta info, putuskan, dan tutup.</p>
      </div>
      <UiSelect v-model="statusFilter" class="w-auto min-w-48">
        <option value="">Semua status</option>
        <option v-for="s in ['BARU', 'DITINJAU', 'BUTUH_INFO', 'SELESAI', 'DITUTUP']" :key="s" :value="s">{{ statusLabel(s) }}</option>
      </UiSelect>
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
      <Flag class="mx-auto mb-3 h-10 w-10 text-emerald-500" />
      <p class="font-medium">Tidak ada sengketa</p>
      <p class="mt-1 text-sm text-muted-foreground">Laporan yang masuk akan muncul di sini.</p>
    </div>

    <div v-else class="space-y-3">
      <UiCard v-for="d in items" :key="d.id" class="p-5">
        <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <UiBadge variant="outline">{{ categoryLabel(d.category) }}</UiBadge>
              <UiBadge :variant="statusVariant(d.status)">{{ statusLabel(d.status) }}</UiBadge>
            </div>
            <p class="mt-2 text-sm leading-relaxed">{{ d.description }}</p>
            <p class="mt-1 text-xs text-muted-foreground">
              Pelapor: {{ d.reporter?.name || '-' }} · Terlapor: {{ d.reported?.name || '-' }} · Kontrak: {{ d.contractId?.slice(0, 8) }} · {{ formatDateTime(d.createdAt) }}
            </p>
            <p v-if="d.decision" class="mt-1 text-xs"><span class="font-semibold">Putusan:</span> {{ d.decision }}</p>
            <div v-if="expandedId === d.id && d.evidenceUrls" class="mt-2 text-xs">
              <span class="font-semibold">Bukti:</span> {{ d.evidenceUrls }}
            </div>
          </div>
          <div class="flex shrink-0 flex-wrap gap-2">
            <UiButton size="sm" variant="outline" @click="expandedId = expandedId === d.id ? null : d.id">
              {{ expandedId === d.id ? 'Tutup' : 'Detail' }}
            </UiButton>
            <UiButton v-if="!['SELESAI', 'DITUTUP'].includes(d.status)" size="sm" :disabled="actingId === d.id" @click="openHandle(d)">
              Tangani
            </UiButton>
          </div>
        </div>
      </UiCard>
    </div>

    <UiDialog :open="handleOpen" @update:open="handleOpen = $event">
      <h2 class="text-xl font-bold">Tangani sengketa</h2>
      <p class="mt-1 text-sm text-muted-foreground">Status saat ini: {{ selected ? statusLabel(selected.status) : '-' }}. Transisi yang tidak diizinkan akan ditolak backend.</p>
      <form class="mt-5 space-y-4" novalidate @submit.prevent="submitHandle">
        <UiSelect v-model="handleForm.status" label="Status baru" :error="handleFieldErrors.status">
          <option value="" disabled>Pilih status...</option>
          <option v-for="s in nextStatuses" :key="s" :value="s">{{ statusLabel(s) }}</option>
        </UiSelect>
        <UiTextarea v-model="handleForm.decision" label="Putusan / catatan" :rows="3" placeholder="Tulis putusan dan tindak lanjut..." />
        <div v-if="handleError" class="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{{ handleError }}</div>
        <div class="flex gap-3">
          <UiButton variant="outline" type="button" class="flex-1" @click="handleOpen = false">Batal</UiButton>
          <UiButton type="submit" class="flex-1" :disabled="actingId !== null">
            <Loader2 v-if="actingId" class="mr-2 h-4 w-4 animate-spin" />
            Simpan
          </UiButton>
        </div>
      </form>
    </UiDialog>
  </div>
</template>

<script setup lang="ts">
import { Flag, Loader2 } from 'lucide-vue-next'
import { statusLabel, statusVariant, formatDateTime } from '@/lib/format'
import { required } from '@/lib/validators'
import { getApiErrorMessage } from '@/composables/useApi'

definePageMeta({ ssr: false, middleware: ['auth-admin'] })
useSeoMeta({ title: 'Sengketa', robots: 'noindex, nofollow' })

const CATEGORY_LABEL: Record<string, string> = {
  LAYANAN_TIDAK_SESUAI: 'Layanan tidak sesuai',
  PERBEDAAN_INFO: 'Perbedaan info',
  PEMBATALAN: 'Pembatalan',
  PEMBAYARAN: 'Pembayaran',
  PERILAKU: 'Perilaku',
  KOMUNIKASI: 'Komunikasi',
  LAINNYA: 'Lainnya',
}
const categoryLabel = (c: string) => CATEGORY_LABEL[c] ?? c

// Transisi yang diizinkan backend (PATCH /disputes/:id/handle)
const NEXT: Record<string, string[]> = {
  BARU: ['DITINJAU', 'DITUTUP'],
  DITINJAU: ['BUTUH_INFO', 'SELESAI', 'DITUTUP'],
  BUTUH_INFO: ['DITINJAU', 'SELESAI', 'DITUTUP'],
  SELESAI: [],
  DITUTUP: [],
}

const api = useApi()
const toast = useToast()

const statusFilter = ref('')
const { data, pending, error: fetchError, refresh } = await useAsyncData(
  'admin-disputes',
  () => api<any[]>('/disputes', { params: statusFilter.value ? { status: statusFilter.value } : {} }),
  { watch: [statusFilter], default: () => [] },
)

const items = computed(() => data.value ?? [])
const loadError = computed(() => (fetchError.value ? getApiErrorMessage(fetchError.value, 'Gagal memuat sengketa.') : ''))
const expandedId = ref<string | null>(null)
const actingId = ref<string | null>(null)

const selected = ref<any>(null)
const handleOpen = ref(false)
const handleError = ref('')
const handleFieldErrors = ref<Record<string, string>>({})
const handleForm = reactive({ status: '', decision: '' })
const nextStatuses = computed(() => (selected.value ? NEXT[selected.value.status] ?? [] : []))

function openHandle(d: any) {
  selected.value = d
  handleForm.status = ''
  handleForm.decision = ''
  handleError.value = ''
  handleFieldErrors.value = {}
  handleOpen.value = true
}

async function submitHandle() {
  handleError.value = ''
  handleFieldErrors.value = {}
  const statusErr = required(handleForm.status, 'Status baru')
  if (statusErr) {
    handleFieldErrors.value = { status: statusErr }
    return
  }
  actingId.value = selected.value.id
  try {
    // PATCH /disputes/:id/handle {status, decision?}
    await api(`/disputes/${selected.value.id}/handle`, {
      method: 'PATCH',
      body: { status: handleForm.status, decision: handleForm.decision.trim() || undefined },
    })
    handleOpen.value = false
    toast.success('Sengketa diperbarui', `Status → ${statusLabel(handleForm.status)}. Pelapor diberi notifikasi.`)
    await refresh()
  } catch (e: any) {
    handleError.value = getApiErrorMessage(e)
  } finally {
    actingId.value = null
  }
}
</script>
