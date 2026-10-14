<template>
  <div class="min-h-screen bg-slate-50/70 pb-24 md:pb-8">
    <div class="container mx-auto px-4 py-6 md:py-8">

      <!-- HERO: satu-satunya tombol utama Tulis Kebutuhan -->
      <section class="relative mb-6 overflow-hidden rounded-3xl bg-slate-950 px-6 py-7 text-white shadow-xl shadow-slate-900/10 md:px-9 md:py-9">
        <div class="absolute inset-0 grid-pattern opacity-[0.08]" />
        <div class="absolute -right-24 -top-28 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div class="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div class="max-w-2xl">
            <p class="mb-3 flex items-center gap-2 text-sm font-medium text-cyan-200"><span class="h-2 w-2 rounded-full bg-emerald-400" />Ruang pasien</p>
            <h1 class="text-3xl font-bold tracking-tight md:text-4xl">Halo, {{ me?.name?.split(' ')[0] || 'Pasien' }}.</h1>
            <p class="mt-3 max-w-xl text-sm leading-relaxed text-slate-300 md:text-base">Buat kebutuhan sekali, lalu pantau semuanya dari sini: pelamar, chat, kesepakatan, pembayaran QRIS, sampai selesai.</p>
          </div>
          <div class="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.08] p-4 backdrop-blur">
            <div class="flex items-start gap-3">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-400 text-slate-950"><component :is="nextAction.icon" class="h-5 w-5" /></div>
              <div class="min-w-0">
                <p class="text-xs font-semibold uppercase tracking-wider text-cyan-200">Langkah berikutnya</p>
                <p class="mt-1 font-bold">{{ nextAction.title }}</p>
                <p class="mt-1 text-xs leading-relaxed text-slate-300">{{ nextAction.description }}</p>
              </div>
            </div>
            <UiButton size="sm" class="mt-4 w-full bg-cyan-400 text-slate-950 hover:bg-cyan-300" @click="nextAction.action()">
              {{ nextAction.cta }}
              <ArrowRight class="h-4 w-4" />
            </UiButton>
          </div>
        </div>
      </section>

      <!-- PERJALANAN LAYANAN: kebutuhan → selesai -->
      <section class="mb-6 rounded-2xl border bg-white p-5 shadow-sm md:p-6">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.16em] text-primary">Perjalanan layanan</p>
            <h2 class="mt-1 text-lg font-bold">Dari kebutuhan sampai selesai</h2>
          </div>
          <div class="flex flex-col items-start gap-2 sm:items-end">
            <UiSelect v-if="needs.length" v-model="activeNeedId" class="w-full min-w-52 text-xs sm:w-auto">
              <option v-for="n in needs" :key="n.id" :value="n.id">{{ n.serviceType }} · {{ statusLabel(n.status) }}</option>
            </UiSelect>
            <p class="text-sm text-muted-foreground"><span class="font-bold text-foreground">{{ completedSteps }}</span> dari 6 langkah selesai</p>
          </div>
        </div>
        <div class="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"><div class="h-full rounded-full bg-primary transition-all" :style="{ width: `${(completedSteps / 6) * 100}%` }" /></div>
        <ol class="mt-5 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <li v-for="(s, i) in steps" :key="s.label" class="flex items-center gap-2 rounded-xl px-2 py-2" :class="s.active ? 'bg-primary/10 ring-1 ring-primary/30' : ''">
            <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold" :class="s.done ? 'bg-emerald-100 text-emerald-700' : s.active ? 'bg-primary text-primary-foreground' : 'bg-slate-100 text-slate-500'">{{ s.done ? '✓' : i + 1 }}</span>
            <span class="min-w-0"><span class="block truncate text-xs font-semibold">{{ s.label }}</span><span class="block truncate text-[11px] text-muted-foreground">{{ s.desc }}</span></span>
          </li>
        </ol>
        <p v-if="activeNeed" class="mt-4 text-xs leading-relaxed text-muted-foreground">
          Fokus: <b class="text-foreground">{{ activeNeed.serviceType }}</b> · {{ statusLabel(activeNeed.status) }} ·
          <NuxtLink :to="`/family/needs/${activeNeed.id}`" class="font-medium text-primary hover:underline">Kelola kebutuhan ini →</NuxtLink>
        </p>
      </section>

      <!-- RINGKASAN -->
      <div class="mb-6 grid gap-3 sm:grid-cols-4">
        <UiCard class="border-0 p-4 shadow-sm">
          <div class="flex items-center justify-between gap-3"><div><div class="text-2xl font-bold tracking-tight">{{ needs.length }}</div><div class="mt-0.5 text-xs text-muted-foreground">Kebutuhan</div></div><div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10"><FileText class="h-5 w-5 text-primary" /></div></div>
        </UiCard>
        <UiCard class="border-0 p-4 shadow-sm">
          <div class="flex items-center justify-between gap-3"><div><div class="text-2xl font-bold tracking-tight">{{ waitingInterests }}</div><div class="mt-0.5 text-xs text-muted-foreground">Pelamar menunggu</div></div><div class="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100"><MessageCircle class="h-5 w-5 text-amber-600" /></div></div>
        </UiCard>
        <UiCard class="border-0 p-4 shadow-sm">
          <div class="flex items-center justify-between gap-3"><div><div class="text-2xl font-bold tracking-tight">{{ runningCount }}</div><div class="mt-0.5 text-xs text-muted-foreground">Berjalan</div></div><div class="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100"><PlayCircle class="h-5 w-5 text-sky-600" /></div></div>
        </UiCard>
        <UiCard class="border-0 p-4 shadow-sm">
          <div class="flex items-center justify-between gap-3"><div><div class="text-2xl font-bold tracking-tight">{{ doneCount }}</div><div class="mt-0.5 text-xs text-muted-foreground">Selesai</div></div><div class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100"><CheckCircle2 class="h-5 w-5 text-emerald-600" /></div></div>
        </UiCard>
      </div>

      <!-- DAFTAR KEBUTUHAN -->
      <section class="rounded-2xl border bg-white p-5 shadow-sm md:p-6">
        <div class="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 class="text-lg font-bold">Daftar Kebutuhan</h2>
            <p class="mt-0.5 text-sm text-muted-foreground"><b>Kelola</b> untuk ubah kebutuhan. <b>Pelamar</b> untuk lihat perawat yang melamar, chat, lalu Deal & bayar QRIS.</p>
          </div>
          <p v-if="needs.length" class="text-xs text-muted-foreground">{{ needs.length }} kebutuhan</p>
        </div>

        <div v-if="needsPending" class="mt-4 grid gap-4 sm:grid-cols-2">
          <UiCard v-for="i in 4" :key="i" class="p-5">
            <div class="skeleton-shimmer h-4 w-2/3 rounded" />
            <div class="skeleton-shimmer mt-2 h-3 w-1/2 rounded" />
            <div class="skeleton-shimmer mt-4 h-9 rounded-lg" />
          </UiCard>
        </div>
        <div v-else-if="needsError" class="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p class="text-sm font-medium text-destructive">{{ needsError }}</p>
          <UiButton variant="outline" size="sm" class="mt-3" @click="refreshNeeds()">Coba lagi</UiButton>
        </div>
        <div v-else-if="!needs.length" class="mt-4 rounded-xl border border-dashed p-10 text-center">
          <ClipboardList class="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p class="font-medium">Belum ada kebutuhan — tulis yang pertama</p>
          <p class="mx-auto mt-1 max-w-md text-sm text-muted-foreground">Tersimpan sebagai <b>Draft</b>, lalu <b>Publikasikan</b> agar dilamar mitra aktif. Gunakan tombol <b>Tulis Kebutuhan</b> di atas.</p>
          <NuxtLink to="/family/needs/new" class="mt-2 inline-block text-sm font-medium text-primary hover:underline">atau buka form kebutuhan →</NuxtLink>
        </div>
        <div v-else class="mt-4 grid gap-4 sm:grid-cols-2">
          <UiCard v-for="n in needs" :key="n.id" class="flex flex-col p-5" :class="n.id === activeNeedId ? 'ring-2 ring-primary/40' : ''">
            <div class="flex items-start justify-between gap-2">
              <h3 class="font-bold leading-snug">{{ n.serviceType }}</h3>
              <UiBadge :variant="statusVariant(n.status)" class="shrink-0">{{ statusLabel(n.status) }}</UiBadge>
            </div>
            <p class="mt-1 text-xs text-muted-foreground">{{ n.locationText }} · {{ formatDate(n.startDate) }} · {{ n.totalHours }} jam · {{ formatRupiah(n.budgetEstimate) }}</p>

            <!-- Mini pipeline -->
            <div class="mt-3 rounded-lg bg-muted/30 p-3">
              <div class="flex items-center gap-1 text-[11px]">
                <span v-for="(p, i) in pipeline(n)" :key="p.label" class="flex flex-1 items-center gap-1 last:flex-none">
                  <span class="flex-1 rounded-md px-1.5 py-1 text-center font-medium" :class="p.done ? 'bg-emerald-100 text-emerald-700' : p.now ? 'bg-primary/10 text-primary ring-1 ring-primary/40' : 'bg-muted text-muted-foreground'">{{ p.label }}</span>
                  <span v-if="i < pipeline(n).length - 1" class="text-muted-foreground">›</span>
                </span>
              </div>
              <p class="mt-2 text-xs text-muted-foreground">
                👥 <b>{{ minatCount(n.id, 'MENUNGGU_RESPON') }}</b> menunggu ·
                <b>{{ minatCount(n.id, 'DITERIMA') }}</b> diterima ·
                💰 <b>{{ contractFor(n.id) ? statusLabel(contractFor(n.id).status) : 'belum Deal' }}</b>
              </p>
            </div>

            <div class="mt-4 flex flex-wrap gap-2 pt-1">
              <NuxtLink :to="`/family/needs/${n.id}?edit=1`" class="flex-1"><UiButton size="sm" class="w-full" @click="activeNeedId = n.id">Kelola →</UiButton></NuxtLink>
              <NuxtLink :to="`/family/needs/${n.id}#pelamar`" @click="activeNeedId = n.id"><UiButton size="sm" variant="outline">
                <Users class="mr-1 h-3.5 w-3.5" />
                Pelamar ({{ totalPelamar(n.id) }})
              </UiButton></NuxtLink>
              <UiButton v-if="n.status === 'DRAFT'" size="sm" variant="outline" :disabled="actingId === n.id" @click="publishNeed(n)">Publikasikan</UiButton>
            </div>
            <div class="mt-2 flex flex-wrap items-center gap-2">
              <NuxtLink v-if="contractFor(n.id) && contractFor(n.id).status === 'DEAL_MENUNGGU_BAYAR'" :to="`/family/needs/${n.id}#bayar`" class="text-xs font-bold text-amber-700 hover:underline">Bayar QRIS →</NuxtLink>
              <button v-if="['DRAFT', 'DIPUBLIKASIKAN'].includes(n.status)" class="text-xs text-muted-foreground hover:text-destructive hover:underline" @click="closeNeed(n)">Tutup</button>
            </div>
          </UiCard>
        </div>
      </section>

      <!-- BANTUAN CEPAT -->
      <section class="mt-6 grid gap-3 sm:grid-cols-3">
        <NuxtLink to="/family/find"><UiCard class="border-0 p-4 shadow-sm transition-shadow hover:shadow-md">
          <p class="text-sm font-bold">Cari perawat</p>
          <p class="mt-0.5 text-xs text-muted-foreground">Lihat profil & rating sebelum mereka melamar.</p>
        </UiCard></NuxtLink>
        <NuxtLink to="/family/approval"><UiCard class="border-0 p-4 shadow-sm transition-shadow hover:shadow-md">
          <p class="text-sm font-bold">Approval absensi <span v-if="pendingApproval" class="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">{{ pendingApproval }} menunggu</span></p>
          <p class="mt-0.5 text-xs text-muted-foreground">Setujui kehadiran mitra per sesi.</p>
        </UiCard></NuxtLink>
        <NuxtLink to="/family/pembayaran"><UiCard class="border-0 p-4 shadow-sm transition-shadow hover:shadow-md">
          <p class="text-sm font-bold">Riwayat pembayaran</p>
          <p class="mt-0.5 text-xs text-muted-foreground">QRIS → verifikasi admin → escrow.</p>
        </UiCard></NuxtLink>
      </section>

    </div>
  </div>
</template>

<script setup lang="ts">
import { Plus, ClipboardList, MessageCircle, Handshake, FileText, Megaphone, Users, QrCode, CheckCircle2, PlayCircle, ArrowRight } from 'lucide-vue-next'
import { statusLabel, statusVariant, formatRupiah, formatDate } from '@/lib/format'
import { getApiErrorMessage } from '@/composables/useApi'

definePageMeta({ ssr: false, middleware: ['auth-family'] })
useSeoMeta({ title: 'Dashboard Pasien', robots: 'noindex, nofollow' })

const api = useApi()
const toast = useToast()
const { user: me } = useAuth()
const actingId = ref<string | null>(null)
const activeNeedId = ref<string | ''>('')

function goCreate() { navigateTo('/family/needs/new') }

// --- Data utama ---
const needsRequest = useAsyncData('needs-me', () => api<any[]>('/needs/me'), { default: () => [] })
const contractsRequest = useAsyncData('contracts-me', () => api<any[]>('/contracts/me'), { default: () => [] })
const paymentsRequest = useAsyncData('payments-me', () => api<any[]>('/payments/me'), { default: () => [] })
const interestsRequest = useAsyncData('interests-all-needs', () => api<any[]>('/interests/incoming'), { default: () => [] })

const [
  { data: needsData, pending: needsPending, error: needsFetchError, refresh: refreshNeeds },
  { data: contractsData, refresh: refreshContracts },
  { data: paymentsData },
  { data: interestsData, refresh: refreshInterests },
] = await Promise.all([needsRequest, contractsRequest, paymentsRequest, interestsRequest])

const needs = computed(() => needsData.value ?? [])
const contracts = computed(() => contractsData.value ?? [])
const payments = computed(() => paymentsData.value ?? [])
const needsError = computed(() => (needsFetchError.value ? getApiErrorMessage(needsFetchError.value, 'Gagal memuat kebutuhan.') : ''))

// --- Minat agregat (satu endpoint, bukan satu request per kebutuhan) ---
const allInterests = computed(() => interestsData.value ?? [])
const waitingInterests = computed(() => allInterests.value.filter((m: any) => m.status === 'MENUNGGU_RESPON').length)
const runningCount = computed(() => contracts.value.filter((c: any) => ['SIAP_JALAN', 'BERJALAN'].includes(c.status)).length)
const doneCount = computed(() => contracts.value.filter((c: any) => c.status === 'SELESAI').length)
const pendingApproval = ref(0)
// hitung approval pending ringan (tanpa blokir dashboard)
onMounted(async () => {
  try {
    const list = contracts.value.filter((c: any) => ['DIBAYAR_DITAHAN', 'SIAP_JALAN', 'BERJALAN', 'MENUNGGU_KONFIRMASI'].includes(c.status)).slice(0, 5)
    const attendanceLists = await Promise.all(
      list.map((c: any) => api<any[]>(`/attendance/contract/${c.id}`).catch(() => [])),
    )
    pendingApproval.value = attendanceLists
      .flat()
      .filter((attendance: any) => attendance.status === 'MENUNGGU_APPROVAL_PASIEN').length
  } catch { /* abaikan */ }
})

function minatCount(needId: string, status: string) {
  return allInterests.value.filter((m: any) => m.needId === needId && m.status === status).length
}
function totalPelamar(needId: string) {
  return allInterests.value.filter((m: any) => m.needId === needId).length
}
function contractFor(needId: string) {
  return contracts.value.find((c: any) => c.needId === needId) ?? null
}

// --- Panel pelamar: klik redirect ke list perawat di halaman Kelola ---

// kebutuhan fokus untuk stepper
watch(needs, (list) => {
  if (!list.length) { activeNeedId.value = ''; return }
  if (!activeNeedId.value || !list.some((n: any) => n.id === activeNeedId.value)) {
    const active = list.find((n: any) => !['SELESAI', 'DIBATALKAN'].includes(n.status)) ?? list[0]
    activeNeedId.value = active.id
  }
}, { immediate: true })
const activeNeed = computed(() => needs.value.find((n: any) => n.id === activeNeedId.value) ?? null)

function pipeline(n: any) {
  const c = contractFor(n.id)
  const minat = minatCount(n.id, 'MENUNGGU_RESPON') + minatCount(n.id, 'DITERIMA')
  const paid = c && c.status !== 'DEAL_MENUNGGU_BAYAR'
  const done = c && c.status === 'SELESAI'
  return [
    { label: n.status === 'DRAFT' ? 'Draft ●' : 'Tulis ✓', done: n.status !== 'DRAFT', now: n.status === 'DRAFT' },
    { label: 'Publikasi', done: n.status !== 'DRAFT', now: n.status === 'DRAFT' },
    { label: minat ? `Pelamar (${minat})` : 'Pelamar', done: minatCount(n.id, 'DITERIMA') > 0 || !!c, now: n.status === 'DIPUBLIKASIKAN' && !c },
    { label: 'Deal', done: !!c, now: minatCount(n.id, 'DITERIMA') > 0 && !c },
    { label: 'Bayar', done: !!paid, now: !!c && !paid },
    { label: 'Selesai', done: !!done, now: !!paid && !done },
  ]
}

// --- Stepper 6 langkah sesuai perjalanan ---
const steps = computed(() => {
  const n = activeNeed.value
  if (!n) return [
    { label: 'Tulis Kebutuhan', desc: 'Form kebutuhan', done: false, active: true },
    { label: 'Publikasikan', desc: 'Terlihat mitra', done: false, active: false },
    { label: 'Pelamar & Chat', desc: 'Profil + room chat', done: false, active: false },
    { label: 'Pilih & Deal', desc: 'Acc → kesepakatan', done: false, active: false },
    { label: 'Bayar QRIS', desc: 'Upload bukti', done: false, active: false },
    { label: 'Selesai', desc: 'Konfirmasi + review', done: false, active: false },
  ]
  const c = contractFor(n.id)
  const accepted = minatCount(n.id, 'DITERIMA') > 0
  const paid = !!c && c.status !== 'DEAL_MENUNGGU_BAYAR'
  const done = !!c && c.status === 'SELESAI'
  const s1 = true
  const s2 = n.status !== 'DRAFT'
  const s3 = accepted || !!c
  const s4 = !!c
  return [
    { label: 'Tulis Kebutuhan', desc: 'Draft tersimpan', done: s1, active: !s2 },
    { label: 'Publikasikan', desc: 'Dilamar mitra', done: s2, active: s2 && !s3 },
    { label: 'Pelamar & Chat', desc: totalPelamar(n.id) ? `${totalPelamar(n.id)} pelamar` : 'Tunggu lamaran', done: s3, active: s2 && !s3 },
    { label: 'Pilih & Deal', desc: c ? 'Kesepakatan kunci' : 'Pilih → acc', done: s4, active: s3 && !s4 },
    { label: 'Bayar QRIS', desc: c ? statusLabel(c.status) : 'Per perawat', done: !!paid && c.status !== 'DEAL_MENUNGGU_BAYAR', active: !!c && c.status === 'DEAL_MENUNGGU_BAYAR' },
    { label: 'Selesai', desc: done ? 'Beri review' : 'Konfirmasi', done, active: !!paid && !done },
  ]
})
const completedSteps = computed(() => steps.value.filter((s: any) => s.done).length)

const nextAction = computed(() => {
  if (!needs.value.length) return { icon: FileText, title: 'Tulis kebutuhan pertama', description: 'Gunakan satu tombol Tulis Kebutuhan — isi form, simpan Draft, publikasikan.', cta: 'Tulis Kebutuhan', action: goCreate }
  const draft = needs.value.find((n: any) => n.status === 'DRAFT')
  if (draft) return { icon: Megaphone, title: 'Publikasikan kebutuhan', description: `"${draft.serviceType}" masih Draft dan belum dilamar mitra.`, cta: 'Kelola & Publikasikan', action: () => navigateTo(`/family/needs/${draft.id}?edit=1`) }
  if (waitingInterests.value) return { icon: Users, title: `${waitingInterests.value} pelamar menunggu`, description: 'Lihat profil, bandingkan, chat di room masing-masing perawat.', cta: 'Lihat pelamar', action: () => { const m: any = allInterests.value.find((x: any) => x.status === 'MENUNGGU_RESPON'); navigateTo(m ? `/family/needs/${m.needId}#pelamar` : '/family/dashboard') } }
  const acceptedNoDeal = allInterests.value.find((m: any) => m.status === 'DITERIMA' && !contractFor(m.needId))
  if (acceptedNoDeal) return { icon: Handshake, title: 'Pilih & buat Deal', description: 'Perawat sudah Anda pilih (acc). Kunci kesepakatan agar bisa dibayar.', cta: 'Buat Deal', action: () => navigateTo(`/family/needs/${acceptedNoDeal.needId}#pelamar`) }
  const unpaid = contracts.value.find((c: any) => c.status === 'DEAL_MENUNGGU_BAYAR')
  if (unpaid) return { icon: QrCode, title: `Bayar ${formatRupiah(unpaid.totalCost)}`, description: 'QRIS + upload bukti, menunggu verifikasi admin.', cta: 'Bayar sekarang', action: () => navigateTo(`/family/needs/${unpaid.needId}#bayar`) }
  const running = contracts.value.find((c: any) => ['SIAP_JALAN', 'BERJALAN', 'MENUNGGU_KONFIRMASI'].includes(c.status))
  if (running) return { icon: CheckCircle2, title: 'Pantau layanan berjalan', description: 'Setujui absensi, konfirmasi selesai, beri review.', cta: 'Pantau layanan', action: () => navigateTo(`/family/needs/${running.needId}`) }
  return { icon: Plus, title: 'Tulis kebutuhan berikutnya', description: 'Semua layanan selesai. Siap membantu kebutuhan berikutnya?', cta: 'Tulis Kebutuhan', action: goCreate }
})

async function publishNeed(n: any) {
  actingId.value = n.id
  try {
    await api(`/needs/${n.id}/publish`, { method: 'POST' })
    toast.success('Dipublikasikan', 'Mitra aktif kini bisa melamar.')
    await Promise.all([refreshNeeds(), refreshInterests()])
  } catch (e: any) {
    toast.error('Gagal mempublikasikan', getApiErrorMessage(e))
  } finally {
    actingId.value = null
  }
}

async function closeNeed(n: any) {
  if (!confirm('Tutup kebutuhan ini? (tanpa konsekuensi uang sebelum Deal)')) return
  actingId.value = n.id
  try {
    await api(`/needs/${n.id}/close`, { method: 'POST' })
    toast.success('Kebutuhan ditutup', 'Status → Dibatalkan.')
    await refreshNeeds()
  } catch (e: any) {
    toast.error('Gagal menutup', getApiErrorMessage(e))
  } finally {
    actingId.value = null
  }
}
</script>
