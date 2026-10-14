<template>
  <div class="container mx-auto max-w-3xl px-4 py-8 pb-24 md:pb-8">
    <NuxtLink to="/family/dashboard" class="text-sm text-primary hover:underline">← Kembali ke Dashboard</NuxtLink>

    <div class="mt-4">
      <p class="text-xs font-bold uppercase tracking-[0.16em] text-primary">Langkah 1 · Perjalanan layanan</p>
      <h1 class="mt-1 text-2xl font-bold tracking-tight md:text-3xl">Tulis Kebutuhan Anda</h1>
      <p class="mt-2 text-sm leading-relaxed text-muted-foreground">
        Jelaskan kebutuhan home care selengkap mungkin. Tersimpan sebagai
        <b>Draft</b> — setelah itu <b>Publikasikan</b> agar terlihat mitra perawat aktif.
      </p>
    </div>

    <!-- Alur singkat -->
    <ol class="mt-5 grid grid-cols-3 gap-2 text-center sm:grid-cols-6">
      <li v-for="(s, i) in flow" :key="s" class="rounded-lg px-1 py-2 text-[11px] font-semibold" :class="i === 0 ? 'bg-primary/10 text-primary ring-1 ring-primary/30' : 'bg-muted text-muted-foreground'">
        {{ i + 1 }}. {{ s }}
      </li>
    </ol>

    <UiCard class="mt-5 p-5 md:p-7">
      <form class="space-y-4" novalidate @submit.prevent="submit">
        <UiInput v-model="form.serviceType" label="Jenis layanan *" placeholder="cth: Pendampingan lansia" :error="errors.serviceType" />
        <UiInput v-model="form.locationText" label="Wilayah layanan *" placeholder="cth: Jakarta Selatan" :error="errors.locationText" />
        <p class="-mt-2 text-xs text-muted-foreground">Bagikan kota atau kecamatan saja. Alamat lengkap baru diperlukan setelah kesepakatan.</p>
        <div class="grid grid-cols-2 gap-3">
          <UiInput v-model="form.totalHours" label="Total jam *" type="number" min="1" placeholder="40" :error="errors.totalHours" />
          <UiInput v-model="form.budgetEstimate" label="Estimasi anggaran (Rp)" type="number" min="0" placeholder="3000000" />
        </div>
        <p class="rounded-lg bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground">Wilayah, jadwal, anggaran, dan deskripsi ringkas terlihat oleh Mitra aktif. Kondisi medis dan kebutuhan khusus tetap privat; bahas setelah Anda menerima minat melalui chat.</p>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <UiInput v-model="form.forWhom" label="Untuk siapa" placeholder="cth: Ayah (70 th)" />
          <UiInput v-model="form.startDate" label="Tanggal mulai" type="date" />
        </div>
        <UiInput v-model="form.schedule" label="Jadwal" placeholder="cth: Senin–Jumat, 08.00–16.00" />
        <div class="grid grid-cols-2 gap-3">
          <UiInput v-model="form.durationHoursPerDay" label="Durasi / hari (jam)" type="number" min="1" placeholder="8" />
          <UiInput v-model="form.frequency" label="Frekuensi" placeholder="cth: Harian / Mingguan" />
        </div>
        <UiTextarea v-model="form.conditionDesc" label="Kondisi pasien" :rows="2" placeholder="Kondisi / kebutuhan medis yang relevan" />
        <UiTextarea v-model="form.specialNeeds" label="Kebutuhan khusus" :rows="2" placeholder="Pantangan, bahasa, pendampingan khusus, dll" />
        <UiTextarea v-model="form.description" label="Deskripsi ringkas untuk Mitra" :rows="3" placeholder="Jelaskan tugas dan kebutuhan layanan, tanpa alamat lengkap atau identitas pasien..." />

        <UiCheckbox v-model="agree">Saya menyetujui Ketentuan Platform & Kebijakan Privasi.</UiCheckbox>
        <p v-if="errors.agree" class="text-xs font-medium text-destructive">{{ errors.agree }}</p>

        <div v-if="formError" class="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{{ formError }}</div>

        <div class="flex flex-col-reverse gap-2 pt-2 sm:flex-row">
          <NuxtLink to="/family/dashboard" class="flex-1"><UiButton variant="outline" type="button" class="w-full">Batal</UiButton></NuxtLink>
          <UiButton type="submit" class="flex-1" :disabled="saving">
            <Loader2 v-if="saving" class="mr-2 h-4 w-4 animate-spin" />
            Simpan sebagai Draft
          </UiButton>
        </div>
      </form>
    </UiCard>

    <UiCard class="mt-4 border-primary/20 bg-primary/[0.04] p-4 text-[13px] text-muted-foreground">
      <p class="font-bold text-foreground">Setelah disimpan:</p>
      <ol class="mt-1 list-decimal space-y-0.5 pl-5">
        <li>Kebutuhan muncul di Dashboard → <b>Publikasikan</b>.</li>
        <li>Mitra melamar → Anda lihat profil, pilih, dan chat (room chat per perawat).</li>
        <li>Buat Deal → perawat otomatis terinfo → Anda bayar QRIS per perawat → admin verifikasi.</li>
      </ol>
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'
import { required, validatePositiveInt } from '@/lib/validators'
import { getApiErrorMessage } from '@/composables/useApi'

definePageMeta({ ssr: false, middleware: ['auth-family'] })
useSeoMeta({ title: 'Buat Kebutuhan — Pasien', robots: 'noindex, nofollow' })

const api = useApi()
const toast = useToast()

const flow = ['Tulis', 'Publikasi', 'Pelamar & Chat', 'Pilih & Deal', 'Bayar QRIS', 'Selesai']
const saving = ref(false)
const formError = ref('')
const errors = ref<Record<string, string>>({})
const agree = ref(false)
const form = reactive({
  serviceType: '', locationText: '', totalHours: '', budgetEstimate: '',
  forWhom: '', startDate: '', schedule: '', durationHoursPerDay: '',
  frequency: '', conditionDesc: '', specialNeeds: '', description: '',
})

function toPayload() {
  const num = (v: any) => (v === '' || v === null || v === undefined ? undefined : Number(v))
  return {
    serviceType: form.serviceType.trim(),
    locationText: form.locationText.trim(),
    totalHours: Number(form.totalHours),
    budgetEstimate: num(form.budgetEstimate),
    forWhom: form.forWhom.trim() || undefined,
    startDate: form.startDate || undefined,
    schedule: form.schedule.trim() || undefined,
    durationHoursPerDay: num(form.durationHoursPerDay),
    frequency: form.frequency.trim() || undefined,
    conditionDesc: form.conditionDesc.trim() || undefined,
    specialNeeds: form.specialNeeds.trim() || undefined,
    description: form.description.trim() || undefined,
  }
}

async function submit() {
  errors.value = {}
  formError.value = ''
  const errs: Record<string, string> = {}
  const st = required(form.serviceType, 'Jenis layanan')
  if (st) errs.serviceType = st
  const loc = required(form.locationText, 'Lokasi layanan')
  if (loc) errs.locationText = loc
  const th = validatePositiveInt(form.totalHours, 'Total jam')
  if (th) errs.totalHours = th
  if (!agree.value) errs.agree = 'Centang persetujuan ketentuan untuk lanjut.'
  errors.value = errs
  if (Object.keys(errs).length) return
  saving.value = true
  try {
    await api('/consents', { method: 'POST', body: { kind: 'KETENTUAN_PLATFORM', version: 'v1' } })
    const created: any = await api('/needs', { method: 'POST', body: toPayload() })
    toast.success('Draft tersimpan', 'Langkah 1 selesai — publikasikan agar dilamar mitra.')
    await navigateTo(created?.id ? `/family/needs/${created.id}` : '/family/dashboard')
  } catch (e: any) {
    const msg = getApiErrorMessage(e, 'Gagal menyimpan kebutuhan.')
    formError.value = msg
    toast.error('Gagal menyimpan', msg)
  } finally {
    saving.value = false
  }
}
</script>
