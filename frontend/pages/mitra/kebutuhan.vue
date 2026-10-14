<template>
  <div class="container mx-auto px-4 py-8 pb-24 md:pb-8">
    <div class="mb-6">
      <h1 class="text-2xl font-bold tracking-tight md:text-3xl">Kebutuhan Pasien</h1>
      <p class="mt-1 text-sm text-muted-foreground">Ajukan minat pada kebutuhan yang sesuai kompetensi Anda. Satu mitra hanya dapat menangani satu pekerjaan sampai kontrak selesai atau dibatalkan.</p>
    </div>

    <UiCard class="mb-6 p-4">
      <div class="grid gap-3 sm:grid-cols-3">
        <div class="relative">
          <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            v-model="search"
            type="text"
            placeholder="Cari layanan / wilayah..."
            class="flex h-10 w-full rounded-lg border border-input bg-transparent pl-9 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <UiSelect v-model="serviceType">
          <option value="">Semua jenis layanan</option>
          <option value="pendampingan">Pendampingan</option>
          <option value="perawatan">Perawatan medis</option>
          <option value="lansia">Lansia</option>
        </UiSelect>
        <UiInput v-model="region" placeholder="Wilayah (cth: Jakarta)" />
      </div>
    </UiCard>

    <div v-if="pending" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <UiCard v-for="i in 6" :key="i" class="p-5">
        <div class="skeleton-shimmer h-4 w-2/3 rounded" />
        <div class="skeleton-shimmer mt-2 h-3 w-1/2 rounded" />
        <div class="skeleton-shimmer mt-4 h-9 rounded-lg" />
      </UiCard>
    </div>

    <div v-else-if="loadError" class="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
      <p class="text-sm font-medium text-destructive">{{ loadError }}</p>
      <p v-if="isLocked" class="mt-1 text-xs text-muted-foreground">Bayar deposit periode baru agar akun aktif kembali.</p>
      <div class="mt-3 flex flex-wrap justify-center gap-2">
        <NuxtLink v-if="isLocked" to="/mitra/deposit#bayar">
          <UiButton size="sm"><Wallet class="mr-1 h-4 w-4" />Bayar Deposit Sekarang</UiButton>
        </NuxtLink>
        <UiButton variant="outline" size="sm" @click="refresh()">Coba lagi</UiButton>
      </div>
    </div>

    <div v-else-if="!needs.length" class="rounded-xl border p-10 text-center">
      <Briefcase class="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
      <p class="font-medium">Belum ada kebutuhan yang dipublikasikan</p>
      <p class="mt-1 text-sm text-muted-foreground">Coba ubah kata kunci pencarian Anda.</p>
    </div>

    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <UiCard v-for="n in needs" :key="n.id" v-reveal class="card-lift flex flex-col p-5">
        <div class="flex items-start justify-between gap-2">
          <h3 class="font-bold leading-snug">{{ n.serviceType }}</h3>
          <UiBadge :variant="statusVariant(n.status)" class="shrink-0">{{ statusLabel(n.status) }}</UiBadge>
        </div>
        <p class="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin class="h-3 w-3 shrink-0" />
          <span class="truncate">{{ n.locationText }}</span>
        </p>
        <p v-if="n.description" class="mt-2 line-clamp-2 text-[13px] text-muted-foreground">{{ n.description }}</p>
        <div class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span v-if="n.totalHours" class="flex items-center gap-1"><Clock class="h-3.5 w-3.5" />{{ n.totalHours }} jam</span>
          <span v-if="n.budgetEstimate" class="flex items-center gap-1"><Wallet class="h-3.5 w-3.5" />{{ formatRupiah(n.budgetEstimate) }}</span>
          <span v-if="n.startDate" class="flex items-center gap-1"><Calendar class="h-3.5 w-3.5" />{{ formatDate(n.startDate) }}</span>
        </div>
        <div class="mt-4 flex gap-2 pt-1">
          <UiButton size="sm" variant="outline" class="flex-1" @click="openDetail(n)">Detail</UiButton>
          <UiButton size="sm" class="flex-1" :disabled="applyingId === n.id" @click="openApply(n)">
            <Loader2 v-if="applyingId === n.id" class="mr-1 h-3.5 w-3.5 animate-spin" />
            Ajukan Minat
          </UiButton>
        </div>
      </UiCard>
    </div>

    <!-- Dialog detail kebutuhan (data publik secukupnya — tanpa kontak pasien) -->
    <UiDialog :open="detailOpen" @update:open="detailOpen = $event">
      <h2 class="text-xl font-bold">{{ selected?.serviceType }}</h2>
      <p class="mt-1 text-sm text-muted-foreground">{{ selected?.locationText }}</p>
      <div class="mt-4 space-y-2.5 text-sm">
        <div v-if="selected?.description"><span class="font-semibold">Deskripsi:</span> {{ selected.description }}</div>
        <div v-if="selected?.conditionDesc"><span class="font-semibold">Kondisi:</span> {{ selected.conditionDesc }}</div>
        <div v-if="selected?.specialNeeds"><span class="font-semibold">Kebutuhan khusus:</span> {{ selected.specialNeeds }}</div>
        <div v-if="selected?.schedule"><span class="font-semibold">Jadwal:</span> {{ selected.schedule }}</div>
        <div v-if="selected?.frequency"><span class="font-semibold">Frekuensi:</span> {{ selected.frequency }}</div>
        <div v-if="selected?.totalHours"><span class="font-semibold">Total jam:</span> {{ selected.totalHours }} jam</div>
        <div v-if="selected?.budgetEstimate"><span class="font-semibold">Anggaran:</span> {{ formatRupiah(selected.budgetEstimate) }}</div>
      </div>
      <UiButton class="mt-6 w-full" @click="detailOpen = false; openApply(selected)">Ajukan Minat</UiButton>
    </UiDialog>

    <!-- Dialog ajukan minat -->
    <UiDialog :open="applyOpen" @update:open="applyOpen = $event">
      <h2 class="text-xl font-bold">Ajukan Minat</h2>
      <p class="mt-1 text-sm text-muted-foreground">{{ selected?.serviceType }} — {{ selected?.locationText }}</p>
      <form class="mt-5 space-y-4" novalidate @submit.prevent="submitApply">
        <UiTextarea v-model="form.intro" label="Perkenalan singkat" :rows="3" placeholder="Ceritakan siapa Anda dan mengapa cocok..." :error="applyFieldErrors.intro" />
        <UiInput v-model="form.relevantExp" label="Pengalaman relevan" placeholder="cth: 2 tahun home care lansia" />
        <UiInput v-model="form.availability" label="Ketersediaan" placeholder="cth: Senin–Jumat, 08.00–16.00" />
        <div v-if="applyError" class="space-y-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <p>{{ applyError }}</p>
          <NuxtLink v-if="applyLocked" to="/mitra/deposit#bayar" class="block">
            <UiButton type="button" size="sm" class="w-full" @click="applyOpen = false">Bayar Deposit Sekarang</UiButton>
          </NuxtLink>
        </div>
        <div class="flex gap-3">
          <UiButton variant="outline" type="button" class="flex-1" @click="applyOpen = false">Batal</UiButton>
          <UiButton type="submit" class="flex-1" :disabled="applyingId !== null">
            <Loader2 v-if="applyingId" class="mr-2 h-4 w-4 animate-spin" />
            Kirim Minat
          </UiButton>
        </div>
      </form>
    </UiDialog>
  </div>
</template>

<script setup lang="ts">
import { Search, MapPin, Briefcase, Loader2, Clock, Wallet, Calendar } from 'lucide-vue-next'
import { statusLabel, statusVariant, formatRupiah, formatDate } from '@/lib/format'
import { required } from '@/lib/validators'
import { getApiErrorMessage, isForbidden } from '@/composables/useApi'

definePageMeta({ ssr: false, middleware: ['auth-caregiver'] })
useSeoMeta({ title: 'Kebutuhan Pasien', robots: 'noindex, nofollow' })

const api = useApi()
const toast = useToast()

const search = ref('')
const serviceType = ref('')
const region = ref('')

const { data, pending, error: fetchError, refresh } = await useAsyncData(
  'needs-published',
  () => api<any[]>('/needs/published', {
    params: {
      search: search.value || undefined,
      serviceType: serviceType.value || undefined,
      region: region.value || undefined,
    },
  }),
  { watch: [search, serviceType, region], default: () => [] },
)

const needs = computed(() => data.value ?? [])
const isLocked = computed(() => {
  const msg = getApiErrorMessage(fetchError.value, '')
  return /deposit|terkunci/i.test(msg)
})
const loadError = computed(() => (fetchError.value ? getApiErrorMessage(fetchError.value, 'Gagal memuat kebutuhan.') : ''))

watch(loadError, (msg) => {
  if (msg && isLocked.value) toast.warning('Akun terkunci', msg)
})

// Debounce pencarian agar tiap ketik tidak menghantam API
let debounce: ReturnType<typeof setTimeout> | null = null
const searchInput = computed(() => [search.value, serviceType.value, region.value])
watch(searchInput, () => {
  if (debounce) clearTimeout(debounce)
  debounce = setTimeout(() => refresh(), 400)
})

const selected = ref<any>(null)
const detailOpen = ref(false)
const applyOpen = ref(false)
const applyingId = ref<string | null>(null)
const applyError = ref('')
const applyLocked = ref(false)
const applyFieldErrors = ref<Record<string, string>>({})
const form = reactive({ intro: '', relevantExp: '', availability: '' })

function openDetail(n: any) {
  selected.value = n
  detailOpen.value = true
}

function openApply(n: any) {
  if (!n) return
  selected.value = n
  detailOpen.value = false
  form.intro = ''
  form.relevantExp = ''
  form.availability = ''
  applyError.value = ''
  applyLocked.value = false
  applyFieldErrors.value = {}
  applyOpen.value = true
}

async function submitApply() {
  applyError.value = ''
  applyFieldErrors.value = {}
  const introErr = required(form.intro, 'Perkenalan')
  if (introErr) {
    applyFieldErrors.value = { intro: introErr }
    return
  }
  applyingId.value = selected.value.id
  try {
    await api('/interests', {
      method: 'POST',
      body: {
        needId: selected.value.id,
        intro: form.intro.trim(),
        relevantExp: form.relevantExp.trim() || undefined,
        availability: form.availability.trim() || undefined,
      },
    })
    applyOpen.value = false
    toast.success('Minat terkirim', 'Pasien akan meninjau profil Anda.')
  } catch (e: any) {
    const msg = getApiErrorMessage(e, 'Gagal mengirim minat.')
    applyError.value = msg
    applyLocked.value = isForbidden(e)
    if (isForbidden(e)) toast.warning('Tidak bisa mengajukan', msg)
    else toast.error('Gagal mengirim minat', msg)
  } finally {
    applyingId.value = null
  }
}
</script>
