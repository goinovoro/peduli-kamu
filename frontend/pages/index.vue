<template>
  <div class="overflow-hidden">
    <section class="relative border-b bg-slate-950 px-4 py-16 text-white md:py-24">
      <div class="absolute inset-0 grid-pattern opacity-10" />
      <div class="absolute -left-24 top-12 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
      <div class="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" />

      <div class="relative z-10 mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.08fr_.92fr]">
        <div>
          <div v-reveal class="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-cyan-100">
            <span class="h-2 w-2 rounded-full bg-emerald-400" />
            Marketplace home care yang terstruktur
          </div>
          <h1 v-reveal="{ delay: 80 }" class="max-w-3xl text-4xl font-bold leading-[1.08] tracking-tight md:text-6xl">
            Temukan bantuan yang tepat.
            <span class="text-cyan-300">Bangun layanan dengan jelas.</span>
          </h1>
          <p v-reveal="{ delay: 150 }" class="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300 md:text-xl">
            Peduli Kamu mempertemukan keluarga yang membutuhkan layanan dengan Mitra Perawat yang siap bekerja, dari kebutuhan pertama sampai layanan selesai.
          </p>
          <div v-reveal="{ delay: 220 }" class="mt-8 flex flex-col gap-3 sm:flex-row">
            <NuxtLink to="/auth?role=family">
              <UiButton size="lg" class="w-full bg-cyan-400 text-slate-950 hover:bg-cyan-300 sm:w-auto">
                Saya membutuhkan perawat
                <ArrowRight class="h-4 w-4" />
              </UiButton>
            </NuxtLink>
            <NuxtLink to="/auth?role=caregiver">
              <UiButton size="lg" variant="outline" class="w-full border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white sm:w-auto">
                Saya mencari pekerjaan
              </UiButton>
            </NuxtLink>
          </div>
          <div v-reveal="{ delay: 290 }" class="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-300">
            <span v-for="point in trustPoints" :key="point.label" class="flex items-center gap-2">
              <component :is="point.icon" class="h-4 w-4 text-emerald-300" />
              {{ point.label }}
            </span>
          </div>
        </div>

        <div v-reveal="{ delay: 160 }" class="relative mx-auto w-full max-w-md">
          <div class="absolute -inset-4 rounded-[2rem] bg-cyan-400/10 blur-2xl" />
          <div class="relative rounded-3xl border border-white/15 bg-white/[0.08] p-5 shadow-2xl backdrop-blur">
            <div class="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">Satu kebutuhan</p>
                <h2 class="mt-1 text-xl font-bold">Pendampingan lansia di rumah</h2>
              </div>
              <span class="rounded-full bg-emerald-400/15 px-2.5 py-1 text-xs font-semibold text-emerald-200">Aktif</span>
            </div>
            <div class="space-y-0 py-3">
              <div v-for="(item, index) in miniFlow" :key="item.label" class="flex gap-3">
                <div class="flex flex-col items-center">
                  <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" :class="index === 2 ? 'bg-cyan-400 text-slate-950' : 'bg-white/10 text-cyan-200'">
                    <component :is="item.icon" class="h-4 w-4" />
                  </div>
                  <div v-if="index < miniFlow.length - 1" class="my-1 h-7 w-px bg-white/15" />
                </div>
                <div class="pb-4 pt-1">
                  <p class="text-sm font-semibold">{{ item.label }}</p>
                  <p class="mt-0.5 text-xs text-slate-400">{{ item.description }}</p>
                </div>
              </div>
            </div>
            <div class="rounded-2xl bg-white/10 p-3 text-xs text-slate-300">
              <span class="font-semibold text-white">Status berikutnya:</span> perawat meninjau kebutuhan dan mengajukan minat.
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="border-b bg-white px-4 py-16 md:py-20">
      <div class="mx-auto max-w-6xl">
        <div v-reveal class="max-w-2xl">
          <p class="text-sm font-bold uppercase tracking-[0.18em] text-primary">Pilih jalur Anda</p>
          <h2 class="mt-3 text-3xl font-bold tracking-tight md:text-4xl">Dua peran, satu proses yang transparan</h2>
          <p class="mt-4 text-muted-foreground">Mulai dari posisi Anda. Setiap langkah punya status yang bisa dipantau, bukan percakapan yang hilang tanpa kepastian.</p>
        </div>
        <div class="mt-10 grid gap-5 lg:grid-cols-2">
          <article v-for="(lane, index) in roleLanes" :key="lane.title" v-reveal="{ delay: index * 100 }" class="group rounded-3xl border p-6 transition-all hover:-translate-y-1 hover:shadow-xl md:p-8" :class="lane.surface">
            <div class="flex items-start justify-between gap-4">
              <div class="flex h-12 w-12 items-center justify-center rounded-2xl" :class="lane.iconSurface">
                <component :is="lane.icon" class="h-6 w-6" />
              </div>
              <span class="rounded-full border px-3 py-1 text-xs font-semibold" :class="lane.pill">{{ lane.eyebrow }}</span>
            </div>
            <h3 class="mt-6 text-2xl font-bold">{{ lane.title }}</h3>
            <p class="mt-2 min-h-12 leading-relaxed text-muted-foreground">{{ lane.description }}</p>
            <div class="mt-6 space-y-3">
              <div v-for="(step, stepIndex) in lane.steps" :key="step" class="flex items-center gap-3 text-sm">
                <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-background text-xs font-bold ring-1 ring-border">{{ stepIndex + 1 }}</span>
                <span :class="stepIndex === 0 ? 'font-semibold text-foreground' : 'text-muted-foreground'">{{ step }}</span>
              </div>
            </div>
            <NuxtLink :to="lane.href" class="mt-8 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
              {{ lane.cta }}
              <ArrowUpRight class="h-4 w-4" />
            </NuxtLink>
          </article>
        </div>
      </div>
    </section>

    <section class="bg-slate-50 px-4 py-16 md:py-20">
      <div class="mx-auto max-w-6xl">
        <div v-reveal class="text-center">
          <p class="text-sm font-bold uppercase tracking-[0.18em] text-primary">Flow layanan</p>
          <h2 class="mt-3 text-3xl font-bold tracking-tight md:text-4xl">Dari kebutuhan sampai reputasi</h2>
          <p class="mx-auto mt-4 max-w-2xl text-muted-foreground">Kedua pihak bertemu di tengah. Tidak ada layanan dimulai sebelum kesepakatan dan pembayaran tercatat.</p>
        </div>
        <div class="relative mx-auto mt-12 grid max-w-5xl gap-4 md:grid-cols-4 md:gap-0">
          <div class="absolute left-[12%] right-[12%] top-7 hidden h-px bg-primary/20 md:block" />
          <div v-for="(step, index) in sharedFlow" :key="step.title" v-reveal="{ delay: index * 70 }" class="relative flex gap-3 md:flex-col md:items-center md:text-center">
            <div class="z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-4 border-slate-50 bg-white text-primary shadow-sm ring-1 ring-primary/20">
              <component :is="step.icon" class="h-5 w-5" />
            </div>
            <div class="pt-1 md:pt-4">
              <p class="text-xs font-bold uppercase tracking-widest text-primary">0{{ index + 1 }}</p>
              <h3 class="mt-1 font-bold">{{ step.title }}</h3>
              <p class="mt-1 text-sm leading-relaxed text-muted-foreground">{{ step.description }}</p>
            </div>
          </div>
        </div>
        <div v-reveal class="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-center text-sm text-amber-900">
          <ShieldCheck class="h-4 w-4 text-amber-600" />
          Verifikasi, kesepakatan, pembayaran, dan riwayat layanan menjadi lapisan kepercayaan untuk kedua pihak.
        </div>
      </div>
    </section>

    <section class="px-4 py-16 md:py-20">
      <div class="mx-auto grid max-w-6xl items-center gap-10 rounded-3xl bg-primary px-6 py-10 text-primary-foreground md:grid-cols-[1fr_auto] md:px-10">
        <div>
          <p class="text-sm font-semibold uppercase tracking-[0.18em] text-primary-foreground/70">Langkah pertama</p>
          <h2 class="mt-2 text-3xl font-bold tracking-tight">Siap memulai perjalanan Anda?</h2>
          <p class="mt-3 max-w-xl text-primary-foreground/80">Buat kebutuhan layanan atau bangun profil profesional Anda. Proses berikutnya akan dipandu berdasarkan status akun.</p>
        </div>
        <div class="flex flex-col gap-3 sm:flex-row md:flex-col">
          <NuxtLink to="/auth?role=family"><UiButton variant="secondary" size="lg" class="w-full sm:w-auto">Mulai sebagai pasien</UiButton></NuxtLink>
          <NuxtLink to="/auth?role=caregiver"><UiButton size="lg" class="w-full border border-white/20 bg-white/10 text-white hover:bg-white/20 sm:w-auto">Gabung sebagai mitra</UiButton></NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ArrowRight, ArrowUpRight, BriefcaseBusiness, ClipboardList, Handshake, HeartHandshake, MessageCircle, ShieldCheck, Star, UserRound, WalletCards } from 'lucide-vue-next'

const config = useRuntimeConfig()

const trustPoints = [
  { icon: ShieldCheck, label: 'Profil dan dokumen terverifikasi' },
  { icon: MessageCircle, label: 'Komunikasi tercatat di platform' },
  { icon: Star, label: 'Review membangun reputasi' },
]

const miniFlow = [
  { icon: ClipboardList, label: 'Kebutuhan dipublikasikan', description: 'Pasien menjelaskan layanan, jadwal, lokasi, dan anggaran.' },
  { icon: UserRound, label: 'Perawat mengajukan minat', description: 'Kandidat menunjukkan pengalaman dan ketersediaan.' },
  { icon: Handshake, label: 'Kesepakatan bersama', description: 'Keduanya menyepakati detail sebelum layanan dimulai.' },
]

const roleLanes = [
  {
    title: 'Saya membutuhkan perawat',
    eyebrow: 'Pasien / pemberi pekerjaan',
    description: 'Jelaskan kebutuhan keluarga, terima minat dari kandidat yang sesuai, lalu pilih dengan informasi yang lengkap.',
    steps: ['Buat dan publikasikan kebutuhan', 'Tinjau profil serta pengalaman perawat', 'Sepakati layanan, bayar, dan pantau progres'],
    href: '/auth?role=family',
    cta: 'Buat akun pasien',
    icon: HeartHandshake,
    iconSurface: 'bg-cyan-100 text-cyan-700',
    surface: 'border-cyan-200 bg-cyan-50/50',
    pill: 'border-cyan-200 bg-white/70 text-cyan-700',
  },
  {
    title: 'Saya mencari pekerjaan',
    eyebrow: 'Mitra Perawat / pencari kerja',
    description: 'Bangun profil profesional, selesaikan verifikasi, dan temukan kebutuhan pasien yang sesuai kompetensi Anda.',
    steps: ['Lengkapi profil dan unggah dokumen', 'Lihat kebutuhan yang relevan', 'Ajukan minat, layani, dan bangun reputasi'],
    href: '/auth?role=caregiver',
    cta: 'Gabung sebagai mitra',
    icon: BriefcaseBusiness,
    iconSurface: 'bg-emerald-100 text-emerald-700',
    surface: 'border-emerald-200 bg-emerald-50/50',
    pill: 'border-emerald-200 bg-white/70 text-emerald-700',
  },
]

const sharedFlow = [
  { icon: ClipboardList, title: 'Kebutuhan', description: 'Pasien mempublikasikan pekerjaan.' },
  { icon: UserRound, title: 'Minat', description: 'Perawat mengajukan diri.' },
  { icon: Handshake, title: 'Deal', description: 'Detail layanan disepakati.' },
  { icon: WalletCards, title: 'Layanan', description: 'Bayar, jalankan, review.' },
]

useSeoMeta({
  title: 'Peduli Kamu | Temukan dan Berikan Layanan Home Care',
  description: 'Platform yang mempertemukan keluarga yang membutuhkan layanan home care dengan Mitra Perawat profesional.',
  ogTitle: 'Peduli Kamu | Home Care yang Terstruktur',
  ogDescription: 'Mulai dari kebutuhan, minat, kesepakatan, hingga layanan selesai dalam satu alur yang jelas.',
  ogUrl: config.public.siteUrl as string,
  twitterCard: 'summary_large_image',
})
</script>
