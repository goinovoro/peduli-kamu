<template>
  <div class="container mx-auto max-w-3xl px-4 py-8 pb-24 md:pb-8">
    <NuxtLink to="/family/find" class="text-sm text-primary hover:underline">← Kembali cari perawat</NuxtLink>

    <div v-if="pending" class="mt-4 space-y-3">
      <div class="skeleton-shimmer h-8 w-1/2 rounded" />
      <div class="skeleton-shimmer h-48 rounded-xl" />
    </div>
    <div v-else-if="loadError" class="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
      <p class="text-sm font-medium text-destructive">{{ loadError }}</p>
      <UiButton variant="outline" size="sm" class="mt-3" @click="refresh()">Coba lagi</UiButton>
    </div>

    <template v-else-if="c">
      <!-- Header: FOTO / NAMA / GELAR -->
      <div class="mt-4 flex items-start gap-4">
        <UiAvatar class="h-16 w-16" :fallback="c.user?.name?.charAt(0) || '?'" />
        <div class="min-w-0 flex-1">
          <h1 class="text-2xl font-bold tracking-tight">{{ c.user?.name }}</h1>
          <p class="text-sm text-muted-foreground">{{ c.tier === 'skilled' ? 'Skilled Medical Care' : 'Companion Care' }} · {{ c.serviceArea || c.location || '-' }}</p>
          <p class="mt-1 flex flex-wrap items-center gap-2 text-sm">
            <span class="inline-flex items-center gap-1 font-bold"><Star class="h-4 w-4 fill-amber-400 text-amber-400" />{{ Number(c.ratingAvg || 0).toFixed(1) }}</span>
            <span class="text-muted-foreground">· {{ c.totalFinished || 0 }} layanan selesai · {{ reviews.length }} review</span>
            <UiBadge v-if="c.verificationStatus === 'DISETUJUI'" variant="success" class="text-xs"><BadgeCheck class="mr-1 h-3 w-3" />Terverifikasi Peduli Kamu</UiBadge>
            <UiBadge v-if="c.strStatus === 'STR_AKTIF'" variant="success" class="text-xs">STR Aktif</UiBadge>
          </p>
        </div>
      </div>

      <p v-if="c.bio" class="mt-4 leading-relaxed text-[15px]">{{ c.bio }}</p>

       <UiSeparator class="my-6" />

      <!-- Kompetensi -->
      <section>
        <h2 class="font-bold">Kompetensi</h2>
        <div class="mt-2 flex flex-wrap gap-1.5">
          <UiBadge v-for="k in competencies" :key="k" variant="outline">{{ k }}</UiBadge>
          <span v-if="!competencies.length" class="text-sm text-muted-foreground">-</span>
        </div>
      </section>

       <UiSeparator class="my-6" />

      <!-- Pendidikan -->
      <section>
        <h2 class="font-bold">Pendidikan</h2>
        <p class="mt-1 text-sm text-muted-foreground">{{ c.education || `${c.university || '-'} (${c.graduationYear || '-'})` }}</p>
      </section>

       <UiSeparator class="my-6" />

      <!-- Sertifikasi -->
      <section>
        <h2 class="font-bold">Sertifikasi</h2>
        <p class="mt-1 text-sm text-muted-foreground">{{ c.certifications || '-' }} {{ c.strNo ? `· STR: ${c.strNo}` : '' }}</p>
      </section>

       <UiSeparator class="my-6" />

      <!-- Pengalaman -->
      <section>
        <h2 class="font-bold">Pengalaman</h2>
        <p class="mt-1 whitespace-pre-line text-sm text-muted-foreground">{{ c.experience || '-' }}</p>
      </section>

       <UiSeparator class="my-6" />

      <!-- Layanan selesai -->
      <section class="grid grid-cols-3 gap-3 text-center">
        <UiCard class="p-4">
          <p class="text-2xl font-bold">{{ c.totalFinished || 0 }}</p>
          <p class="text-xs text-muted-foreground">Selesai</p>
        </UiCard>
        <UiCard class="p-4">
          <p class="text-2xl font-bold">{{ Number(c.ratingAvg || 0).toFixed(1) }}</p>
          <p class="text-xs text-muted-foreground">Rating</p>
        </UiCard>
        <UiCard class="p-4">
          <p class="text-lg font-bold text-primary">Rp {{ Number(c.ratePerHour || 0).toLocaleString('id-ID') }}</p>
          <p class="text-xs text-muted-foreground">per jam</p>
        </UiCard>
      </section>

       <UiSeparator class="my-6" />

      <!-- Rating & Review -->
      <section>
        <h2 class="font-bold">Rating & Review ({{ reviews.length }})</h2>
        <div v-if="reviewsPending" class="mt-3 space-y-2">
          <div class="skeleton-shimmer h-16 rounded-lg" />
        </div>
        <p v-else-if="!reviews.length" class="mt-2 text-sm text-muted-foreground">Belum ada review publik.</p>
        <div v-else class="mt-3 space-y-2">
          <UiCard v-for="r in reviews" :key="r.id" class="p-4">
            <p class="flex items-center gap-1 text-sm font-bold">
              <Star class="h-4 w-4 fill-amber-400 text-amber-400" />{{ r.overall }}/5
              <span class="font-normal text-muted-foreground">· {{ formatDate(r.createdAt) }}</span>
            </p>
            <p class="mt-1 text-xs text-muted-foreground">Ketepatan {{ r.punctuality }} · Profesional {{ r.professionalism }} · Komunikasi {{ r.communication }} · Kualitas {{ r.quality }}</p>
            <p v-if="r.comment" class="mt-2 text-sm">“{{ r.comment }}”</p>
          </UiCard>
        </div>
      </section>

       <UiSeparator class="my-6" />

      <!-- Wilayah -->
      <section>
        <h2 class="font-bold">Wilayah Layanan</h2>
        <p class="mt-1 text-sm text-muted-foreground">{{ c.serviceArea || c.location || '-' }} · Domisili: {{ c.domicile || '-' }}</p>
      </section>

      <!-- CTA: bukan booking langsung -->
      <UiCard class="mt-8 border-primary/20 bg-primary/[0.04] p-5 text-center">
        <p class="font-bold">Tertarik dengan {{ c.user?.name }}?</p>
        <p class="mx-auto mt-1 max-w-md text-[13px] text-muted-foreground">Buat kebutuhan di dashboard — mitra aktif (termasuk perawat ini) akan mengajukan minat. Anda pilih dari profil + rating seperti ini.</p>
        <div class="mt-4 flex justify-center gap-2">
          <NuxtLink to="/family/needs/new"><UiButton>Tulis Kebutuhan</UiButton></NuxtLink>
          <NuxtLink to="/family/find"><UiButton variant="outline">Lihat Lainnya</UiButton></NuxtLink>
        </div>
      </UiCard>
    </template>
  </div>
</template>

<script setup lang="ts">
import { Star, BadgeCheck } from 'lucide-vue-next'
import { formatDate } from '@/lib/format'

const route = useRoute()
const config = useRuntimeConfig()
const id = route.params.id as string

// Publik, SSR-friendly untuk SEO (tanpa cookie auth)
const profileRequest = useAsyncData(`mitra-profile-${id}`, () =>
  $fetch<any>(`${config.public.apiBase}/caregivers/${id}`),
)
const reviewsRequest = useAsyncData(`mitra-reviews-${id}`, () =>
  $fetch<any[]>(`${config.public.apiBase}/reviews/caregiver/${id}`).catch(() => []),
  { default: () => [] },
)
const [
  { data: c, pending, error: fetchError, refresh },
  { data: reviewData, pending: reviewsPending },
] = await Promise.all([profileRequest, reviewsRequest])

const reviews = computed(() => (reviewData.value ?? []).filter((r: any) => !r.hiddenByAdmin))
const competencies = computed(() => ((c.value?.competencies || '') as string).split(',').map((s: string) => s.trim()).filter(Boolean))
const loadError = computed(() => {
  const e: any = fetchError.value
  return e ? (e?.data?.message || e?.message || 'Gagal memuat profil.') : ''
})

useSeoMeta({
  title: () => (c.value?.user?.name ? `${c.value.user.name} — Profil Mitra` : 'Profil Mitra'),
  description: () => (c.value?.bio || 'Profil publik mitra perawat Peduli Kamu: kompetensi, pengalaman, rating, dan review.').slice(0, 160),
  ogTitle: () => (c.value?.user?.name ? `${c.value.user.name} — Peduli Kamu` : 'Profil Mitra — Peduli Kamu'),
})
</script>
