<template>
  <div class="container mx-auto px-4 py-8 pb-24 md:pb-8">
    <LayoutBackLink to="/mitra/dashboard" label="Dashboard" />
    <div class="mb-6">
      <h1 class="text-2xl font-bold tracking-tight md:text-3xl">Profil Profesional Mitra</h1>
      <p class="mt-1 text-sm text-muted-foreground">Lengkapi profil + dokumen → setujui regulasi → ajukan verifikasi (FLOWMITRA-PERAWAT #3–#5).</p>
    </div>

    <!-- Status verifikasi -->
    <UiCard v-if="profile" class="mb-6 p-5" :class="statusCardClass">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-start gap-3">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" :class="statusIconBg">
            <ShieldCheck v-if="profile.verificationStatus === 'DISETUJUI'" class="h-5 w-5 text-emerald-600" />
            <Clock v-else-if="['MENUNGGU', 'DITINJAU'].includes(profile.verificationStatus)" class="h-5 w-5 text-amber-600" />
            <TriangleAlert v-else class="h-5 w-5 text-destructive" />
          </div>
          <div>
            <p class="font-bold">
              Status verifikasi:
              <UiBadge :variant="statusVariant(profile.verificationStatus)" class="ml-1">{{ statusLabel(profile.verificationStatus) }}</UiBadge>
            </p>
            <p v-if="profile.verificationNote" class="mt-1 text-sm text-muted-foreground">Catatan admin: {{ profile.verificationNote }}</p>
            <p v-else class="mt-1 text-sm text-muted-foreground">{{ statusHint }}</p>
          </div>
        </div>
        <div class="flex shrink-0 flex-wrap gap-2">
          <NuxtLink to="/mitra/deposit"><UiButton size="sm" variant="outline">Ke Deposit</UiButton></NuxtLink>
          <NuxtLink to="/mitra/kebutuhan"><UiButton size="sm" variant="outline">Kebutuhan Pasien</UiButton></NuxtLink>
        </div>
      </div>
    </UiCard>

    <div class="grid gap-6 lg:grid-cols-2">
      <!-- Form profil (B-01) -->
      <UiCard class="p-5">
        <h2 class="font-bold">1. Data profesional & rekening</h2>
        <p class="mt-1 text-sm text-muted-foreground">Tampil di preview publik + dinilai pasien saat minat (E-02).</p>
        <form class="mt-4 space-y-4" novalidate @submit.prevent="saveProfile">
          <div class="grid grid-cols-2 gap-3">
            <UiInput v-model="form.domicile" label="Domisili" placeholder="cth: Bandung" />
            <UiInput v-model="form.serviceArea" label="Wilayah layanan" placeholder="cth: Bandung Raya" />
          </div>
          <UiInput v-model="form.education" label="Pendidikan" placeholder="cth: D3 Keperawatan UNPAD" />
          <UiTextarea v-model="form.experience" label="Pengalaman kerja" :rows="2" placeholder="cth: 3 th home care lansia, 1 th RS..." />
          <UiInput v-model="form.competencies" label="Kompetensi" placeholder="cth: Lansia, Home Care, Pasca Operasi" />
          <UiInput v-model="form.certifications" label="Sertifikasi" placeholder="cth: BTCLS, PPGD" />
          <div class="grid grid-cols-2 gap-3">
            <UiInput v-model="form.strNo" label="No. STR" placeholder="No. STR (jika ada)" />
            <div class="space-y-2">
              <UiLabel>Status STR</UiLabel>
              <UiSelect v-model="form.strStatus">
                <option value="MENUNGGU_STR">Menunggu STR</option>
                <option value="STR_AKTIF">STR Aktif</option>
              </UiSelect>
            </div>
          </div>
          <UiTextarea v-model="form.bio" label="Bio profesional" :rows="4" placeholder="Siapa saya / pengalaman / keahlian / pendekatan pelayanan (FLOWTambahan #20)" />
          <div class="border-t pt-4">
            <p class="mb-3 text-sm font-semibold">Rekening payout (wajib valid sebelum gajian J-01)</p>
            <div class="space-y-4">
              <UiInput v-model="form.bankName" label="Nama bank" placeholder="cth: BCA" />
              <div class="grid grid-cols-2 gap-3">
                <UiInput v-model="form.bankAccountNo" label="No. rekening" placeholder="cth: 1234567890" />
                <UiInput v-model="form.bankAccountName" label="Nama pemilik" placeholder="Sesuai buku tabungan" />
              </div>
            </div>
          </div>
          <div class="border-t pt-4">
            <p class="mb-3 text-sm font-semibold">Tarif & ketersediaan</p>
            <div class="grid grid-cols-2 gap-3">
              <UiInput v-model="form.ratePerHour" label="Tarif/jam (Rp)" type="number" />
              <UiInput v-model="form.location" label="Lokasi" placeholder="cth: Jakarta Selatan" />
            </div>
            <UiCheckbox v-model="form.isAvailable" class="mt-3">Tersedia menerima kebutuhan baru</UiCheckbox>
          </div>
          <div v-if="profileError" class="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{{ profileError }}</div>
          <UiButton type="submit" class="w-full" :disabled="savingProfile">
            <Loader2 v-if="savingProfile" class="mr-2 h-4 w-4 animate-spin" />
            Simpan Profil
          </UiButton>
        </form>
      </UiCard>

      <div class="space-y-6">
        <!-- Dokumen (B-02) -->
        <UiCard class="p-5">
          <h2 class="font-bold">2. Dokumen pendukung</h2>
          <p class="mt-1 text-sm text-muted-foreground">KTP / Ijazah / Sertifikat / STR — JPG/PNG/PDF ≤ 5MB, hanya pemilik + admin yang bisa lihat.</p>
          <form class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end" @submit.prevent="uploadDoc">
            <div class="flex-1 space-y-2">
              <UiLabel>Jenis dokumen</UiLabel>
              <UiSelect v-model="docKind">
                <option value="KTP">KTP (Identitas)</option>
                <option value="IJAZAH">Ijazah</option>
                <option value="SERTIFIKAT">Sertifikat</option>
                <option value="STR">STR</option>
                <option value="LAINNYA">Lainnya</option>
              </UiSelect>
            </div>
            <div class="flex-[2]">
              <UiFileInput label="File" :error="docError" @update:file="docFile = $event" />
            </div>
            <UiButton type="submit" :disabled="uploadingDoc">
              <Loader2 v-if="uploadingDoc" class="mr-2 h-4 w-4 animate-spin" />
              Unggah
            </UiButton>
          </form>
          <div class="mt-4 space-y-2">
            <div v-for="d in documents" :key="d.id" class="flex items-center justify-between gap-2 rounded-lg border p-3 text-sm">
              <div class="flex items-center gap-2">
                <a :href="uploadUrl(d.fileUrl)" target="_blank" rel="noopener" class="font-bold text-primary hover:underline">{{ d.kind }}</a>
                <UiBadge :variant="statusVariant(d.status)" class="text-[11px]">{{ statusLabel(d.status) }}</UiBadge>
              </div>
              <span v-if="d.note" class="max-w-48 truncate text-xs text-muted-foreground">{{ d.note }}</span>
            </div>
            <p v-if="!docsPending && !documents.length" class="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">Belum ada dokumen. Minimal 1 dokumen untuk ajukan verifikasi.</p>
          </div>
        </UiCard>

        <!-- Regulasi (B-05) -->
        <UiCard class="p-5">
          <h2 class="font-bold">3. Persetujuan regulasi</h2>
          <p class="mt-1 text-sm text-muted-foreground">Wajib centang semua sebelum ajukan verifikasi (FLOWTambahan #3).</p>
          <div class="mt-3 space-y-2">
            <UiCheckbox v-for="c in consentList" :key="c.kind" v-model="consents[c.kind]">
              {{ c.label }}
              <span v-if="consentMine.includes(c.kind)" class="ml-1 text-[11px] text-emerald-600">✓ tersimpan</span>
            </UiCheckbox>
          </div>
          <div v-if="consentError" class="mt-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{{ consentError }}</div>
          <UiButton class="mt-4 w-full" variant="outline" :disabled="savingConsent" @click="saveConsents">
            <Loader2 v-if="savingConsent" class="mr-2 h-4 w-4 animate-spin" />
            Simpan Persetujuan
          </UiButton>
        </UiCard>

        <!-- Ajukan (B-03) -->
        <UiCard class="p-5">
          <h2 class="font-bold">4. Ajukan verifikasi</h2>
          <p class="mt-1 text-sm text-muted-foreground">Tombol aktif jika profil + dokumen + regulasi lengkap. Pengajuan ganda dicegah (409).</p>
          <div v-if="submitError" class="mt-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{{ submitError }}</div>
          <UiButton class="mt-4 w-full" :disabled="submitting || profile?.verificationStatus === 'DITINJAU'" @click="submitVerification">
            <Loader2 v-if="submitting" class="mr-2 h-4 w-4 animate-spin" />
            {{ profile?.verificationStatus === 'DITINJAU' ? 'Menunggu ditinjau Admin' : 'Ajukan Verifikasi ke Admin' }}
          </UiButton>
        </UiCard>
      </div>
    </div>

    <!-- Preview publik (FLOWTambahan #26) -->
    <UiCard v-if="profile" class="mt-6 p-5">
      <h2 class="font-bold">Preview profil publik</h2>
      <p class="mt-1 text-sm text-muted-foreground">Tampilan ini yang dilihat pasien saat Anda mengajukan minat.</p>
      <div class="mt-4 flex items-start gap-4">
        <UiAvatar class="h-14 w-14" :fallback="profile.user?.name?.charAt(0) || '?'" />
        <div class="min-w-0 flex-1">
          <p class="text-lg font-bold">{{ profile.user?.name }}</p>
          <p class="text-sm text-muted-foreground">⭐ {{ Number(profile.ratingAvg || 0).toFixed(1) }} · {{ profile.totalFinished || 0 }} layanan selesai · {{ profile.serviceArea || profile.location || '-' }}</p>
          <p v-if="profile.bio" class="mt-2 text-sm leading-relaxed">{{ profile.bio }}</p>
          <div class="mt-3 flex flex-wrap gap-1.5">
            <UiBadge v-for="k in (profile.competencies || '').split(',').map((s: string) => s.trim()).filter(Boolean)" :key="k" variant="outline" class="text-xs">{{ k }}</UiBadge>
          </div>
          <div class="mt-3 grid gap-1 text-[13px] text-muted-foreground sm:grid-cols-2">
            <p><span class="font-semibold text-foreground">Pendidikan:</span> {{ profile.education || '-' }}</p>
            <p><span class="font-semibold text-foreground">Sertifikasi:</span> {{ profile.certifications || '-' }} {{ profile.strNo ? `(STR: ${profile.strNo})` : '' }}</p>
            <p class="sm:col-span-2"><span class="font-semibold text-foreground">Pengalaman:</span> {{ profile.experience || '-' }}</p>
          </div>
        </div>
      </div>
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import { ShieldCheck, Clock, TriangleAlert, Loader2 } from 'lucide-vue-next'
import { statusLabel, statusVariant, uploadUrl } from '@/lib/format'
import { validateUploadFile } from '@/lib/validators'
import { getApiErrorMessage } from '@/composables/useApi'

definePageMeta({ ssr: false, middleware: ['auth-caregiver'] })
useSeoMeta({ title: 'Profil Mitra', robots: 'noindex, nofollow' })

const api = useApi()
const toast = useToast()

// --- Profil (B-01) ---
const { data: profile, refresh: refreshProfile } = await useAsyncData('mitra-profile', () => api<any>('/caregivers/me/profile'), { default: () => null })
const form = reactive({
  domicile: '', serviceArea: '', education: '', experience: '', competencies: '',
  certifications: '', strNo: '', strStatus: 'MENUNGGU_STR', bio: '',
  bankName: '', bankAccountNo: '', bankAccountName: '',
  ratePerHour: '', location: '', isAvailable: true,
})
watch(profile, (p) => {
  if (!p) return
  Object.assign(form, {
    domicile: p.domicile || '', serviceArea: p.serviceArea || '', education: p.education || '',
    experience: p.experience || '', competencies: p.competencies || '', certifications: p.certifications || '',
    strNo: p.strNo || '', strStatus: p.strStatus || 'MENUNGGU_STR', bio: p.bio || '',
    bankName: p.bankName || '', bankAccountNo: p.bankAccountNo || '', bankAccountName: p.bankAccountName || '',
    ratePerHour: p.ratePerHour || '', location: p.location || '', isAvailable: p.isAvailable ?? true,
  })
}, { immediate: true })

const savingProfile = ref(false)
const profileError = ref('')
async function saveProfile() {
  profileError.value = ''
  savingProfile.value = true
  try {
    const num = (v: any) => (v === '' || v === null || v === undefined ? undefined : Number(v))
    await api('/caregivers/me/profile', {
      method: 'PATCH',
      body: {
        domicile: form.domicile.trim() || undefined,
        serviceArea: form.serviceArea.trim() || undefined,
        education: form.education.trim() || undefined,
        experience: form.experience.trim() || undefined,
        competencies: form.competencies.trim() || undefined,
        certifications: form.certifications.trim() || undefined,
        strNo: form.strNo.trim() || undefined,
        strStatus: form.strStatus || undefined,
        bio: form.bio.trim() || undefined,
        bankName: form.bankName.trim() || undefined,
        bankAccountNo: form.bankAccountNo.trim() || undefined,
        bankAccountName: form.bankAccountName.trim() || undefined,
        ratePerHour: num(form.ratePerHour),
        location: form.location.trim() || undefined,
        isAvailable: !!form.isAvailable,
      },
    })
    toast.success('Profil tersimpan', 'Data profesional + rekening diperbarui.')
    await refreshProfile()
  } catch (e: any) {
    profileError.value = getApiErrorMessage(e, 'Gagal menyimpan profil.')
    toast.error('Gagal menyimpan', profileError.value)
  } finally { savingProfile.value = false }
}

// --- Dokumen (B-02) ---
const docKind = ref('KTP')
const docFile = ref<File | null>(null)
const docError = ref('')
const uploadingDoc = ref(false)
const { data: docsData, pending: docsPending, refresh: refreshDocs } = await useAsyncData('mitra-docs', () => api<any[]>('/documents/me'), { default: () => [] })
const documents = computed(() => docsData.value ?? [])

async function uploadDoc() {
  docError.value = ''
  const err = validateUploadFile(docFile.value, { field: 'Dokumen' })
  if (err) { docError.value = err; return }
  uploadingDoc.value = true
  try {
    const fd = new FormData()
    fd.append('file', docFile.value!)
    fd.append('kind', docKind.value)
    await api('/documents', { method: 'POST', body: fd })
    toast.success('Dokumen terunggah', `${docKind.value} masuk antrian verifikasi admin.`)
    docFile.value = null
    await refreshDocs()
  } catch (e: any) {
    docError.value = getApiErrorMessage(e, 'Gagal mengunggah dokumen.')
  } finally { uploadingDoc.value = false }
}

// --- Regulasi (B-05) ---
const consentList = [
  { kind: 'KETENTUAN_PLATFORM', label: 'Ketentuan penggunaan platform' },
  { kind: 'KODE_ETIK', label: 'Kode etik layanan' },
  { kind: 'PELAYANAN', label: 'Ketentuan pelayanan' },
  { kind: 'KOMUNIKASI', label: 'Ketentuan komunikasi' },
  { kind: 'PRIVASI', label: 'Perlindungan data pasien & privasi' },
  { kind: 'PEMBATALAN', label: 'Ketentuan pembatalan' },
  { kind: 'PEMBAYARAN', label: 'Ketentuan pembayaran' },
  { kind: 'SENGKETA', label: 'Penyelesaian sengketa' },
]
const consents = reactive<Record<string, boolean>>({})
consentList.forEach((c) => { consents[c.kind] = false })
const { data: consentData, refresh: refreshConsents } = await useAsyncData('mitra-consents', () => api<any[]>('/consents/me').catch(() => []), { default: () => [] })
const consentMine = computed(() => (consentData.value ?? []).map((c: any) => c.kind))
watch(consentData, (list) => {
  (list ?? []).forEach((c: any) => { if (c.kind in consents) consents[c.kind] = true })
}, { immediate: true })

const savingConsent = ref(false)
const consentError = ref('')
async function saveConsents() {
  consentError.value = ''
  const checked = consentList.filter((c) => consents[c.kind])
  if (!checked.length) { consentError.value = 'Centang minimal 1 persetujuan (disarankan semua 8).'; return }
  savingConsent.value = true
  try {
    for (const c of checked) {
      await api('/consents', { method: 'POST', body: { kind: c.kind, version: 'v1' } })
    }
    toast.success('Persetujuan tersimpan', `${checked.length} ketentuan tercatat dengan timestamp.`)
    await refreshConsents()
  } catch (e: any) {
    consentError.value = getApiErrorMessage(e, 'Gagal menyimpan persetujuan.')
  } finally { savingConsent.value = false }
}

// --- Ajukan verifikasi (B-03) ---
const submitting = ref(false)
const submitError = ref('')
async function submitVerification() {
  submitError.value = ''
  submitting.value = true
  try {
    await api('/caregivers/verification/submit', { method: 'POST' })
    toast.success('Pengajuan terkirim', 'Status → Menunggu Verifikasi. Pantau catatan admin di sini.')
    await Promise.all([refreshProfile(), refreshDocs()])
  } catch (e: any) {
    submitError.value = getApiErrorMessage(e, 'Belum bisa mengajukan. Lengkapi profil + dokumen + regulasi.')
    toast.error('Gagal mengajukan', submitError.value)
  } finally { submitting.value = false }
}

// --- Status card ---
const statusCardClass = computed(() => {
  const s = profile.value?.verificationStatus
  if (s === 'DISETUJUI') return 'border-emerald-200 bg-emerald-50/50'
  if (s === 'DITOLAK' || s === 'PERLU_PERBAIKAN') return 'border-destructive/30 bg-destructive/5'
  return 'border-amber-200 bg-amber-50/60'
})
const statusIconBg = computed(() => {
  const s = profile.value?.verificationStatus
  if (s === 'DISETUJUI') return 'bg-emerald-100'
  if (s === 'DITOLAK' || s === 'PERLU_PERBAIKAN') return 'bg-destructive/10'
  return 'bg-amber-100'
})
const statusHint = computed(() => {
  const s = profile.value?.verificationStatus
  if (s === 'DISETUJUI') return 'Terverifikasi — lanjut ke Deposit agar akun Aktif dan bisa lihat kebutuhan.'
  if (s === 'DITINJAU') return 'Sedang ditinjau admin.'
  if (s === 'PERLU_PERBAIKAN') return 'Perbaiki field sesuai catatan admin lalu ajukan ulang.'
  if (s === 'DITOLAK') return 'Pengajuan ditolak — lihat alasan lalu perbaiki dan ajukan ulang.'
  return 'Lengkapi profil + minimal 1 dokumen + regulasi, lalu ajukan verifikasi.'
})
</script>
