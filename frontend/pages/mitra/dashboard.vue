<template>
  <div class="container mx-auto px-4 py-8 pb-24 md:pb-8">
    <div class="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Dashboard Mitra</h1>
        <p class="mt-1 text-muted-foreground">Pantau minat, kontrak, dan pendapatan Anda.</p>
      </div>
      <NuxtLink to="/mitra/kebutuhan" class="shrink-0">
        <UiButton size="sm"><Search class="mr-1 h-4 w-4" />Cari Kerja</UiButton>
      </NuxtLink>
    </div>

    <!-- Banner: verifikasi & deposit (hanya tampil jika ada tindakan yang perlu dilakukan) -->
    <UiCard v-if="profile && profile.verificationStatus !== 'DISETUJUI'" class="mb-4 border-amber-200 bg-amber-50/60 p-4">
      <p class="text-sm"><span class="font-bold">Verifikasi {{ statusLabel(profile.verificationStatus) }}.</span> Selesaikan di <NuxtLink to="/mitra/profil" class="font-medium text-primary hover:underline">Profil Mitra</NuxtLink> agar bisa kerja.</p>
    </UiCard>
    <UiCard v-else-if="deposit && !deposit.active" class="mb-4 border-destructive/30 bg-destructive/5 p-4">
      <p class="text-sm">
        <span class="font-bold text-destructive">{{ deposit.expired ? 'Deposit kedaluwarsa.' : 'Deposit belum aktif.' }}</span>
        {{ deposit.expired ? 'Bayar deposit periode baru untuk melihat dan mengajukan minat ke kebutuhan pasien.' : 'Akun terkunci untuk lihat/apply kebutuhan.' }}
        <NuxtLink to="/mitra/deposit#bayar" class="ml-1 font-semibold text-primary hover:underline">Bayar deposit →</NuxtLink>
      </p>
    </UiCard>

    <!-- Ringkasan -->
    <div class="mb-8 grid gap-4 sm:grid-cols-4">
      <UiCard v-for="s in statCards" :key="s.label" class="p-5">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg" :class="s.bg">
            <component :is="s.icon" class="h-5 w-5" :class="s.color" />
          </div>
          <div>
            <div class="text-2xl font-bold">{{ s.value }}</div>
            <div class="text-sm text-muted-foreground">{{ s.label }}</div>
          </div>
        </div>
      </UiCard>
    </div>


    <!-- MINAT -->
    <UiTabsContent :value="'interests'" :model-value="activeTab">
      <div v-if="intPending" class="space-y-2">
        <div class="skeleton-shimmer h-16 rounded-xl" />
        <div class="skeleton-shimmer h-16 rounded-xl" />
      </div>
      <div v-else-if="!interests.length" class="rounded-xl border p-10 text-center">
        <Inbox class="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
        <p class="font-medium">Belum ada minat terkirim</p>
        <p class="mt-1 text-sm text-muted-foreground">Cari kebutuhan yang sesuai kompetensi lalu Ajukan Minat.</p>
        <NuxtLink to="/mitra/kebutuhan"><UiButton class="mt-4" size="sm">Lihat Kebutuhan Pasien</UiButton></NuxtLink>
      </div>
      <div v-else class="space-y-3">
        <UiCard v-for="m in interests" :key="m.id" class="p-5">
          <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p class="font-bold">{{ m.need?.serviceType || 'Kebutuhan' }} <span class="font-normal text-muted-foreground">· {{ m.need?.locationText || '-' }}</span></p>
              <p class="mt-0.5 text-xs text-muted-foreground">{{ formatDateTime(m.createdAt) }}<span v-if="m.need?.totalHours"> · {{ m.need.totalHours }} jam</span></p>
              <div class="mt-2 flex flex-wrap gap-2">
                <UiBadge :variant="statusVariant(m.status)">{{ statusLabel(m.status) }}</UiBadge>
              </div>
              <p class="mt-2 text-[13px] text-muted-foreground">“{{ m.intro || '-' }}”</p>
            </div>
            <div class="flex shrink-0 flex-wrap gap-2">
              <UiButton v-if="m.status === 'DITERIMA'" size="sm" variant="outline" @click="toggleChat(m)">
                {{ chatOpenId === m.id ? 'Tutup chat' : 'Chat' }}
              </UiButton>
              <UiButton v-if="m.status === 'MENUNGGU_RESPON'" size="sm" variant="outline" :disabled="actingId === m.id" @click="cancelInterest(m)">Batalkan</UiButton>
            </div>
          </div>
          <div v-if="chatOpenId === m.id" class="mt-4 rounded-xl border bg-muted/20 p-4">
            <div v-if="chatPending" class="text-xs text-muted-foreground">Memuat...</div>
            <div v-else class="max-h-56 space-y-2 overflow-y-auto">
              <p v-if="!chatMessages.length" class="text-xs text-muted-foreground">Belum ada pesan. Negosiasi jadwal, scope, biaya dengan pasien.</p>
              <div v-for="msg in chatMessages" :key="msg.id" class="flex" :class="msg.senderUserId === me?.id ? 'justify-end' : 'justify-start'">
                <div class="max-w-[80%] rounded-lg px-3 py-2 text-[13px]" :class="msg.senderUserId === me?.id ? 'bg-primary text-primary-foreground' : 'border bg-background'">
                  {{ msg.body }}
                  <p class="mt-1 text-[10px] opacity-70">{{ formatDateTime(msg.createdAt) }}</p>
                </div>
              </div>
            </div>
            <form class="mt-3 flex gap-2" @submit.prevent="sendChat(m)">
              <input v-model="chatBody" type="text" placeholder="Tulis pesan..." class="flex h-10 flex-1 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              <UiButton type="submit" size="sm" :disabled="sendingChat || !chatBody.trim()">Kirim</UiButton>
            </form>
          </div>
        </UiCard>
      </div>
    </UiTabsContent>

    <!-- KONTRAK -->
    <UiTabsContent :value="'contracts'" :model-value="activeTab">
      <div v-if="ctPending" class="space-y-2">
        <div class="skeleton-shimmer h-20 rounded-xl" />
        <div class="skeleton-shimmer h-20 rounded-xl" />
      </div>
      <div v-else-if="!contracts.length" class="rounded-xl border p-10 text-center">
        <Handshake class="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
        <p class="font-medium">Belum ada kontrak / Deal</p>
        <p class="mt-1 text-sm text-muted-foreground">Kontrak dibuat pasien dari minat yang DITERIMA.</p>
      </div>
      <div v-else class="space-y-3">
        <UiCard v-for="c in contracts" :key="c.id" class="p-5">
          <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p class="font-bold">{{ c.serviceType }} <span class="font-normal text-muted-foreground">· {{ formatRupiah(c.totalCost) }} ({{ c.totalHours }} jam)</span></p>
              <p class="mt-0.5 text-xs text-muted-foreground">{{ c.schedule || '-' }} · {{ c.locationText }} · {{ formatDate(c.startDate) }} → {{ formatDate(c.endDate) }}</p>
              <div class="mt-2">
                <UiBadge :variant="statusVariant(c.status)">{{ statusLabel(c.status) }}</UiBadge>
              </div>
            </div>
            <div class="flex shrink-0 flex-wrap gap-2">
              <NuxtLink v-if="['SIAP_JALAN', 'BERJALAN'].includes(c.status)" :to="`/mitra/absensi?kontrak=${c.id}`">
                <UiButton size="sm">Buka Absensi<ArrowRight class="ml-1 h-4 w-4" /></UiButton>
              </NuxtLink>
              <UiButton v-if="c.interestId" size="sm" variant="outline" @click="toggleContractChat(c)">
                {{ contractChatId === c.id ? 'Tutup chat' : 'Chat Pasien' }}
              </UiButton>
              <UiButton size="sm" variant="outline" @click="openDispute(c)">Lapor / Sengketa</UiButton>
            </div>
          </div>

          <div v-if="contractChatId === c.id" class="mt-4 rounded-xl border bg-muted/20 p-4">
            <div class="max-h-56 space-y-2 overflow-y-auto">
              <p v-if="!chatMessages.length" class="text-xs text-muted-foreground">Belum ada pesan.</p>
              <div v-for="msg in chatMessages" :key="msg.id" class="flex" :class="msg.senderUserId === me?.id ? 'justify-end' : 'justify-start'">
                <div class="max-w-[80%] rounded-lg px-3 py-2 text-[13px]" :class="msg.senderUserId === me?.id ? 'bg-primary text-primary-foreground' : 'border bg-background'">{{ msg.body }}</div>
              </div>
            </div>
            <form class="mt-3 flex gap-2" @submit.prevent="sendContractChat(c)">
              <input v-model="chatBody" type="text" placeholder="Tulis pesan..." class="flex h-10 flex-1 rounded-lg border border-input bg-background px-3 text-sm" />
              <UiButton type="submit" size="sm" :disabled="sendingChat || !chatBody.trim()">Kirim</UiButton>
            </form>
          </div>
        </UiCard>
      </div>
    </UiTabsContent>

    <!-- PENDAPATAN (ringkasan; riwayat lengkap di halaman Pendapatan) -->
    <UiTabsContent :value="'payout'" :model-value="activeTab">
      <div v-if="payPending" class="skeleton-shimmer h-24 rounded-xl" />
      <UiCard v-else class="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-sm text-muted-foreground">Total diterima</p>
          <p class="text-2xl font-bold text-emerald-600">{{ formatRupiah(paidTotal) }}</p>
          <p class="mt-1 text-xs text-muted-foreground">
            {{ pendingPayoutCount ? `${pendingPayoutCount} pembayaran sedang diproses` : 'Tidak ada pembayaran yang sedang diproses' }}
          </p>
        </div>
        <NuxtLink to="/mitra/pendapatan">
          <UiButton variant="outline" size="sm">Lihat riwayat lengkap<ArrowRight class="ml-1 h-4 w-4" /></UiButton>
        </NuxtLink>
      </UiCard>
    </UiTabsContent>

    <!-- Dialog sengketa -->
    <UiDialog :open="disputeOpen" @update:open="disputeOpen = $event">
      <h2 class="text-xl font-bold">Lapor / Sengketa</h2>
      <form class="mt-4 space-y-4" @submit.prevent="submitDispute">
        <div class="space-y-2">
          <UiLabel>Kategori</UiLabel>
          <UiSelect v-model="disputeForm.category">
            <option value="LAYANAN_TIDAK_SESUAI">Kondisi tidak sesuai</option>
            <option value="PERBEDAAN_INFO">Info tidak sesuai</option>
            <option value="PEMBAYARAN">Pembayaran</option>
            <option value="KOMUNIKASI">Komunikasi</option>
            <option value="LAINNYA">Lainnya</option>
          </UiSelect>
        </div>
        <UiTextarea v-model="disputeForm.description" label="Deskripsi" :rows="4" :error="disputeError" />
        <div class="flex gap-3">
          <UiButton variant="outline" type="button" class="flex-1" @click="disputeOpen = false">Batal</UiButton>
          <UiButton type="submit" class="flex-1" :disabled="disputing">Kirim</UiButton>
        </div>
      </form>
    </UiDialog>
  </div>
</template>

<script setup lang="ts">
import { Search, Inbox, Handshake, Wallet, PlayCircle, CheckCircle2, Banknote, ArrowRight } from 'lucide-vue-next'
import { statusLabel, statusVariant, formatRupiah, formatDate, formatDateTime } from '@/lib/format'
import { required } from '@/lib/validators'
import { getApiErrorMessage } from '@/composables/useApi'

definePageMeta({ ssr: false, middleware: ['auth-caregiver'] })
useSeoMeta({ title: 'Dashboard Mitra', robots: 'noindex, nofollow' })

const api = useApi()
const toast = useToast()
const { user: me } = useAuth()
const activeTab = ref('interests')
const actingId = ref<string | null>(null)

// --- Banner: profil + deposit ---
const profileRequest = useAsyncData('mitra-profile-banner', () => api<any>('/caregivers/me/profile').catch(() => null), { default: () => null })
const depositRequest = useAsyncData('mitra-deposit-banner', () => api<any>('/deposits/current').catch(() => null), { default: () => null })
const interestsRequest = useAsyncData('my-interests', () => api<any[]>('/interests/me'), { default: () => [] })
const contractsRequest = useAsyncData('my-contracts', () => api<any[]>('/contracts/me'), { default: () => [] })
const payoutsRequest = useAsyncData('my-payouts', () => api<any[]>('/payouts/me'), { default: () => [] })

const [
  { data: profile },
  { data: deposit },
  { data: intData, pending: intPending, refresh: refreshInterests },
  { data: ctData, pending: ctPending },
  { data: payData, pending: payPending },
] = await Promise.all([profileRequest, depositRequest, interestsRequest, contractsRequest, payoutsRequest])

// --- Minat terkirim (E) ---
const interests = computed(() => intData.value ?? [])
const waitingCount = computed(() => interests.value.filter((m: any) => m.status === 'MENUNGGU_RESPON').length)

async function cancelInterest(m: any) {
  actingId.value = m.id
  try {
    await api(`/interests/${m.id}/cancel`, { method: 'POST' })
    toast.success('Minat dibatalkan', 'Anda bisa ajukan ke kebutuhan lain.')
    await refreshInterests()
  } catch (e: any) { toast.error('Gagal', getApiErrorMessage(e)) } finally { actingId.value = null }
}

// --- Chat (F-01) ---
const chatOpenId = ref<string | null>(null)
const contractChatId = ref<string | null>(null)
const chatMessages = ref<any[]>([])
const chatPending = ref(false)
const chatBody = ref('')
const sendingChat = ref(false)

async function loadChat(interestId: string) {
  chatPending.value = true
  try { chatMessages.value = await api<any[]>(`/messages/interest/${interestId}`) }
  catch { chatMessages.value = [] } finally { chatPending.value = false }
}
async function toggleChat(m: any) {
  if (chatOpenId.value === m.id) { chatOpenId.value = null; return }
  chatOpenId.value = m.id
  contractChatId.value = null
  chatBody.value = ''
  await loadChat(m.id)
}
async function sendChat(m: any) {
  if (!chatBody.value.trim()) return
  sendingChat.value = true
  try {
    await api('/messages', { method: 'POST', body: { interestId: m.id, body: chatBody.value.trim() } })
    chatBody.value = ''
    await loadChat(m.id)
  } catch (e: any) { toast.error('Gagal', getApiErrorMessage(e)) } finally { sendingChat.value = false }
}
async function toggleContractChat(c: any) {
  if (contractChatId.value === c.id) { contractChatId.value = null; return }
  if (!c.interestId) { toast.warning('Tanpa thread', 'Kontrak ini tanpa interest terkait.'); return }
  chatOpenId.value = null
  contractChatId.value = c.id
  chatBody.value = ''
  await loadChat(c.interestId)
}
async function sendContractChat(c: any) {
  if (!chatBody.value.trim() || !c.interestId) return
  sendingChat.value = true
  try {
    await api('/messages', { method: 'POST', body: { interestId: c.interestId, body: chatBody.value.trim() } })
    chatBody.value = ''
    await loadChat(c.interestId)
  } catch (e: any) { toast.error('Gagal', getApiErrorMessage(e)) } finally { sendingChat.value = false }
}

// --- Kontrak (F-03/I) ---
const contracts = computed(() => ctData.value ?? [])

// --- Pendapatan (J): ringkasan saja, riwayat lengkap di /mitra/pendapatan ---
const payouts = computed(() => payData.value ?? [])
const paidTotal = computed(() => payouts.value.filter((p: any) => ['DIBAYARKAN', 'DIBAYARKAN_SEBAGIAN'].includes(p.status)).reduce((s: number, p: any) => s + Number(p.netAmount || 0), 0))
const pendingPayoutCount = computed(() => payouts.value.filter((p: any) => ['LAYAK_BAYAR', 'DIPROSES', 'DITAHAN'].includes(p.status)).length)

// --- Sengketa (M-01) ---
const disputeOpen = ref(false)
const disputing = ref(false)
const disputeError = ref('')
const disputeTarget = ref<any>(null)
const disputeForm = reactive({ category: 'LAYANAN_TIDAK_SESUAI', description: '' })
function openDispute(c: any) {
  disputeTarget.value = c
  disputeForm.description = ''
  disputeError.value = ''
  disputeOpen.value = true
}
async function submitDispute() {
  disputeError.value = ''
  const err = required(disputeForm.description, 'Deskripsi')
  if (err) { disputeError.value = err; return }
  disputing.value = true
  try {
    await api('/disputes', { method: 'POST', body: { contractId: disputeTarget.value.id, category: disputeForm.category, description: disputeForm.description.trim() } })
    toast.success('Laporan terkirim', 'Admin akan memeriksa.')
    disputeOpen.value = false
  } catch (e: any) { disputeError.value = getApiErrorMessage(e) } finally { disputing.value = false }
}

// --- Ringkasan ---
const statCards = computed(() => [
  { label: 'Minat Menunggu', value: waitingCount.value, icon: Inbox, bg: 'bg-amber-100', color: 'text-amber-600' },
  { label: 'Kontrak Aktif', value: contracts.value.filter((c: any) => ['SIAP_JALAN', 'BERJALAN'].includes(c.status)).length, icon: PlayCircle, bg: 'bg-primary/10', color: 'text-primary' },
  { label: 'Selesai', value: contracts.value.filter((c: any) => c.status === 'SELESAI').length, icon: CheckCircle2, bg: 'bg-emerald-100', color: 'text-emerald-600' },
  { label: 'Diterima (Rp)', value: paidTotal.value >= 1000000 ? `${(paidTotal.value / 1000000).toFixed(1)}jt` : `${Math.round(paidTotal.value / 1000)}rb`, icon: Banknote, bg: 'bg-sky-100', color: 'text-sky-600' },
])
</script>
