<template>
  <div class="p-4 md:p-8 pb-24 md:pb-8">
    <div class="mb-6">
      <h1 class="text-2xl font-bold tracking-tight md:text-3xl">Antrian Uang</h1>
      <p class="mt-1 text-sm text-muted-foreground">Verifikasi deposit, pembayaran pasien (escrow), dan payout mitra. Setiap aksi tercatat atas nama Anda.</p>
    </div>

    <UiTabsList class="w-full">
      <UiTabsTrigger value="deposit" :model-value="tab" @update:model-value="tab = $event">
        <Wallet class="mr-2 h-4 w-4" />
        Deposit
      </UiTabsTrigger>
      <UiTabsTrigger value="bayar" :model-value="tab" @update:model-value="tab = $event">
        <QrCode class="mr-2 h-4 w-4" />
        Pembayaran
      </UiTabsTrigger>
      <UiTabsTrigger value="payout" :model-value="tab" @update:model-value="tab = $event">
        <Banknote class="mr-2 h-4 w-4" />
        Payout
      </UiTabsTrigger>
    </UiTabsList>

    <!-- DEPOSIT -->
    <UiTabsContent :value="'deposit'" :model-value="tab">
      <div class="mb-4 flex items-center gap-3">
        <UiSelect v-model="depositFilter" class="w-auto min-w-48">
          <option value="">Semua status</option>
          <option v-for="s in ['MENUNGGU_VERIFIKASI', 'AKTIF', 'KEDALUWARSA', 'DIKEMBALIKAN', 'HANGUS_TERTANAM', 'HANGUS_PELANGGARAN', 'DITOLAK']" :key="s" :value="s">{{ statusLabel(s) }}</option>
        </UiSelect>
        <UiButton variant="outline" size="sm" :disabled="expiring" @click="processExpiry">
          <Loader2 v-if="expiring" class="mr-1 h-3.5 w-3.5 animate-spin" />
          Proses kedaluwarsa
        </UiButton>
      </div>
      <div class="space-y-3">
        <UiCard v-for="d in deposits" :key="d.id" class="p-4">
          <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p class="font-bold">{{ formatRupiah(d.amount) }} <span class="font-normal text-muted-foreground">· {{ d.caregiver?.user?.name || 'Mitra' }}</span></p>
              <p v-if="d.periodStart" class="mt-0.5 text-xs text-muted-foreground">
                Periode {{ formatDate(d.periodStart) }} – {{ formatDate(d.periodEnd) }} · Ada klien: {{ d.hasClientInPeriod ? 'Ya' : 'Belum' }}
              </p>
              <div class="mt-2 flex flex-wrap items-center gap-2">
                <UiBadge :variant="statusVariant(d.status)">{{ statusLabel(d.status) }}</UiBadge>
                <a v-if="d.proofImageUrl" :href="uploadUrl(d.proofImageUrl)" target="_blank" rel="noopener" class="text-xs text-primary hover:underline">Lihat bukti bayar</a>
                <a v-if="d.refundProofUrl" :href="uploadUrl(d.refundProofUrl)" target="_blank" rel="noopener" class="text-xs text-primary hover:underline">Bukti refund</a>
              </div>
            </div>
            <div class="flex shrink-0 flex-wrap gap-2">
              <template v-if="d.status === 'MENUNGGU_VERIFIKASI'">
                <UiButton size="sm" :disabled="actingId === d.id" @click="verifyDeposit(d, true)">Setujui</UiButton>
                <UiButton size="sm" variant="outline" :disabled="actingId === d.id" @click="askNote('deposit-tolak', d)">Tolak</UiButton>
              </template>
              <UiButton v-if="d.status === 'KEDALUWARSA'" size="sm" variant="outline" :disabled="actingId === d.id" @click="askRefund(d)">Refund TF</UiButton>
            </div>
          </div>
        </UiCard>
        <p v-if="!depositPending && !deposits.length" class="rounded-xl border p-8 text-center text-sm text-muted-foreground">Tidak ada deposit pada filter ini.</p>
      </div>
    </UiTabsContent>

    <!-- PEMBAYARAN PASIEN -->
    <UiTabsContent :value="'bayar'" :model-value="tab">
      <div class="mb-4 flex items-center gap-3">
        <UiSelect v-model="paymentFilter" class="w-auto min-w-48">
          <option value="">Semua status</option>
          <option v-for="s in ['MENUNGGU_VERIFIKASI', 'DIBAYAR_DITAHAN', 'DITERUSKAN_PAYOUT', 'DIKEMBALIKAN_SEBAGIAN', 'DITAHAN_SENGKETA', 'DITOLAK', 'GAGAL']" :key="s" :value="s">{{ statusLabel(s) }}</option>
        </UiSelect>
        <UiButton variant="outline" size="sm" :disabled="expiringPay" @click="processPayExpiry">
          <Loader2 v-if="expiringPay" class="mr-1 h-3.5 w-3.5 animate-spin" />
          Batalkan Deal kedaluwarsa
        </UiButton>
      </div>
      <div class="space-y-3">
        <UiCard v-for="p in payments" :key="p.id" class="p-4">
          <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p class="font-bold">{{ p.type === 'COMMITMENT' ? 'Deposit' : 'Layanan' }} · {{ formatRupiah(p.amount) }} <span class="font-normal text-muted-foreground">· {{ p.payer?.name || p.payer?.email || 'Pembayar' }}</span></p>
              <p class="mt-0.5 text-xs text-muted-foreground">Kontrak: {{ p.contractId?.slice(0, 8) || '-' }} · {{ formatDateTime(p.submittedAt) }}</p>
              <div class="mt-2 flex flex-wrap items-center gap-2">
                <UiBadge :variant="statusVariant(p.status)">{{ statusLabel(p.status) }}</UiBadge>
                <a v-if="p.proofImageUrl" :href="uploadUrl(p.proofImageUrl)" target="_blank" rel="noopener" class="text-xs text-primary hover:underline">Lihat bukti</a>
                <span v-if="p.rejectReason" class="text-xs text-destructive">Alasan: {{ p.rejectReason }}</span>
              </div>
            </div>
            <div v-if="p.status === 'MENUNGGU_VERIFIKASI'" class="flex shrink-0 flex-wrap gap-2">
              <UiButton size="sm" :disabled="actingId === p.id" @click="verifyPayment(p, true)">Verifikasi lolos</UiButton>
              <UiButton size="sm" variant="outline" :disabled="actingId === p.id" @click="askNote('payment-tolak', p)">Tolak</UiButton>
            </div>
          </div>
        </UiCard>
        <p v-if="!paymentPending && !payments.length" class="rounded-xl border p-8 text-center text-sm text-muted-foreground">Tidak ada pembayaran pada filter ini.</p>
      </div>
    </UiTabsContent>

    <!-- PAYOUT -->
    <UiTabsContent :value="'payout'" :model-value="tab">
      <div class="mb-4 flex items-center gap-3">
        <UiSelect v-model="payoutFilter" class="w-auto min-w-48">
          <option value="">Semua status</option>
          <option v-for="s in ['LAYAK_BAYAR', 'DIPROSES', 'DIBAYARKAN', 'DIBAYARKAN_SEBAGIAN', 'GAGAL', 'DITAHAN']" :key="s" :value="s">{{ statusLabel(s) }}</option>
        </UiSelect>
      </div>
      <div class="space-y-3">
        <UiCard v-for="p in payouts" :key="p.id" class="p-4">
          <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p class="font-bold">{{ formatRupiah(p.netAmount) }} <span class="font-normal text-muted-foreground">bersih (gross {{ formatRupiah(p.grossAmount) }} − admin {{ p.adminFeePercent }}%)</span></p>
              <p class="mt-0.5 text-xs text-muted-foreground">
                {{ p.caregiver?.user?.name || 'Mitra' }} · {{ p.bankNameSnap || p.caregiver?.bankName || '-' }} {{ p.bankAccountNoSnap || p.caregiver?.bankAccountNo || '' }} · {{ p.reason === 'PASIEN_BATAL' ? 'Kasus pasien batal' : 'Selesai normal' }}
              </p>
              <div class="mt-2 flex flex-wrap items-center gap-2">
                <UiBadge :variant="statusVariant(p.status)">{{ statusLabel(p.status) }}</UiBadge>
                <a v-if="p.proofTfUrl" :href="uploadUrl(p.proofTfUrl)" target="_blank" rel="noopener" class="text-xs text-primary hover:underline">Bukti TF</a>
              </div>
            </div>
            <div class="flex shrink-0 flex-wrap gap-2">
              <template v-if="['LAYAK_BAYAR', 'DITAHAN', 'GAGAL'].includes(p.status)">
                <UiButton size="sm" :disabled="actingId === p.id" @click="askPayProof(p)">Bayar + bukti TF</UiButton>
                <UiButton size="sm" variant="outline" :disabled="actingId === p.id" @click="holdPayout(p)">Tahan</UiButton>
                <UiButton size="sm" variant="destructive" :disabled="actingId === p.id" @click="failPayout(p)">Gagal</UiButton>
              </template>
            </div>
          </div>
        </UiCard>
        <p v-if="!payoutPending && !payouts.length" class="rounded-xl border p-8 text-center text-sm text-muted-foreground">Tidak ada payout pada filter ini.</p>
      </div>
    </UiTabsContent>

    <!-- Dialog catatan (tolak / tahan) -->
    <UiDialog :open="noteOpen" @update:open="noteOpen = $event">
      <h2 class="text-xl font-bold">{{ noteTitle }}</h2>
      <form class="mt-5 space-y-4" novalidate @submit.prevent="submitNote">
        <UiTextarea v-model="noteText" label="Catatan / alasan" :rows="3" hint="Alasan wajib agar pengguna bisa unggah ulang dengan benar." :error="noteError" />
        <div class="flex gap-3">
          <UiButton variant="outline" type="button" class="flex-1" @click="noteOpen = false">Batal</UiButton>
          <UiButton type="submit" class="flex-1" :disabled="actingId !== null">
            <Loader2 v-if="actingId" class="mr-2 h-4 w-4 animate-spin" />
            Kirim
          </UiButton>
        </div>
      </form>
    </UiDialog>

    <!-- Dialog upload bukti (refund deposit / bayar payout) -->
    <UiDialog :open="proofOpen" @update:open="proofOpen = $event">
      <h2 class="text-xl font-bold">{{ proofTitle }}</h2>
      <form class="mt-5 space-y-4" novalidate @submit.prevent="submitProof">
        <UiFileInput label="Bukti transfer" :error="proofError" @update:file="proofFile = $event" />
        <div class="flex gap-3">
          <UiButton variant="outline" type="button" class="flex-1" @click="proofOpen = false">Batal</UiButton>
          <UiButton type="submit" class="flex-1" :disabled="actingId !== null">
            <Loader2 v-if="actingId" class="mr-2 h-4 w-4 animate-spin" />
            Upload & Proses
          </UiButton>
        </div>
      </form>
    </UiDialog>
  </div>
</template>

<script setup lang="ts">
import { Wallet, QrCode, Banknote, Loader2 } from 'lucide-vue-next'
import { statusLabel, statusVariant, formatRupiah, formatDate, formatDateTime, uploadUrl } from '@/lib/format'
import { required, validateUploadFile } from '@/lib/validators'
import { getApiErrorMessage } from '@/composables/useApi'

definePageMeta({ ssr: false, middleware: ['auth-admin'] })
useSeoMeta({ title: 'Antrian Uang', robots: 'noindex, nofollow' })

const api = useApi()
const toast = useToast()
const tab = ref('deposit')
const actingId = ref<string | null>(null)

// --- Deposit ---
const depositFilter = ref('')
const { data: depositData, pending: depositPending, refresh: refreshDeposits } = await useAsyncData(
  'admin-deposits',
  () => api<any[]>('/deposits', { params: depositFilter.value ? { status: depositFilter.value } : {} }),
  { watch: [depositFilter], default: () => [] },
)
const deposits = computed(() => depositData.value ?? [])

// --- Payments ---
const paymentFilter = ref('')
const { data: paymentData, pending: paymentPending, refresh: refreshPayments } = await useAsyncData(
  'admin-payments',
  () => api<any[]>('/payments', { params: paymentFilter.value ? { status: paymentFilter.value } : {} }),
  { watch: [paymentFilter], default: () => [] },
)
const payments = computed(() => paymentData.value ?? [])

// --- Payouts ---
const payoutFilter = ref('')
const { data: payoutData, pending: payoutPending, refresh: refreshPayouts } = await useAsyncData(
  'admin-payouts',
  () => api<any[]>('/payouts', { params: payoutFilter.value ? { status: payoutFilter.value } : {} }),
  { watch: [payoutFilter], default: () => [] },
)
const payouts = computed(() => payoutData.value ?? [])

async function verifyDeposit(d: any, approve: boolean, note?: string) {
  actingId.value = d.id
  try {
    await api(`/deposits/${d.id}/verify`, { method: 'PATCH', body: { approve, note } })
    toast.success(approve ? 'Deposit disetujui' : 'Deposit ditolak', `Mitra: ${d.caregiver?.user?.name || '-'}.`)
    await refreshDeposits()
  } catch (e: any) {
    toast.error('Gagal memproses deposit', getApiErrorMessage(e))
  } finally {
    actingId.value = null
  }
}

async function verifyPayment(p: any, approve: boolean, note?: string) {
  actingId.value = p.id
  try {
    await api(`/payments/${p.id}/verify`, { method: 'PATCH', body: { approve, note } })
    toast.success(approve ? 'Pembayaran lolos' : 'Pembayaran ditolak', approve ? 'Dana masuk escrow, layanan siap jalan.' : 'Pasien bisa unggah ulang bukti.');
    await refreshPayments()
  } catch (e: any) {
    toast.error('Gagal memproses pembayaran', getApiErrorMessage(e))
  } finally {
    actingId.value = null
  }
}

async function holdPayout(p: any) {
  actingId.value = p.id
  try {
    await api(`/payouts/${p.id}/hold`, { method: 'PATCH', body: {} })
    toast.success('Payout ditahan', 'Dana menunggu putusan sengketa/pemeriksaan.')
    await refreshPayouts()
  } catch (e: any) {
    toast.error('Gagal menahan payout', getApiErrorMessage(e))
  } finally {
    actingId.value = null
  }
}

async function failPayout(p: any) {
  actingId.value = p.id
  try {
    await api(`/payouts/${p.id}/fail`, { method: 'PATCH', body: {} })
    toast.success('Payout ditandai gagal', 'Rekening salah / bank gangguan — bisa diproses ulang setelah diperbaiki.')
    await refreshPayouts()
  } catch (e: any) {
    toast.error('Gagal menandai payout', getApiErrorMessage(e))
  } finally {
    actingId.value = null
  }
}

const expiring = ref(false)
async function processExpiry() {
  expiring.value = true
  try {
    const res = await api<any>('/deposits/process-expiry', { method: 'POST' })
    toast.success('Proses kedaluwarsa selesai', `Diproses: ${res?.diproses ?? '-'}, hangus: ${res?.hangus ?? '-'}.`)
    await refreshDeposits()
  } catch (e: any) {
    toast.error('Gagal memproses', getApiErrorMessage(e))
  } finally {
    expiring.value = false
  }
}

const expiringPay = ref(false)
async function processPayExpiry() {
  expiringPay.value = true
  try {
    const res = await api<any>('/payments/process-expiry', { method: 'POST' })
    toast.success('Deal kedaluwarsa dibatalkan', `Dibatalkan: ${res?.dibatalkan ?? 0} kontrak.`)
    await refreshPayments()
  } catch (e: any) {
    toast.error('Gagal memproses', getApiErrorMessage(e))
  } finally {
    expiringPay.value = false
  }
}

// --- Dialog catatan ---
const noteOpen = ref(false)
const noteTitle = ref('')
const noteText = ref('')
const noteError = ref('')
const noteCtx = ref<{ kind: 'deposit-tolak' | 'payment-tolak'; item: any } | null>(null)

function askNote(kind: 'deposit-tolak' | 'payment-tolak', item: any) {
  noteCtx.value = { kind, item }
  noteTitle.value = kind === 'deposit-tolak' ? 'Tolak deposit' : 'Tolak pembayaran'
  noteText.value = ''
  noteError.value = ''
  noteOpen.value = true
}

async function submitNote() {
  noteError.value = ''
  const err = required(noteText.value, 'Catatan')
  if (err) {
    noteError.value = err
    return
  }
  noteOpen.value = false
  const ctx = noteCtx.value
  if (!ctx) return
  if (ctx.kind === 'deposit-tolak') await verifyDeposit(ctx.item, false, noteText.value.trim())
  else await verifyPayment(ctx.item, false, noteText.value.trim())}

// --- Dialog bukti transfer ---
const proofOpen = ref(false)
const proofTitle = ref('')
const proofError = ref('')
const proofCtx = ref<{ kind: 'deposit-refund' | 'payout-pay'; item: any } | null>(null)
const proofFile = ref<File | null>(null)

function askRefund(d: any) {
  proofCtx.value = { kind: 'deposit-refund', item: d }
  proofTitle.value = `Refund deposit — ${formatRupiah(d.amount)}`
  proofError.value = ''
  proofFile.value = null
  proofOpen.value = true
}

function askPayProof(p: any) {
  proofCtx.value = { kind: 'payout-pay', item: p }
  proofTitle.value = `Bayar payout — ${formatRupiah(p.netAmount)}`
  proofError.value = ''
  proofFile.value = null
  proofOpen.value = true
}

async function submitProof() {
  proofError.value = ''
  const file = proofFile.value
  const fileErr = validateUploadFile(file, { field: 'Bukti transfer' })
  if (fileErr) {
    proofError.value = fileErr
    return
  }
  const ctx = proofCtx.value
  if (!ctx) return
  actingId.value = ctx.item.id
  try {
    const fd = new FormData()
    fd.append('proof', file!)
    if (ctx.kind === 'deposit-refund') {
      await api(`/deposits/${ctx.item.id}/refund`, { method: 'POST', body: fd })
      toast.success('Refund deposit diproses', 'Status deposit → Dikembalikan.')
      await refreshDeposits()
    } else {
      await api(`/payouts/${ctx.item.id}/pay`, { method: 'POST', body: fd })
      toast.success('Payout dibayarkan', 'Bukti TF tersimpan, mitra diberi notifikasi.')
      await refreshPayouts()
    }
    proofOpen.value = false
  } catch (e: any) {
    proofError.value = getApiErrorMessage(e)
  } finally {
    actingId.value = null
  }
}
</script>
