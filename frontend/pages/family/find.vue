<template>
  <div class="container mx-auto px-4 py-8 pb-24 md:pb-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold tracking-tight">Temukan Perawat</h1>
      <p class="mt-2 text-muted-foreground">Lihat reputasi (rating, selesai, kompetensi terverifikasi) lalu buat kebutuhan — minat diajukan mitra dari kebutuhan Anda.</p>
    </div>

    <div class="flex flex-col gap-6 lg:flex-row">
      <aside class="w-full shrink-0 lg:w-72">
        <UiCard class="sticky top-20 p-5">
          <div class="mb-5 flex items-center justify-between">
            <h2 class="flex items-center gap-2 font-semibold">
              <SlidersHorizontal class="h-4 w-4" />
              Filter
            </h2>
            <button class="text-xs text-primary hover:underline" @click="resetFilters">Reset</button>
          </div>

          <div class="space-y-5">
            <div class="space-y-2">
              <UiLabel>Cari Nama / Wilayah / Kompetensi</UiLabel>
              <div class="relative">
                <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  v-model="search"
                  type="text"
                  placeholder="Contoh: Lansia, Jakarta..."
                  class="flex h-10 w-full rounded-lg border border-input bg-transparent py-2 pl-9 pr-3 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>

             <UiSeparator />

            <div class="space-y-2">
              <UiLabel>Tingkat Layanan</UiLabel>
              <UiSelect v-model="tier">
                <option value="all">Semua Layanan</option>
                <option value="companion">Tier 1: Companion Care</option>
                <option value="skilled">Tier 2: Skilled Medical Care</option>
              </UiSelect>
            </div>

            <div class="space-y-2">
              <UiLabel>Status STR</UiLabel>
              <UiSelect v-model="strStatus">
                <option value="all">Semua Status</option>
                <option value="STR_AKTIF">STR Aktif</option>
                <option value="MENUNGGU_STR">Menunggu STR</option>
              </UiSelect>
            </div>
          </div>
        </UiCard>
      </aside>

      <div class="min-w-0 flex-1">
        <div class="mb-4 flex items-center justify-between">
          <p class="text-sm text-muted-foreground">
            Menampilkan <span class="font-semibold text-foreground">{{ visibleCaregivers.length }}</span> mitra
          </p>
          <NuxtLink to="/family/needs/new"><UiButton size="sm" variant="outline">Tulis Kebutuhan</UiButton></NuxtLink>
        </div>

        <div v-if="pending" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <UiCard v-for="i in 6" :key="i" class="p-5">
            <div class="skeleton-shimmer h-4 w-2/3 rounded" />
            <div class="skeleton-shimmer mt-2 h-3 w-1/2 rounded" />
            <div class="skeleton-shimmer mt-4 h-16 rounded-lg" />
          </UiCard>
        </div>

        <div v-else-if="visibleCaregivers.length" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <UiCard v-for="c in visibleCaregivers" :key="c.id" class="group flex flex-col overflow-hidden p-5 transition-shadow hover:shadow-md">
            <div class="flex items-start gap-3">
              <UiAvatar class="h-11 w-11 shrink-0" :fallback="c.user?.name?.charAt(0) || 'P'" />
              <div class="min-w-0 flex-1">
                <h3 class="truncate font-bold">{{ c.user?.name }}</h3>
                <div class="mt-0.5 flex items-center gap-1.5">
                  <MapPin class="h-3 w-3 shrink-0 text-muted-foreground" />
                  <span class="truncate text-xs text-muted-foreground">{{ c.serviceArea || c.location || '-' }}</span>
                </div>
                <p class="mt-1 flex items-center gap-1 text-xs">
                  <Star class="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span class="font-bold">{{ Number(c.ratingAvg || 0).toFixed(1) }}</span>
                  <span class="text-muted-foreground">· {{ c.totalFinished || 0 }} selesai</span>
                  <span v-if="c.verificationStatus === 'DISETUJUI'" class="ml-1 inline-flex items-center gap-0.5 font-medium text-emerald-600"><BadgeCheck class="h-3.5 w-3.5" />Terverifikasi</span>
                </p>
              </div>
              <span class="h-2.5 w-2.5 shrink-0 rounded-full" :class="c.isAvailable ? 'bg-emerald-400' : 'bg-gray-300'" :title="c.isAvailable ? 'Tersedia' : 'Tidak tersedia'" />
            </div>

            <p v-if="c.bio" class="mt-3 line-clamp-2 text-[13px] text-muted-foreground">{{ c.bio }}</p>

            <div class="mt-3 flex flex-wrap gap-1.5">
              <UiBadge :variant="c.tier === 'skilled' ? 'info' : 'success'" class="text-xs">
                {{ c.tier === 'skilled' ? 'Skilled Medical' : 'Companion' }}
              </UiBadge>
              <UiBadge v-if="c.strStatus === 'STR_AKTIF'" variant="success" class="text-xs">
                <ShieldCheck class="mr-1 h-3 w-3" />
                STR Aktif
              </UiBadge>
              <UiBadge v-for="k in (c.competencies || '').split(',').map((s: string) => s.trim()).filter(Boolean).slice(0, 3)" :key="k" variant="outline" class="text-xs">{{ k }}</UiBadge>
            </div>

             <UiSeparator class="my-4" />

            <div class="mt-auto flex items-end justify-between">
              <div>
                <div class="text-xl font-bold text-primary">Rp {{ Number(c.ratePerHour || 0).toLocaleString('id-ID') }}</div>
                <div class="text-xs text-muted-foreground">per jam</div>
              </div>
              <NuxtLink :to="`/mitra/profil/${c.id}`">
                <UiButton size="sm">Lihat Profil</UiButton>
              </NuxtLink>
            </div>
          </UiCard>
        </div>

        <div v-if="!pending && (page > 1 || hasMore)" class="mt-6 flex items-center justify-center gap-3">
          <UiButton size="sm" variant="outline" :disabled="page === 1" @click="page--">Sebelumnya</UiButton>
          <span class="text-sm text-muted-foreground">Halaman {{ page }}</span>
          <UiButton size="sm" variant="outline" :disabled="!hasMore" @click="page++">Berikutnya</UiButton>
        </div>

        <div v-if="!pending && !visibleCaregivers.length" class="flex flex-col items-center justify-center py-20 text-center">
          <SearchX class="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 class="text-lg font-semibold">Tidak ada mitra ditemukan</h3>
          <p class="mt-1 text-sm text-muted-foreground">Coba ubah filter pencarian Anda.</p>
        </div>

        <UiCard class="mt-6 border-primary/20 bg-primary/[0.04] p-5">
          <p class="text-sm font-bold">Cara pakai yang benar (bukan booking langsung):</p>
          <ol class="mt-2 list-decimal space-y-1 pl-5 text-[13px] text-muted-foreground">
            <li>Tulis kebutuhan lewat form (Draft → Publikasikan).</li>
            <li>Mitra aktif mengajukan minat + Anda lihat profil lengkap ini.</li>
            <li>Terima minat → chat negosiasi → Deal → bayar QRIS → layanan.</li>
          </ol>
          <NuxtLink to="/family/needs/new"><UiButton size="sm" class="mt-4">Tulis Kebutuhan Sekarang</UiButton></NuxtLink>
        </UiCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Search, MapPin, ShieldCheck, SlidersHorizontal, SearchX, Star, BadgeCheck } from 'lucide-vue-next'

const config = useRuntimeConfig()
const route = useRoute()

const search = ref('')
const debouncedSearch = ref('')
const tier = ref((route.query.tier as string) || 'all')
const strStatus = ref('all')
const page = ref(1)
const PAGE_SIZE = 24

let debounce: ReturnType<typeof setTimeout> | null = null
watch([search, tier, strStatus], () => {
  page.value = 1
  if (debounce) clearTimeout(debounce)
  debounce = setTimeout(() => { debouncedSearch.value = search.value }, 300)
})

const { data: caregivers, pending, refresh } = await useAsyncData(
  'caregivers-public',
  () =>
    $fetch<any[]>(`${config.public.apiBase}/caregivers`, {
        params: {
          search: debouncedSearch.value || undefined,
          tier: tier.value === 'all' ? undefined : tier.value,
          strStatus: strStatus.value === 'all' ? undefined : strStatus.value,
          skip: (page.value - 1) * PAGE_SIZE,
        },
      }).catch(() => []),
  { watch: [debouncedSearch, tier, strStatus, page], default: () => [] },
)

const visibleCaregivers = computed(() => (caregivers.value ?? []).slice(0, PAGE_SIZE))
const hasMore = computed(() => (caregivers.value?.length ?? 0) > PAGE_SIZE)

function resetFilters() {
  if (debounce) clearTimeout(debounce)
  search.value = ''
  debouncedSearch.value = ''
  tier.value = 'all'
  strStatus.value = 'all'
  page.value = 1
  refresh()
}

useSeoMeta({
  title: 'Temukan Perawat Home Care',
  description: 'Lihat profil publik mitra: foto, bio, kompetensi terverifikasi, rating, review, dan wilayah layanan.',
  ogTitle: 'Temukan Perawat — Peduli Kamu',
})
</script>
