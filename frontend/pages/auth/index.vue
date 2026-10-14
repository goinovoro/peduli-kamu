<template>
  <div class="grid min-h-[calc(100vh-4rem)] grid-cols-1 pb-20 md:pb-0 lg:grid-cols-2">
    <!-- Panel brand: desktop saja -->
    <aside class="relative hidden overflow-hidden bg-primary p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
      <div class="absolute inset-0 grid-pattern opacity-10" />
      <div class="gradient-mesh absolute inset-0 opacity-40" />

      <div class="relative z-10 flex items-center gap-2.5">
        <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
          <Heart class="h-5 w-5" />
        </div>
        <span class="text-lg font-bold">Peduli Kamu</span>
      </div>

      <div class="relative z-10 max-w-md">
        <h2 class="text-4xl font-bold leading-tight tracking-tight">
          {{ isLogin ? 'Selamat datang kembali' : 'Bergabung bersama kami' }}
        </h2>
        <p class="mt-4 text-lg leading-relaxed text-primary-foreground/80">
          {{ isLogin
            ? 'Masuk ke akun Anda untuk melanjutkan perawatan orang tercinta.'
            : 'Daftarkan diri Anda untuk mendapatkan akses ke layanan home care terpercaya.' }}
        </p>
      </div>

      <dl class="relative z-10 grid grid-cols-3 gap-6 border-t border-white/15 pt-8">
        <div v-for="stat in stats" :key="stat.label">
          <dt class="text-xs text-primary-foreground/70">{{ stat.label }}</dt>
          <dd class="mt-1 text-2xl font-bold">{{ stat.value }}</dd>
        </div>
      </dl>
    </aside>

    <!-- Panel form -->
    <section class="flex items-start justify-center px-4 py-10 sm:px-6 md:py-16 lg:items-center">
      <div class="w-full max-w-md">
        <div class="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
          <!-- Pemilih mode: Masuk / Daftar -->
          <div role="tablist" aria-label="Pilih mode" class="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
            <button
              type="button"
              role="tab"
              :aria-selected="isLogin"
              :class="tabClass(isLogin)"
              @click="setMode(true)"
            >
              Masuk
            </button>
            <button
              type="button"
              role="tab"
              :aria-selected="!isLogin"
              :class="tabClass(!isLogin)"
              @click="setMode(false)"
            >
              Daftar
            </button>
          </div>

          <div class="mt-6">
            <h1 class="text-2xl font-bold tracking-tight">{{ isLogin ? 'Masuk ke akun Anda' : 'Buat akun baru' }}</h1>
            <p class="mt-1.5 text-sm text-muted-foreground">
              {{ isLogin ? 'Masukkan email dan kata sandi untuk melanjutkan.' : 'Isi data berikut untuk mendaftar.' }}
            </p>
          </div>

          <form class="mt-6 space-y-5" novalidate @submit.prevent="onSubmit">
            <template v-if="!isLogin">
              <div>
                <p class="mb-2 text-sm font-medium">Saya mendaftar sebagai</p>
                <div class="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Peran">
                  <button
                    v-for="option in roleOptions"
                    :key="option.value"
                    type="button"
                    role="radio"
                    :aria-checked="group === option.value"
                    :class="roleCardClass(option.value)"
                    @click="selectGroup(option.value)"
                  >
                    <component
                      :is="option.icon"
                      class="h-5 w-5"
                      :class="group === option.value ? 'text-primary' : 'text-muted-foreground'"
                    />
                    <span class="text-sm font-semibold" :class="group === option.value ? 'text-primary' : ''">
                      {{ option.title }}
                    </span>
                    <span class="text-xs text-muted-foreground">{{ option.subtitle }}</span>
                  </button>
                </div>
              </div>

              <UiInput
                v-model="name"
                label="Nama lengkap"
                autocomplete="name"
                placeholder="Nama sesuai identitas"
                :error="fieldErrors.name"
              />
            </template>

            <UiInput
              v-model="email"
              label="Email"
              type="email"
              autocomplete="email"
              placeholder="nama@email.com"
              :error="fieldErrors.email"
            />

            <UiPasswordInput
              v-model="password"
              label="Kata sandi"
              :autocomplete="isLogin ? 'current-password' : 'new-password'"
              placeholder="Masukkan kata sandi"
              :hint="isLogin ? undefined : 'Minimal 8 karakter.'"
              :error="fieldErrors.password"
            />

            <!-- Data profesional khusus mitra -->
            <section
              v-if="!isLogin && group === 'mitra'"
              class="space-y-4 rounded-xl border bg-muted/30 p-4"
            >
              <div>
                <p class="text-sm font-semibold">Data profesional</p>
                <p class="text-xs text-muted-foreground">Dipakai untuk proses verifikasi dan profil Anda.</p>
              </div>
              <UiInput
                v-model="university"
                label="Universitas"
                placeholder="Asal universitas"
                :error="fieldErrors.university"
              />
              <div class="grid gap-4 sm:grid-cols-2">
                <UiInput
                  v-model="graduationYear"
                  label="Tahun lulus"
                  type="number"
                  placeholder="2023"
                  :error="fieldErrors.graduationYear"
                />
                <UiInput
                  v-model="ratePerHour"
                  label="Tarif per jam (Rp)"
                  type="number"
                  min="1"
                  placeholder="75000"
                  :error="fieldErrors.ratePerHour"
                />
              </div>
              <UiSelect v-model="tier" label="Tingkat layanan">
                <option value="companion">Tier 1: Companion Care</option>
                <option value="skilled">Tier 2: Skilled Medical Care</option>
              </UiSelect>
              <UiInput
                v-model="location"
                label="Lokasi"
                placeholder="Contoh: Jakarta Selatan"
                :error="fieldErrors.location"
              />
            </section>

            <!-- Persetujuan ketentuan: register saja -->
            <div v-if="!isLogin" class="space-y-3">
              <div class="flex items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/[0.04] p-4">
                <div class="flex min-w-0 items-center gap-3">
                  <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <ShieldCheck class="h-5 w-5" />
                  </div>
                  <p class="text-sm font-semibold">{{ roleTerms.title }}</p>
                </div>
                <UiButton type="button" variant="outline" size="sm" class="shrink-0" @click="openTerms">
                  {{ termsRead ? 'Baca ulang' : 'Baca ketentuan lengkap' }}
                </UiButton>
              </div>

              <UiCheckbox v-model="agree" :disabled="!termsRead">
                Saya telah membaca dan menyetujui {{ roleTerms.consent }}.
              </UiCheckbox>
              <p v-if="!termsRead" class="text-xs text-muted-foreground">
                Buka dan baca ketentuan lengkap sampai selesai untuk mengaktifkan persetujuan.
              </p>
              <p v-if="fieldErrors.agree" class="text-xs font-medium text-destructive">{{ fieldErrors.agree }}</p>
            </div>

            <div
              v-if="error"
              role="alert"
              class="flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
            >
              <CircleAlert class="mt-0.5 h-4 w-4 shrink-0" />
              <span>{{ error }}</span>
            </div>

            <UiButton type="submit" class="w-full" size="lg" :disabled="loading">
              <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
              {{ loading ? 'Memproses...' : isLogin ? 'Masuk' : 'Daftar sekarang' }}
            </UiButton>
          </form>
        </div>

        <p class="mt-6 text-center text-sm text-muted-foreground">
          {{ isLogin ? 'Belum punya akun?' : 'Sudah punya akun?' }}
          <button
            type="button"
            class="ml-1 font-semibold text-primary underline-offset-4 transition-colors hover:underline"
            @click="setMode(!isLogin)"
          >
            {{ isLogin ? 'Daftar sekarang' : 'Masuk di sini' }}
          </button>
        </p>
      </div>
    </section>

    <UiDialog
      :open="termsOpen"
      :class="'flex h-[100dvh] max-h-none w-full flex-col overflow-hidden rounded-none border-0 p-0 sm:h-auto sm:max-h-[85vh] sm:max-w-xl sm:rounded-xl sm:border'"
      @update:open="setTermsOpen"
    >
      <header class="shrink-0 border-b px-5 pb-4 pt-6 sm:px-6">
        <p class="text-xs font-bold uppercase tracking-[0.16em] text-primary">Wajib dibaca sebelum mendaftar</p>
        <h2 class="mt-2 pr-8 text-xl font-bold">{{ roleTerms.title }}</h2>
        <p class="mt-1 text-sm text-muted-foreground">{{ roleTerms.audience }}</p>
      </header>
      <div
        ref="termsScrollEl"
        class="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 text-sm leading-relaxed sm:px-6"
        @scroll="checkTermsScroll"
      >
        <section>
          <h3 class="font-semibold">1. Tujuan ketentuan</h3>
          <p class="mt-1 text-muted-foreground">Ketentuan ini menjaga agar aktivitas di Peduli Kamu berlangsung aman, profesional, transparan, dan sesuai peran yang Anda pilih.</p>
        </section>
        <section>
          <h3 class="font-semibold">2. Ketentuan yang berlaku untuk Anda</h3>
          <ul class="mt-2 space-y-2 text-muted-foreground">
            <li v-for="detail in roleTerms.details" :key="detail" class="flex gap-2">
              <span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{{ detail }}</span>
            </li>
          </ul>
        </section>
        <section>
          <h3 class="font-semibold">3. Privasi dan komunikasi</h3>
          <p class="mt-1 text-muted-foreground">Informasi pribadi, kondisi pasien, dokumen, lokasi, dan percakapan hanya boleh digunakan untuk kepentingan layanan. Setiap pihak wajib menjaga komunikasi yang sopan dan bertanggung jawab.</p>
        </section>
        <section>
          <h3 class="font-semibold">4. Pembayaran, pembatalan, dan sengketa</h3>
          <p class="mt-1 text-muted-foreground">Pembayaran dilakukan melalui mekanisme Peduli Kamu. Pembatalan dan masalah layanan mengikuti kesepakatan serta dapat ditangani melalui proses sengketa oleh Admin.</p>
        </section>
        <section>
          <h3 class="font-semibold">5. Persetujuan</h3>
          <p class="mt-1 text-muted-foreground">Dengan mendaftar, Anda menyatakan telah membaca, memahami, dan bersedia mematuhi ketentuan yang berlaku untuk {{ roleTerms.audience.toLowerCase() }}.</p>
        </section>
      </div>
      <footer class="shrink-0 border-t px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:px-6">
        <p v-if="!termsAtEnd" class="mb-3 text-center text-xs font-medium text-amber-700">Scroll sampai bagian paling bawah untuk melanjutkan.</p>
        <UiButton type="button" class="w-full" size="lg" :disabled="!termsAtEnd" @click="finishTerms">
          Saya sudah membaca dan memahami
        </UiButton>
      </footer>
    </UiDialog>
  </div>
</template>

<script setup lang="ts">
import { cn } from '@/lib/utils'
import { registerRole } from '@/lib/roles'
import {
  validateEmail, validatePassword, validateName,
  validateGraduationYear, validatePositiveInt, required, firstError,
} from '@/lib/validators'
import { getApiErrorMessage, isForbidden } from '@/composables/useApi'
import { Heart, Users, Stethoscope, Loader2, ShieldCheck, CircleAlert } from 'lucide-vue-next'

definePageMeta({ ssr: false })
useSeoMeta({ title: 'Masuk / Daftar', robots: 'noindex, nofollow' })

const route = useRoute()
const { login, register } = useAuth()
const toast = useToast()

const stats = [
  { value: '500+', label: 'Perawat' },
  { value: '1.2K+', label: 'Keluarga' },
  { value: '15+', label: 'Kota' },
]

const roleOptions = [
  { value: 'pasien' as const, title: 'Keluarga', subtitle: 'Cari perawat', icon: Users },
  { value: 'mitra' as const, title: 'Perawat', subtitle: 'Jadi mitra', icon: Stethoscope },
]

const qRole = route.query.role as string | undefined
const group = ref<'pasien' | 'mitra'>(qRole === 'caregiver' ? 'mitra' : 'pasien')
const isLogin = ref(true)
const loading = ref(false)
const error = ref('')
const fieldErrors = ref<Record<string, string>>({})

const name = ref('')
const email = ref('')
const password = ref('')
const university = ref('')
const graduationYear = ref('')
const ratePerHour = ref('')
const tier = ref('companion')
const location = ref('')
const agree = ref(false)
const termsOpen = ref(false)
const termsRead = ref(false)
const termsAtEnd = ref(false)
const termsScrollEl = ref<HTMLElement | null>(null)

const roleTerms = computed(() => group.value === 'mitra'
  ? {
      title: 'Ketentuan Mitra Perawat',
      audience: 'Mitra Perawat yang mencari dan memberikan layanan',
      summary: 'Sebelum bergabung, pahami aturan profesional yang melindungi pasien dan menjaga kualitas layanan Anda.',
      consent: 'Ketentuan Platform Mitra Perawat, Kode Etik Layanan, dan Kebijakan Privasi Peduli Kamu',
      points: [
        'Memberikan data, dokumen, kompetensi, dan pengalaman yang benar untuk proses verifikasi.',
        'Menjaga kerahasiaan data pasien dan hanya memberikan layanan sesuai kompetensi serta kesepakatan.',
        'Mematuhi aturan komunikasi, pembayaran, pembatalan, dan penyelesaian sengketa di platform.',
      ],
      details: [
        'Mengisi data identitas, pendidikan, pengalaman, sertifikasi, dan dokumen pendukung dengan benar.',
        'Menjalani proses verifikasi dan aktivasi sesuai ketentuan sebelum mengakses kebutuhan pasien.',
        'Menerima pekerjaan hanya jika sesuai kompetensi, jadwal, wilayah layanan, dan kesepakatan.',
        'Menjalankan layanan secara profesional serta menjaga keselamatan dan kerahasiaan pasien.',
      ],
    }
  : {
      title: 'Ketentuan Pasien / Keluarga',
      audience: 'Pasien atau keluarga yang membutuhkan layanan',
      summary: 'Sebelum membuat kebutuhan layanan, pahami kewajiban Anda agar kerja sama dengan Mitra Perawat berjalan aman dan jelas.',
      consent: 'Ketentuan Platform Pasien, Kode Etik Pengguna, dan Kebijakan Privasi Peduli Kamu',
      points: [
        'Memberikan informasi kebutuhan, kondisi pasien, lokasi, jadwal, dan biaya secara benar.',
        'Menghormati privasi serta ruang lingkup pekerjaan Mitra Perawat sesuai kesepakatan.',
        'Mematuhi aturan pembayaran, pembatalan, komunikasi, dan penyelesaian sengketa di platform.',
      ],
      details: [
        'Memberikan identitas dan informasi kebutuhan pasien yang benar, lengkap, dan dapat dipertanggungjawabkan.',
        'Membuat serta mempublikasikan kebutuhan layanan dengan detail jadwal, lokasi, durasi, dan ruang lingkup yang jelas.',
        'Memilih Mitra Perawat berdasarkan profil, kompetensi, pengalaman, dan informasi yang tersedia di platform.',
        'Membayar sesuai kesepakatan serta memberikan akses dan informasi yang diperlukan selama layanan.',
      ],
    })

function tabClass(active: boolean) {
  return cn(
    'h-9 rounded-md text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
    active
      ? 'bg-background text-foreground shadow-sm'
      : 'text-muted-foreground hover:text-foreground',
  )
}

function roleCardClass(value: 'pasien' | 'mitra') {
  const active = group.value === value
  return cn(
    'flex flex-col items-center gap-1.5 rounded-xl border-2 p-4 text-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
    active
      ? 'border-primary bg-primary/5 ring-2 ring-primary/15'
      : 'border-border hover:border-primary/40 hover:bg-muted/50',
  )
}

function selectGroup(nextGroup: 'pasien' | 'mitra') {
  if (group.value === nextGroup) return
  group.value = nextGroup
  agree.value = false
  termsRead.value = false
  termsAtEnd.value = false
  delete fieldErrors.value.agree
}

function setMode(login: boolean) {
  if (isLogin.value === login) return
  isLogin.value = login
  error.value = ''
  fieldErrors.value = {}
  agree.value = false
  termsRead.value = false
  termsAtEnd.value = false
  termsOpen.value = false
}

function openTerms() {
  termsAtEnd.value = false
  termsOpen.value = true
  nextTick(() => {
    if (termsScrollEl.value) {
      termsScrollEl.value.scrollTop = 0
      checkTermsScroll()
    }
  })
}

function checkTermsScroll() {
  const element = termsScrollEl.value
  if (!element) return
  termsAtEnd.value = element.scrollTop + element.clientHeight >= element.scrollHeight - 8
}

function finishTerms() {
  termsRead.value = true
  termsOpen.value = false
}

function setTermsOpen(open: boolean) {
  // Ketentuan wajib dibaca: tombol X / klik backdrop tidak bisa melewati persetujuan.
  if (!open && !termsRead.value) {
    termsOpen.value = true
    return
  }
  termsOpen.value = open
}

/** Validasi frontend dulu — backend hanya dipanggil jika semua lolos. */
function validate(): boolean {
  const errs: Record<string, string> = {}
  const emailErr = validateEmail(email.value)
  if (emailErr) errs.email = emailErr
  const passErr = validatePassword(password.value)
  if (passErr) errs.password = passErr
  if (!isLogin.value) {
    const nameErr = validateName(name.value)
    if (nameErr) errs.name = nameErr
    if (group.value === 'mitra') {
      const uErr = required(university.value, 'Universitas')
      if (uErr) errs.university = uErr
      const yErr = validateGraduationYear(graduationYear.value)
      if (yErr) errs.graduationYear = yErr
      const rErr = validatePositiveInt(ratePerHour.value, 'Tarif per jam')
      if (rErr) errs.ratePerHour = rErr
      const lErr = required(location.value, 'Lokasi')
      if (lErr) errs.location = lErr
    }
    if (!agree.value) errs.agree = 'Centang persetujuan ketentuan untuk lanjut.'
  }
  fieldErrors.value = errs
  return Object.keys(errs).length === 0
}

async function onSubmit() {
  error.value = ''
  if (!validate()) {
    error.value = firstError(...Object.values(fieldErrors.value)) ?? 'Periksa kembali isian Anda.'
    return
  }
  loading.value = true
  try {
    if (isLogin.value) {
      await login(email.value.trim(), password.value)
      toast.success('Berhasil masuk', 'Selamat datang kembali di Peduli Kamu.')
    } else {
      const payload: Record<string, any> = {
        name: name.value.trim(),
        email: email.value.trim(),
        password: password.value,
        role: registerRole(group.value),
        agreeToTerms: true,
      }
      if (group.value === 'mitra') {
        payload.university = university.value.trim()
        payload.graduationYear = Number(graduationYear.value)
        payload.ratePerHour = Number(ratePerHour.value)
        payload.tier = tier.value
        payload.location = location.value.trim()
      }
      await register(payload)
      toast.success('Pendaftaran berhasil', group.value === 'mitra' ? 'Lengkapi profil profesional untuk verifikasi.' : 'Lengkapi profil pasien Anda.')
    }
  } catch (e: any) {
    const msg = getApiErrorMessage(e)
    error.value = msg
    if (isForbidden(e)) toast.warning('Akun dibatasi', msg)
    else toast.error(isLogin.value ? 'Gagal masuk' : 'Gagal mendaftar', msg)
  } finally {
    loading.value = false
  }
}
</script>
