<template>
  <div class="p-4 md:p-8 pb-24 md:pb-8">
    <div class="mb-6">
      <h1 class="text-2xl font-bold tracking-tight md:text-3xl">Verifikasi Mitra</h1>
      <p class="mt-1 text-sm text-muted-foreground">Periksa profil profesional + dokumen, lalu setujui / tolak / minta perbaikan.</p>
    </div>

    <div v-if="pending" class="space-y-3">
      <UiCard v-for="i in 3" :key="i" class="p-5">
        <div class="skeleton-shimmer h-4 w-1/2 rounded" />
        <div class="skeleton-shimmer mt-2 h-3 w-1/3 rounded" />
      </UiCard>
    </div>

    <div v-else-if="loadError" class="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
      <p class="text-sm font-medium text-destructive">{{ loadError }}</p>
      <UiButton variant="outline" size="sm" class="mt-3" @click="refreshAll()">Coba lagi</UiButton>
    </div>

    <div v-else-if="!queue.length" class="rounded-xl border p-10 text-center">
      <ShieldCheck class="mx-auto mb-3 h-10 w-10 text-emerald-500" />
      <p class="font-medium">Antrian kosong</p>
      <p class="mt-1 text-sm text-muted-foreground">Tidak ada pengajuan verifikasi yang menunggu.</p>
    </div>

    <div v-else class="space-y-3">
      <UiCard v-for="c in queue" :key="c.id" class="p-5">
        <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div class="flex items-start gap-3">
            <UiAvatar class="h-11 w-11" :fallback="c.user?.name?.charAt(0)?.toUpperCase() || '?'" />
            <div class="min-w-0">
              <p class="font-bold">{{ c.user?.name }}</p>
              <p class="text-xs text-muted-foreground">{{ c.user?.email }} · Domisili: {{ c.domicile || '-' }} · Layanan: {{ c.serviceArea || '-' }}</p>
              <div class="mt-2 flex flex-wrap gap-1.5">
                <UiBadge variant="outline" class="text-xs">{{ c.education || 'Pendidikan -' }}</UiBadge>
                <UiBadge v-if="c.strNo" variant="info" class="text-xs">STR: {{ c.strNo }}</UiBadge>
                <UiBadge :variant="statusVariant(c.verificationStatus)" class="text-xs">{{ statusLabel(c.verificationStatus) }}</UiBadge>
              </div>
              <div v-if="expandedId === c.id" class="mt-3 space-y-1.5 text-[13px]">
                <p><span class="font-semibold">Pengalaman:</span> {{ c.experience || '-' }}</p>
                <p><span class="font-semibold">Kompetensi:</span> {{ c.competencies || '-' }}</p>
                <p><span class="font-semibold">Sertifikasi:</span> {{ c.certifications || '-' }}</p>
                <p v-if="c.bio"><span class="font-semibold">Bio:</span> {{ c.bio }}</p>
                <p><span class="font-semibold">Rekening:</span> {{ c.bankName || '-' }} · {{ c.bankAccountNo || '-' }} · {{ c.bankAccountName || '-' }}</p>
                <div class="pt-1">
                  <p class="font-semibold">Dokumen ({{ docsFor(c.id).length }}):</p>
                  <ul class="mt-1 space-y-1">
                    <li v-for="d in docsFor(c.id)" :key="d.id" class="flex items-center gap-2">
                      <a :href="uploadUrl(d.fileUrl)" target="_blank" rel="noopener" class="text-primary hover:underline">{{ d.kind }}</a>
                      <UiBadge :variant="statusVariant(d.status)" class="text-[11px]">{{ statusLabel(d.status) }}</UiBadge>
                    </li>
                    <li v-if="!docsFor(c.id).length" class="text-muted-foreground">Belum ada dokumen.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div class="flex shrink-0 flex-wrap gap-2">
            <UiButton size="sm" variant="outline" @click="expandedId = expandedId === c.id ? null : c.id">
              {{ expandedId === c.id ? 'Tutup' : 'Periksa' }}
            </UiButton>
            <UiButton size="sm" :disabled="actingId === c.id" @click="decide(c, 'DISETUJUI')">
              <Loader2 v-if="actingId === c.id" class="mr-1 h-3.5 w-3.5 animate-spin" />
              Setujui
            </UiButton>
            <UiButton size="sm" variant="destructive" :disabled="actingId === c.id" @click="openReject(c, 'DITOLAK')">Tolak</UiButton>
            <UiButton size="sm" variant="outline" :disabled="actingId === c.id" @click="openReject(c, 'PERLU_PERBAIKAN')">Perbaikan</UiButton>
          </div>
        </div>
      </UiCard>
    </div>

    <UiDialog :open="rejectOpen" @update:open="rejectOpen = $event">
      <h2 class="text-xl font-bold">{{ rejectStatus === 'DITOLAK' ? 'Tolak pengajuan' : 'Minta perbaikan' }}</h2>
      <p class="mt-1 text-sm text-muted-foreground">Mitra: {{ selected?.user?.name }} — catatan ini diteruskan via notifikasi.</p>
      <form class="mt-5 space-y-4" novalidate @submit.prevent="submitReject">
        <UiTextarea v-model="note" label="Catatan / alasan" :rows="3" placeholder="cth: Foto KTP buram, mohon unggah ulang..." hint="Mitra perlu tahu field yang harus diperbaiki." :error="rejectError" />
        <div class="flex gap-3">
          <UiButton variant="outline" type="button" class="flex-1" @click="rejectOpen = false">Batal</UiButton>
          <UiButton type="submit" class="flex-1" variant="destructive" :disabled="actingId !== null">
            <Loader2 v-if="actingId" class="mr-2 h-4 w-4 animate-spin" />
            Kirim
          </UiButton>
        </div>
      </form>
    </UiDialog>
  </div>
</template>

<script setup lang="ts">
import { ShieldCheck, Loader2 } from 'lucide-vue-next'
import { statusLabel, statusVariant, uploadUrl } from '@/lib/format'
import { required } from '@/lib/validators'
import { getApiErrorMessage } from '@/composables/useApi'

definePageMeta({ ssr: false, middleware: ['auth-admin'] })
useSeoMeta({ title: 'Verifikasi Mitra', robots: 'noindex, nofollow' })

const api = useApi()
const toast = useToast()

const { data: queueData, pending, error: fetchError, refresh: refreshQueue } = await useAsyncData('verify-queue', () =>
  api<any[]>('/caregivers/verification/queue'),
)
const { data: docsData, refresh: refreshDocs } = await useAsyncData('verify-docs', () =>
  api<any[]>('/documents', { params: { status: undefined } }).catch(() => []),
)

const queue = computed(() => queueData.value ?? [])
const docs = computed(() => (Array.isArray(docsData.value) ? docsData.value : []))
const loadError = computed(() => (fetchError.value ? getApiErrorMessage(fetchError.value, 'Gagal memuat antrian.') : ''))

function docsFor(caregiverId: string) {
  return docs.value.filter((d: any) => d.caregiverId === caregiverId)
}

async function refreshAll() {
  await Promise.all([refreshQueue(), refreshDocs()])
}

const expandedId = ref<string | null>(null)
const actingId = ref<string | null>(null)

async function decide(c: any, status: 'DISETUJUI' | 'DITOLAK' | 'PERLU_PERBAIKAN', note?: string) {
  actingId.value = c.id
  try {
    // PATCH /caregivers/:id/verification {status, note?}
    await api(`/caregivers/${c.id}/verification`, { method: 'PATCH', body: { status, note } })
    toast.success(status === 'DISETUJUI' ? 'Mitra disetujui' : 'Keputusan terkirim', `${c.user?.name} → ${statusLabel(status)}.`);
    await refreshAll()
  } catch (e: any) {
    toast.error('Gagal memproses', getApiErrorMessage(e))
  } finally {
    actingId.value = null
  }
}

const selected = ref<any>(null)
const rejectStatus = ref<'DITOLAK' | 'PERLU_PERBAIKAN'>('DITOLAK')
const rejectOpen = ref(false)
const note = ref('')
const rejectError = ref('')

function openReject(c: any, status: 'DITOLAK' | 'PERLU_PERBAIKAN') {
  selected.value = c
  rejectStatus.value = status
  note.value = ''
  rejectError.value = ''
  rejectOpen.value = true
}

async function submitReject() {
  rejectError.value = ''
  const noteErr = required(note.value, 'Catatan')
  if (noteErr) {
    rejectError.value = noteErr
    return
  }
  rejectOpen.value = false
  await decide(selected.value, rejectStatus.value, note.value.trim())
}
</script>
