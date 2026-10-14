<template>
  <div class="container mx-auto px-4 py-8 pb-24 md:pb-8">
    <NuxtLink to="/family/dashboard" class="text-sm text-primary hover:underline">← Kembali ke Dashboard</NuxtLink>

    <div v-if="needPending" class="mt-4 space-y-3">
      <div class="skeleton-shimmer h-8 w-1/2 rounded" />
      <div class="skeleton-shimmer h-24 rounded-xl" />
    </div>
    <div v-else-if="needError" class="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
      <p class="text-sm font-medium text-destructive">{{ needError }}</p>
      <UiButton variant="outline" size="sm" class="mt-3" @click="refreshNeed()">Coba lagi</UiButton>
    </div>

    <template v-else-if="need">
      <!-- HEADER -->
      <div class="mt-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 class="text-2xl font-bold tracking-tight md:text-3xl">{{ need.serviceType }}</h1>
          <p class="mt-1 text-sm text-muted-foreground">{{ need.locationText }} · {{ formatDate(need.startDate) }} · {{ need.totalHours }} jam</p>
        </div>
        <UiBadge :variant="statusVariant(need.status)" class="w-fit">{{ statusLabel(need.status) }}</UiBadge>
      </div>

      <!-- STEPPER MINI -->
      <ol class="mt-4 grid grid-cols-3 gap-1.5 sm:grid-cols-6">
        <li v-for="(s, i) in miniSteps" :key="s.label" class="rounded-lg px-2 py-1.5 text-center text-[11px] font-semibold" :class="s.done ? 'bg-emerald-100 text-emerald-700' : s.now ? 'bg-primary/10 text-primary ring-1 ring-primary/40' : 'bg-muted text-muted-foreground'">
          {{ i + 1 }}. {{ s.label }}
        </li>
      </ol>

      <!-- DETAIL + EDIT -->
      <UiCard class="mt-4 p-5">
        <div v-if="!editMode">
          <div class="grid gap-2 text-sm md:grid-cols-2">
            <p><span class="font-semibold">Untuk:</span> {{ need.forWhom || '-' }}</p>
            <p><span class="font-semibold">Jadwal:</span> {{ need.schedule || '-' }} ({{ need.frequency || '-' }})</p>
            <p><span class="font-semibold">Anggaran:</span> {{ formatRupiah(need.budgetEstimate) }}</p>
            <p><span class="font-semibold">Durasi/hari:</span> {{ need.durationHoursPerDay || '-' }} jam</p>
          </div>
          <p v-if="need.conditionDesc" class="mt-3 text-sm"><span class="font-semibold">Kondisi:</span> {{ need.conditionDesc }}</p>
          <p v-if="need.specialNeeds" class="mt-1 text-sm"><span class="font-semibold">Khusus:</span> {{ need.specialNeeds }}</p>
          <p v-if="need.description" class="mt-1 text-sm text-muted-foreground">{{ need.description }}</p>
          <div v-if="['DRAFT', 'DIPUBLIKASIKAN'].includes(need.status)" class="mt-4 flex flex-wrap gap-2">
            <UiButton v-if="need.status === 'DRAFT'" size="sm" :disabled="acting === 'publish'" @click="publish">Publikasikan</UiButton>
            <UiButton size="sm" variant="outline" @click="startEdit">Edit Kebutuhan</UiButton>
            <UiButton size="sm" variant="outline" :disabled="acting === 'close'" @click="closeNeed">Tutup Kebutuhan</UiButton>
          </div>
          <p v-else class="mt-3 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">Kebutuhan sudah masuk tahap kesepakatan / Deal — tidak bisa diubah lagi (sampai tahap saling setuju saja yang boleh edit).</p>
        </div>

        <!-- FORM EDIT (boleh sampai Deal) -->
        <div v-else>
          <h3 class="font-bold">Edit Kebutuhan <span class="text-xs font-normal text-muted-foreground">(boleh sampai tahap Deal)</span></h3>
          <form class="mt-4 space-y-3" novalidate @submit.prevent="saveEdit">
            <UiInput v-model="editForm.serviceType" label="Jenis layanan *" :error="editErrors.serviceType" />
            <UiInput v-model="editForm.locationText" label="Wilayah layanan *" placeholder="Kota atau kecamatan saja" :error="editErrors.locationText" />
            <div class="grid grid-cols-2 gap-3">
              <UiInput v-model="editForm.totalHours" label="Total jam *" type="number" :error="editErrors.totalHours" />
              <UiInput v-model="editForm.budgetEstimate" label="Anggaran (Rp)" type="number" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <UiInput v-model="editForm.forWhom" label="Untuk siapa" />
              <UiInput v-model="editForm.startDate" label="Tanggal mulai" type="date" />
            </div>
            <UiInput v-model="editForm.schedule" label="Jadwal" />
            <div class="grid grid-cols-2 gap-3">
              <UiInput v-model="editForm.durationHoursPerDay" label="Durasi/hari (jam)" type="number" />
              <UiInput v-model="editForm.frequency" label="Frekuensi" />
            </div>
            <UiTextarea v-model="editForm.conditionDesc" label="Kondisi pasien" :rows="2" />
            <UiTextarea v-model="editForm.specialNeeds" label="Kebutuhan khusus" :rows="2" />
            <UiTextarea v-model="editForm.description" label="Deskripsi tambahan" :rows="3" />
            <div v-if="editError" class="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{{ editError }}</div>
            <div class="flex gap-2">
              <UiButton variant="outline" type="button" class="flex-1" @click="editMode = false">Batal</UiButton>
              <UiButton type="submit" class="flex-1" :disabled="savingEdit">Simpan Perubahan</UiButton>
            </div>
          </form>
        </div>
      </UiCard>

      <!-- PELAMAR + ROOM CHAT -->
      <h2 id="pelamar" class="mb-3 mt-8 scroll-mt-24 text-lg font-bold">Pelamar ({{ interests.length }})</h2>
      <p class="mb-3 text-[13px] text-muted-foreground">Pilih perawat → <b>Terima (acc pasien)</b> → chat negosiasi di room → <b>Buat Deal</b> sebagai tanda saling setuju. Klik nama untuk lihat profil lengkap.</p>
      <div v-if="intPending" class="space-y-2">
        <div class="skeleton-shimmer h-16 rounded-xl" />
        <div class="skeleton-shimmer h-16 rounded-xl" />
      </div>
      <p v-else-if="!interests.length" class="rounded-xl border p-8 text-center text-sm text-muted-foreground">
        Belum ada pelamar. Pastikan kebutuhan sudah <b>Dipublikasikan</b> — mitra aktif akan melamar dan muncul di sini.
      </p>
      <div v-else class="grid gap-4 lg:grid-cols-[300px_1fr]">
        <!-- LIST PELAMAR -->
        <div class="space-y-2">
          <div
            v-for="m in interests"
            :key="m.id"
            class="w-full rounded-xl border p-3 text-left transition-colors"
            :class="selectedId === m.id ? 'border-primary bg-primary/5 ring-1 ring-primary/40' : 'bg-white hover:border-primary/50'"
          >
            <div class="flex cursor-pointer items-center gap-2.5" @click="selectInterest(m)">
              <UiAvatar class="h-10 w-10 shrink-0" :fallback="m.caregiver?.user?.name?.charAt(0) || '?'" />
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-bold">{{ m.caregiver?.user?.name || 'Mitra' }}</p>
                <p class="truncate text-[11px] text-muted-foreground">⭐ {{ Number(m.caregiver?.ratingAvg || 0).toFixed(1) }} · {{ m.caregiver?.totalFinished || 0 }} selesai</p>
              </div>
              <UiBadge :variant="statusVariant(m.status)" class="shrink-0 text-[10px]">{{ statusLabel(m.status) }}</UiBadge>
            </div>
            <p v-if="contract && contract.interestId === m.id" class="mt-1.5 text-[11px] font-bold text-primary">✓ Deal: {{ formatRupiah(contract.totalCost) }}</p>
            <div class="mt-2 flex gap-3 border-t pt-2">
              <NuxtLink :to="`/mitra/profil/${m.caregiverId}`" class="text-[11px] font-medium text-primary hover:underline" @click.stop>Lihat profile →</NuxtLink>
              <button class="text-[11px] font-medium text-primary hover:underline" @click="selectInterest(m)">Chat →</button>
            </div>
          </div>
        </div>

        <!-- ROOM CHAT + AKSI -->
        <UiCard v-if="selected" class="flex min-h-[420px] flex-col p-0">
          <div class="flex flex-wrap items-center justify-between gap-2 border-b p-4">
            <div class="flex items-center gap-3">
              <UiAvatar class="h-11 w-11" :fallback="selected.caregiver?.user?.name?.charAt(0) || '?'" />
              <div>
                <p class="font-bold">{{ selected.caregiver?.user?.name || 'Mitra' }}</p>
                <p class="text-xs text-muted-foreground">{{ selected.caregiver?.serviceArea || selected.caregiver?.location || '-' }} · ⭐ {{ Number(selected.caregiver?.ratingAvg || 0).toFixed(1) }}</p>
                <div class="mt-1 flex flex-wrap gap-2">
                  <NuxtLink :to="`/mitra/profil/${selected.caregiverId}`" class="text-xs font-medium text-primary hover:underline">Lihat profil lengkap →</NuxtLink>
                  <UiBadge :variant="statusVariant(selected.status)" class="text-[10px]">{{ statusLabel(selected.status) }}</UiBadge>
                </div>
              </div>
            </div>
            <div class="flex flex-wrap gap-2">
              <template v-if="selected.status === 'MENUNGGU_RESPON'">
                <UiButton size="sm" :disabled="actingId === selected.id" @click="respond(selected, true)">Pilih & Terima</UiButton>
                <UiButton size="sm" variant="outline" :disabled="actingId === selected.id" @click="respond(selected, false)">Tolak</UiButton>
              </template>
              <UiButton v-if="selected.status === 'DITERIMA' && !contract" size="sm" :disabled="actingId === selected.id" @click="openDeal(selected)">Buat Deal →</UiButton>
              <span v-if="contract && contract.interestId !== selected.id" class="rounded-md bg-muted px-2 py-1 text-[11px] text-muted-foreground">Sudah ada Deal dengan perawat lain</span>
              <span v-if="contract && contract.interestId === selected.id" class="rounded-md bg-emerald-100 px-2 py-1 text-[11px] font-bold text-emerald-700">Perawat terpilih ✓</span>
            </div>
          </div>

          <div class="border-b bg-muted/20 px-4 py-2">
            <p class="text-[11px] text-muted-foreground">Lamaran: “{{ selected.intro || '-' }}”<span v-if="selected.relevantExp"> · Pengalaman: {{ selected.relevantExp }}</span><span v-if="selected.availability"> · Tersedia: {{ selected.availability }}</span></p>
          </div>

          <!-- THREAD -->
          <div class="flex-1 p-4">
            <p v-if="selected.status !== 'DITERIMA'" class="rounded-lg bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">Room chat terbuka setelah Anda <b>Terima</b> pelamar ini. Terima untuk mulai negosiasi jadwal, biaya, dan scope.</p>
            <template v-else>
              <div v-if="chatPending" class="text-xs text-muted-foreground">Memuat percakapan...</div>
              <div v-else ref="chatBox" class="max-h-80 space-y-2 overflow-y-auto pr-1">
                <p v-if="!chatMessages.length" class="text-xs text-muted-foreground">Belum ada pesan. Sapa perawat dan bahas jadwal, durasi, lokasi, scope, biaya sampai saling setuju.</p>
                <div v-for="msg in chatMessages" :key="msg.id" class="flex" :class="msg.senderUserId === me?.id ? 'justify-end' : 'justify-start'">
                  <div class="max-w-[80%] rounded-2xl px-3 py-2 text-[13px]" :class="msg.senderUserId === me?.id ? 'rounded-br-sm bg-primary text-primary-foreground' : 'rounded-bl-sm border bg-background'">
                    {{ msg.body }}
                    <p class="mt-1 text-[10px] opacity-70">{{ formatDateTime(msg.createdAt) }}</p>
                  </div>
                </div>
              </div>
              <form class="mt-3 flex gap-2" @submit.prevent="sendChat(selected)">
                <input v-model="chatBody" type="text" placeholder="Tulis pesan ke {{ selected.caregiver?.user?.name || 'perawat' }}..." class="flex h-10 flex-1 rounded-full border border-input bg-background px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                <UiButton type="submit" size="sm" class="rounded-full" :disabled="sendingChat || !chatBody.trim()">Kirim</UiButton>
              </form>
            </template>
          </div>
        </UiCard>
      </div>

      <!-- KESEPAKATAN & PEMBAYARAN PER PERAWAT -->
      <h2 id="bayar" class="mb-3 mt-8 scroll-mt-24 text-lg font-bold">Kesepakatan & Pembayaran</h2>
      <UiCard v-if="contract" class="p-5">
        <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p class="text-sm text-muted-foreground">Perawat terpilih: <b class="text-foreground">{{ contractCaregiverName }}</b></p>
            <p class="mt-1 font-bold">{{ formatRupiah(contract.totalCost) }} <span class="font-normal text-muted-foreground">({{ contract.totalHours }} jam × {{ formatRupiah(contract.hourlyRate) }}/jam)</span></p>
            <p class="mt-0.5 text-xs text-muted-foreground">{{ contract.schedule || '-' }} · {{ contract.locationText }} · {{ formatDate(contract.startDate) }} → {{ formatDate(contract.endDate) }}</p>
            <div class="mt-2 flex flex-wrap items-center gap-2">
              <UiBadge :variant="statusVariant(contract.status)">{{ statusLabel(contract.status) }}</UiBadge>
              <span class="text-[11px] text-muted-foreground">Tanpa refund jika pasien batal sepihak</span>
            </div>
          </div>
          <div class="flex shrink-0 flex-wrap gap-2">
            <UiButton v-if="contract.status === 'SIAP_JALAN'" size="sm" :disabled="acting === 'start'" @click="startSvc">Mulai Layanan</UiButton>
            <UiButton v-if="contract.status === 'MENUNGGU_KONFIRMASI'" size="sm" :disabled="acting === 'confirm'" @click="confirmSvc">Konfirmasi Selesai</UiButton>
          </div>
        </div>

        <!-- QRIS: bayar per nominal, upload bukti, tunggu acc admin -->
        <div v-if="['DEAL_MENUNGGU_BAYAR'].includes(contract.status)" class="mt-4 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
          <p class="text-sm font-bold">Menunggu pembayaran — bayar sesuai nominal</p>
          <p class="mt-0.5 text-xs text-muted-foreground">Scan QRIS di bawah sebesar <b>{{ formatRupiah(contract.totalCost) }}</b> (tidak bisa diubah, tanpa DP/cicil), lalu upload bukti. Admin akan memverifikasi (acc) sebelum pekerjaan dimulai.</p>
          <div class="mt-3 grid gap-4 md:grid-cols-[220px_1fr]">
            <div class="rounded-lg border bg-white p-3 text-center">
              <p class="text-xl font-extrabold">{{ formatRupiah(contract.totalCost) }}</p>
              <img v-if="payConfig?.qrisImageUrl" :src="payConfig.qrisImageUrl" alt="QRIS" class="mx-auto mt-2 h-44 w-44 rounded-lg border bg-white object-contain p-2" />
              <p v-else class="mt-2 text-[11px] text-muted-foreground">QRIS belum dikonfigurasi admin. Bayar ke QRIS resmi lalu unggah bukti.</p>
            </div>
            <form class="space-y-3" @submit.prevent="submitPay">
              <UiFileInput label="Bukti bayar (JPG/PNG/PDF ≤5MB)" :error="payError" @update:file="payFile = $event" />
              <p v-if="myPayment?.status === 'DITOLAK'" class="rounded-lg bg-destructive/10 p-2 text-xs text-destructive">Ditolak admin: {{ myPayment.rejectReason || '-' }} — silakan upload ulang.</p>
              <UiButton type="submit" class="w-full" :disabled="paying">
                <Loader2 v-if="paying" class="mr-2 h-4 w-4 animate-spin" />
                Saya Sudah Bayar — Kirim Bukti
              </UiButton>
            </form>
          </div>
        </div>
        <div v-else-if="myPayment" class="mt-4 rounded-xl border bg-muted/20 p-4 text-sm">
          <p class="font-bold">Status pembayaran: {{ statusLabel(myPayment.status) }}</p>
          <p v-if="myPayment.status === 'MENUNGGU_VERIFIKASI'" class="mt-1 text-xs text-muted-foreground">Bukti terkirim — menunggu acc (verifikasi) admin. Dana belum diteruskan.</p>
          <p v-if="myPayment.status === 'DIBAYAR_DITAHAN'" class="mt-1 text-xs text-emerald-700">Terverifikasi admin — dana ditahan aman (escrow). Layanan siap dimulai.</p>
          <p v-if="myPayment.status === 'DITOLAK'" class="mt-1 text-xs text-destructive">Ditolak: {{ myPayment.rejectReason || '-' }}</p>
          <a v-if="myPayment.proofImageUrl" :href="uploadUrl(myPayment.proofImageUrl)" target="_blank" rel="noopener" class="mt-1 inline-block text-xs text-primary hover:underline">Lihat bukti saya</a>
        </div>

        <!-- Rekap absensi -->
        <div v-if="recap" class="mt-4 rounded-lg border bg-muted/20 p-3 text-sm">
          <p class="font-semibold">Rekap jam approved: {{ recap.workedMinutes ? Math.floor(recap.workedMinutes / 60) : 0 }} jam {{ recap.workedMinutes ? recap.workedMinutes % 60 : 0 }} mnt ({{ recap.approvedSessions || 0 }} sesi)</p>
        </div>

        <!-- Absensi perlu approve -->
        <div v-if="attendances.length" class="mt-4">
          <p class="mb-2 text-sm font-semibold">Absensi perawat (setujui / tolak per sesi):</p>
          <div class="space-y-2">
            <div v-for="a in attendances" :key="a.id" class="flex flex-col gap-2 rounded-lg border p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p class="font-bold">{{ a.type === 'CLOCK_IN' ? 'Datang' : 'Pulang' }} · {{ formatDateTime(a.serverTime || a.createdAt) }}</p>
                <p class="text-xs text-muted-foreground">Akurasi ±{{ a.accuracyM || '-' }} m · {{ a.insideRadius ? 'Dalam radius' : 'FLAG_LOKASI (di luar radius)' }}</p>
                <a v-if="a.photoUrl" :href="uploadUrl(a.photoUrl)" target="_blank" rel="noopener" class="text-xs text-primary hover:underline">Lihat foto</a>
                <span v-if="a.rejectReason" class="ml-2 text-xs text-destructive">{{ a.rejectReason }}</span>
              </div>
              <div class="flex items-center gap-2">
                <UiBadge :variant="statusVariant(a.status)" class="text-[11px]">{{ statusLabel(a.status) }}</UiBadge>
                <template v-if="a.status === 'MENUNGGU_APPROVAL_PASIEN'">
                  <UiButton size="sm" :disabled="actingId === a.id" @click="reviewAtt(a, true)">Setujui</UiButton>
                  <UiButton size="sm" variant="outline" :disabled="actingId === a.id" @click="askRejectAtt(a)">Tolak</UiButton>
                </template>
              </div>
            </div>
          </div>
        </div>

        <p v-if="myPayment?.status === 'MENUNGGU_VERIFIKASI'" class="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">Bukti pembayaran sedang diperiksa Admin. Pembatalan tersedia setelah keputusan verifikasi.</p>
        <div class="mt-4 flex flex-wrap gap-2 border-t pt-4">
          <UiButton size="sm" variant="outline" @click="reviewOpen = true">Beri Review</UiButton>
          <UiButton size="sm" variant="outline" @click="disputeOpen = true">Lapor / Sengketa</UiButton>
          <UiButton v-if="['DEAL_MENUNGGU_BAYAR', 'DIBAYAR_DITAHAN', 'SIAP_JALAN', 'BERJALAN'].includes(contract.status) && myPayment?.status !== 'MENUNGGU_VERIFIKASI'" size="sm" variant="destructive" @click="cancelAgree = false; cancelOpen = true">Batalkan Kontrak</UiButton>
        </div>
      </UiCard>
      <p v-else class="rounded-xl border p-6 text-center text-sm text-muted-foreground">Belum ada kesepakatan. Pilih pelamar → chat sampai saling setuju → <b>Buat Deal</b>. Setelah Deal, bagian bayar QRIS per perawat muncul di sini.</p>
    </template>

    <!-- Dialog Deal -->
    <UiDialog :open="dealOpen" @update:open="dealOpen = $event">
      <h2 class="text-xl font-bold">Buat Deal — tanda saling setuju</h2>
      <p class="mt-1 text-sm text-muted-foreground">Perawat otomatis terinfo via notifikasi. Setelah Deal, status perawat → <b>menunggu pembayaran</b>. Nominal dikunci server: total = jam × tarif.</p>
      <form class="mt-5 space-y-4" novalidate @submit.prevent="submitDeal">
        <div class="grid grid-cols-2 gap-3">
          <UiInput v-model="deal.totalHours" label="Total jam" type="number" :error="dealErrors.totalHours" />
          <UiInput v-model="deal.hourlyRate" label="Tarif/jam (Rp)" type="number" :error="dealErrors.hourlyRate" />
        </div>
        <p v-if="dealTotal" class="rounded-lg bg-primary/5 p-3 text-sm font-bold text-primary">Total dibayar: {{ formatRupiah(dealTotal) }}</p>
        <UiInput v-model="deal.schedule" label="Jadwal" placeholder="Senin–Jumat, 08.00–16.00" />
        <UiInput v-model="deal.locationText" label="Lokasi layanan" />
        <div class="grid grid-cols-2 gap-3">
          <UiInput v-model="deal.startDate" label="Mulai" type="date" />
          <UiInput v-model="deal.endDate" label="Selesai" type="date" />
        </div>
        <UiTextarea v-model="deal.scope" label="Ruang lingkup" :rows="3" placeholder="Tugas perawat, batasan, dll" />
        <div v-if="dealError" class="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{{ dealError }}</div>
        <div class="flex gap-3">
          <UiButton variant="outline" type="button" class="flex-1" @click="dealOpen = false">Batal</UiButton>
          <UiButton type="submit" class="flex-1" :disabled="actingId !== null">Buat Deal</UiButton>
        </div>
      </form>
    </UiDialog>

    <!-- Dialog tolak absensi -->
    <UiDialog :open="rejectAttOpen" @update:open="rejectAttOpen = $event">
      <h2 class="text-xl font-bold">Tolak absensi</h2>
      <form class="mt-4 space-y-4" @submit.prevent="submitRejectAtt">
        <UiTextarea v-model="rejectReason" label="Alasan" :rows="3" placeholder="cth: datang telat / foto tidak jelas" :error="rejectAttError" />
        <div class="flex gap-3">
          <UiButton variant="outline" type="button" class="flex-1" @click="rejectAttOpen = false">Batal</UiButton>
          <UiButton type="submit" class="flex-1" variant="destructive">Tolak Sesi</UiButton>
        </div>
      </form>
    </UiDialog>

    <!-- Dialog review -->
    <UiDialog :open="reviewOpen" @update:open="reviewOpen = $event">
      <h2 class="text-xl font-bold">Review Perawat</h2>
      <p class="mt-1 text-sm text-muted-foreground">Hanya setelah kontrak SELESAI. 1× per layanan.</p>
      <form class="mt-4 space-y-3" @submit.prevent="submitReview">
        <div v-for="k in reviewKeys" :key="k.key" class="flex items-center justify-between gap-3">
          <span class="text-sm font-medium">{{ k.label }}</span>
          <UiSelect v-model="reviewForm[k.key]" class="w-32">
            <option v-for="v in [1, 2, 3, 4, 5]" :key="v" :value="v">{{ v }} ★</option>
          </UiSelect>
        </div>
        <UiTextarea v-model="reviewForm.comment" label="Komentar" :rows="3" />
        <div v-if="reviewError" class="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{{ reviewError }}</div>
        <div class="flex gap-3">
          <UiButton variant="outline" type="button" class="flex-1" @click="reviewOpen = false">Batal</UiButton>
          <UiButton type="submit" class="flex-1" :disabled="reviewing">Kirim Review</UiButton>
        </div>
      </form>
    </UiDialog>

    <!-- Dialog sengketa -->
    <UiDialog :open="disputeOpen" @update:open="disputeOpen = $event">
      <h2 class="text-xl font-bold">Lapor / Sengketa</h2>
      <form class="mt-4 space-y-4" @submit.prevent="submitDispute">
        <div class="space-y-2">
          <UiLabel>Kategori</UiLabel>
          <UiSelect v-model="disputeForm.category">
            <option value="LAYANAN_TIDAK_SESUAI">Layanan tidak sesuai</option>
            <option value="PERBEDAAN_INFO">Perbedaan info</option>
            <option value="PEMBATALAN">Pembatalan</option>
            <option value="PEMBAYARAN">Pembayaran</option>
            <option value="PERILAKU">Perilaku</option>
            <option value="KOMUNIKASI">Komunikasi</option>
            <option value="LAINNYA">Lainnya</option>
          </UiSelect>
        </div>
        <UiTextarea v-model="disputeForm.description" label="Deskripsi" :rows="4" :error="disputeError" />
        <div class="flex gap-3">
          <UiButton variant="outline" type="button" class="flex-1" @click="disputeOpen = false">Batal</UiButton>
          <UiButton type="submit" class="flex-1" :disabled="disputing">Kirim Laporan</UiButton>
        </div>
      </form>
    </UiDialog>

    <!-- Dialog batal tanpa refund -->
    <UiDialog :open="cancelOpen" @update:open="cancelOpen = $event">
      <h2 class="text-xl font-bold">Batalkan kontrak?</h2>
      <p class="mt-2 text-sm text-muted-foreground">
        {{ myPayment?.status === 'DIBAYAR_DITAHAN'
          ? 'Pembatalan setelah pembayaran terverifikasi tidak dapat di-refund. Dana diteruskan ke perawat sebagai gaji (net setelah biaya admin).'
          : 'Belum ada pembayaran yang terverifikasi, jadi pembatalan ini tidak menimbulkan konsekuensi uang.' }}
      </p>
      <UiCheckbox v-if="myPayment?.status === 'DIBAYAR_DITAHAN'" v-model="cancelAgree" class="mt-4">Saya memahami konsekuensi tanpa-refund.</UiCheckbox>
      <div class="mt-5 flex gap-3">
        <UiButton variant="outline" type="button" class="flex-1" @click="cancelOpen = false">Kembali</UiButton>
        <UiButton variant="destructive" class="flex-1" :disabled="(myPayment?.status === 'DIBAYAR_DITAHAN' && !cancelAgree) || acting !== null" @click="cancelContract">Ya, Batalkan</UiButton>
      </div>
    </UiDialog>
  </div>
</template>

<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'
import { statusLabel, statusVariant, formatRupiah, formatDate, formatDateTime, uploadUrl } from '@/lib/format'
import { required, validatePositiveInt, validateUploadFile } from '@/lib/validators'
import { getApiErrorMessage } from '@/composables/useApi'

definePageMeta({ ssr: false, middleware: ['auth-family'] })
useSeoMeta({ title: 'Detail Kebutuhan', robots: 'noindex, nofollow' })

const route = useRoute()
const id = route.params.id as string
const api = useApi()
const toast = useToast()
const { user: me } = useAuth()

const acting = ref<string | null>(null)
const actingId = ref<string | null>(null)

// --- Need ---
const { data: need, pending: needPending, error: needFetchError, refresh: refreshNeed } = await useAsyncData(`need-${id}`, () => api<any>(`/needs/${id}`))
const needError = computed(() => (needFetchError.value ? getApiErrorMessage(needFetchError.value, 'Gagal memuat kebutuhan.') : ''))

const miniSteps = computed(() => {
  const n: any = need.value
  if (!n) return []
  const c = contract.value
  const accepted = interests.value.some((m: any) => m.status === 'DITERIMA')
  const paid = !!c && c.status !== 'DEAL_MENUNGGU_BAYAR'
  const done = !!c && c.status === 'SELESAI'
  return [
    { label: 'Tulis', done: true, now: false },
    { label: 'Publikasi', done: n.status !== 'DRAFT', now: n.status === 'DRAFT' },
    { label: 'Pelamar', done: accepted || !!c, now: n.status !== 'DRAFT' && !accepted && !c },
    { label: 'Deal', done: !!c, now: accepted && !c },
    { label: 'Bayar', done: paid, now: !!c && !paid },
    { label: 'Selesai', done, now: paid && !done },
  ]
})

async function publish() {
  acting.value = 'publish'
  try {
    await api(`/needs/${id}/publish`, { method: 'POST' })
    toast.success('Dipublikasikan', 'Mitra aktif kini bisa melamar.')
    await refreshNeed()
  } catch (e: any) { toast.error('Gagal', getApiErrorMessage(e)) } finally { acting.value = null }
}
async function closeNeed() {
  if (!confirm('Tutup kebutuhan? (tanpa konsekuensi uang sebelum Deal)')) return
  acting.value = 'close'
  try {
    await api(`/needs/${id}/close`, { method: 'POST' })
    toast.success('Ditutup', 'Status → Dibatalkan.')
    await refreshNeed()
  } catch (e: any) { toast.error('Gagal', getApiErrorMessage(e)) } finally { acting.value = null }
}

// --- Edit (boleh sampai Deal) ---
const editMode = ref(route.query.edit === '1')
const savingEdit = ref(false)
const editError = ref('')
const editErrors = ref<Record<string, string>>({})
const editForm = reactive({ serviceType: '', locationText: '', totalHours: '', budgetEstimate: '', forWhom: '', startDate: '', schedule: '', durationHoursPerDay: '', frequency: '', conditionDesc: '', specialNeeds: '', description: '' })
function fillEdit() {
  const n: any = need.value
  if (!n) return
  Object.assign(editForm, {
    serviceType: n.serviceType || '', locationText: n.locationText || '', totalHours: n.totalHours ?? '',
    budgetEstimate: n.budgetEstimate ?? '', forWhom: n.forWhom || '', startDate: n.startDate ? String(n.startDate).slice(0, 10) : '',
    schedule: n.schedule || '', durationHoursPerDay: n.durationHoursPerDay ?? '', frequency: n.frequency || '',
    conditionDesc: n.conditionDesc || '', specialNeeds: n.specialNeeds || '', description: n.description || '',
  })
}
watch(need, fillEdit, { immediate: true })
function startEdit() { fillEdit(); editErrors.value = {}; editError.value = ''; editMode.value = true }
async function saveEdit() {
  editError.value = ''; editErrors.value = {}
  const errs: Record<string, string> = {}
  const st = required(editForm.serviceType, 'Jenis layanan')
  if (st) errs.serviceType = st
  const loc = required(editForm.locationText, 'Lokasi layanan')
  if (loc) errs.locationText = loc
  const th = validatePositiveInt(editForm.totalHours, 'Total jam')
  if (th) errs.totalHours = th
  editErrors.value = errs
  if (Object.keys(errs).length) return
  savingEdit.value = true
  try {
    const num = (v: any) => (v === '' || v === null || v === undefined ? undefined : Number(v))
    const str = (v: any) => (typeof v === 'string' && v.trim() ? v.trim() : undefined)
    await api(`/needs/${id}`, {
      method: 'PATCH',
      body: {
        serviceType: editForm.serviceType.trim(), locationText: editForm.locationText.trim(), totalHours: Number(editForm.totalHours),
        budgetEstimate: num(editForm.budgetEstimate), forWhom: str(editForm.forWhom),
        startDate: editForm.startDate || undefined, schedule: str(editForm.schedule),
        durationHoursPerDay: num(editForm.durationHoursPerDay), frequency: str(editForm.frequency),
        conditionDesc: str(editForm.conditionDesc), specialNeeds: str(editForm.specialNeeds), description: str(editForm.description),
      },
    })
    toast.success('Kebutuhan diperbarui', 'Perubahan tersimpan.')
    editMode.value = false
    await refreshNeed()
  } catch (e: any) {
    editError.value = getApiErrorMessage(e, 'Gagal menyimpan perubahan.')
  } finally { savingEdit.value = false }
}

// --- Pelamar ---
const { data: intData, pending: intPending, refresh: refreshInterests } = await useAsyncData(`interests-${id}`, () => api<any[]>(`/interests/need/${id}`).catch(() => []), { default: () => [] })
const interests = computed(() => intData.value ?? [])
const selectedId = ref<string | null>(null)
const selected = computed(() => interests.value.find((m: any) => m.id === selectedId.value) ?? interests.value[0] ?? null)
function selectInterest(m: any) {
  selectedId.value = m.id
  chatBody.value = ''
  if (m.status === 'DITERIMA') loadChat(m.id)
  else { chatMessages.value = [] }
}
watch(interests, (list) => {
  if (!list.length) { selectedId.value = null; return }
  if (!selectedId.value || !list.some((m: any) => m.id === selectedId.value)) {
    const pref = list.find((m: any) => m.status === 'DITERIMA') ?? list.find((m: any) => m.status === 'MENUNGGU_RESPON') ?? list[0]
    selectedId.value = pref.id
    if (pref.status === 'DITERIMA') loadChat(pref.id)
  }
}, { immediate: true })

async function respond(m: any, accept: boolean) {
  actingId.value = m.id
  try {
    await api(`/interests/${m.id}/respond`, { method: 'PATCH', body: { accept } })
    toast.success(accept ? 'Perawat dipilih' : 'Pelamar ditolak', accept ? 'Room chat terbuka — negosiasi lalu Buat Deal.' : 'Kebutuhan tetap aktif untuk perawat lain.')
    await refreshInterests()
    if (accept) { selectedId.value = m.id; await loadChat(m.id) }
  } catch (e: any) { toast.error('Gagal', getApiErrorMessage(e)) } finally { actingId.value = null }
}

// --- Room chat ---
const chatBox = ref<HTMLElement | null>(null)
const chatMessages = ref<any[]>([])
const chatPending = ref(false)
const chatBody = ref('')
const sendingChat = ref(false)
async function loadChat(interestId: string) {
  chatPending.value = true
  try {
    chatMessages.value = await api<any[]>(`/messages/interest/${interestId}`)
    await nextTick()
    chatBox.value?.scrollTo({ top: chatBox.value.scrollHeight })
  } catch { chatMessages.value = [] } finally { chatPending.value = false }
}
async function sendChat(m: any) {
  if (!chatBody.value.trim()) return
  sendingChat.value = true
  try {
    await api('/messages', { method: 'POST', body: { interestId: m.id, body: chatBody.value.trim() } })
    chatBody.value = ''
    await loadChat(m.id)
  } catch (e: any) { toast.error('Gagal mengirim', getApiErrorMessage(e)) } finally { sendingChat.value = false }
}

// --- Kontrak (1 per kebutuhan) ---
const { data: contractsData, refresh: refreshContracts } = await useAsyncData('contracts-me-detail', () => api<any[]>('/contracts/me'), { default: () => [] })
const contract = computed(() => (contractsData.value ?? []).find((c: any) => c.needId === id) ?? null)
const contractCaregiverName = computed(() => {
  const c: any = contract.value
  if (!c) return '-'
  const m = interests.value.find((x: any) => x.id === c.interestId)
  return m?.caregiver?.user?.name || 'Perawat terpilih'
})

const dealOpen = ref(false)
const dealFor = ref<any>(null)
const dealError = ref('')
const dealErrors = ref<Record<string, string>>({})
const deal = reactive({ totalHours: '', hourlyRate: '', schedule: '', locationText: '', startDate: '', endDate: '', scope: '' })
const dealTotal = computed(() => {
  const h = Number(deal.totalHours), r = Number(deal.hourlyRate)
  return h > 0 && r > 0 ? h * r : 0
})
function openDeal(m: any) {
  dealFor.value = m
  Object.assign(deal, { totalHours: need.value?.totalHours || '', hourlyRate: m.caregiver?.ratePerHour || '', schedule: need.value?.schedule || '', locationText: need.value?.locationText || '', startDate: '', endDate: '', scope: '' })
  dealError.value = ''
  dealErrors.value = {}
  dealOpen.value = true
}
async function submitDeal() {
  dealError.value = ''
  dealErrors.value = {}
  const errs: Record<string, string> = {}
  const h = validatePositiveInt(deal.totalHours, 'Total jam')
  if (h) errs.totalHours = h
  const r = validatePositiveInt(deal.hourlyRate, 'Tarif/jam')
  if (r) errs.hourlyRate = r
  dealErrors.value = errs
  if (Object.keys(errs).length) return
  actingId.value = dealFor.value.id
  try {
    await api('/contracts', { method: 'POST', body: { interestId: dealFor.value.id, totalHours: Number(deal.totalHours), hourlyRate: Number(deal.hourlyRate), schedule: deal.schedule || undefined, locationText: deal.locationText || undefined, startDate: deal.startDate || undefined, endDate: deal.endDate || undefined, scope: deal.scope || undefined } })
    toast.success('Deal dibuat', 'Perawat terinfo otomatis — lanjut bayar QRIS di bawah.')
    dealOpen.value = false
    await Promise.all([refreshContracts(), refreshNeed(), refreshInterests()])
    await nextTick()
    document.getElementById('bayar')?.scrollIntoView({ behavior: 'smooth' })
  } catch (e: any) {
    dealError.value = getApiErrorMessage(e, 'Gagal membuat Deal.')
  } finally { actingId.value = null }
}

async function startSvc() {
  if (!contract.value) return
  acting.value = 'start'
  try {
    await api(`/contracts/${contract.value.id}/start`, { method: 'POST' })
    toast.success('Layanan berjalan', 'Pantau absensi perawat per sesi.')
    await refreshContracts()
  } catch (e: any) { toast.error('Gagal', getApiErrorMessage(e)) } finally { acting.value = null }
}
async function confirmSvc() {
  if (!contract.value) return
  acting.value = 'confirm'
  try {
    await api(`/contracts/${contract.value.id}/confirm`, { method: 'POST' })
    toast.success('Selesai', 'Beri review untuk perawat Anda.')
    await refreshContracts()
  } catch (e: any) { toast.error('Gagal', getApiErrorMessage(e)) } finally { acting.value = null }
}

// --- Bayar QRIS per perawat (nominal kontrak) ---
const payFile = ref<File | null>(null)
const payError = ref('')
const paying = ref(false)
const { data: payConfig } = await useAsyncData('pay-config-detail', () => api<any>('/payments/config').catch(() => null), { default: () => null })
const { data: myPayments, refresh: refreshPayments } = await useAsyncData('payments-me-detail', () => api<any[]>('/payments/me'), { default: () => [] })
const myPayment = computed(() => {
  const c: any = contract.value
  if (!c) return null
  return (myPayments.value ?? []).filter((p: any) => p.contractId === c.id).sort((a: any, b: any) => +new Date(b.submittedAt) - +new Date(a.submittedAt))[0] ?? null
})
async function submitPay() {
  payError.value = ''
  const err = validateUploadFile(payFile.value, { field: 'Bukti bayar' })
  if (err) { payError.value = err; return }
  if (!contract.value) return
  paying.value = true
  try {
    const fd = new FormData()
    fd.append('proof', payFile.value!)
    fd.append('contractId', contract.value.id)
    await api('/payments/service', { method: 'POST', body: fd })
    toast.success('Bukti terkirim', 'Menunggu acc (verifikasi) admin sebelum pekerjaan dimulai.')
    payFile.value = null
    await refreshPayments()
  } catch (e: any) {
    payError.value = getApiErrorMessage(e, 'Gagal mengunggah bukti.')
  } finally { paying.value = false }
}

// --- Absensi ---
const { data: attData, refresh: refreshAtt } = await useAsyncData(`att-${id}`, async () => {
  const c = (contractsData.value ?? []).find((x: any) => x.needId === id)
  if (!c) return []
  return api<any[]>(`/attendance/contract/${c.id}`).catch(() => [])
}, { default: () => [], watch: [contractsData] })
const attendances = computed(() => attData.value ?? [])
const { data: recap } = await useAsyncData(`recap-${id}`, async () => {
  const c = (contractsData.value ?? []).find((x: any) => x.needId === id)
  if (!c) return null
  return api<any>(`/attendance/contract/${c.id}/recap`).catch(() => null)
}, { watch: [contractsData] })

async function reviewAtt(a: any, approve: boolean) {
  actingId.value = a.id
  try {
    await api(`/attendance/${a.id}/review`, { method: 'PATCH', body: { approve } })
    toast.success(approve ? 'Sesi disetujui' : 'Sesi ditolak', approve ? 'Masuk rekap workedHours.' : 'Tidak dihitung.')
    await refreshAtt()
  } catch (e: any) { toast.error('Gagal', getApiErrorMessage(e)) } finally { actingId.value = null }
}
const rejectAttOpen = ref(false)
const rejectAttTarget = ref<any>(null)
const rejectReason = ref('')
const rejectAttError = ref('')
function askRejectAtt(a: any) {
  rejectAttTarget.value = a
  rejectReason.value = ''
  rejectAttError.value = ''
  rejectAttOpen.value = true
}
async function submitRejectAtt() {
  rejectAttError.value = ''
  const err = required(rejectReason.value, 'Alasan')
  if (err) { rejectAttError.value = err; return }
  rejectAttOpen.value = false
  actingId.value = rejectAttTarget.value.id
  try {
    await api(`/attendance/${rejectAttTarget.value.id}/review`, { method: 'PATCH', body: { approve: false, reason: rejectReason.value.trim() } })
    toast.success('Sesi ditolak', 'Tidak masuk rekap jam.')
    await refreshAtt()
  } catch (e: any) { toast.error('Gagal', getApiErrorMessage(e)) } finally { actingId.value = null }
}

// --- Review ---
const reviewOpen = ref(false)
const reviewing = ref(false)
const reviewError = ref('')
const reviewKeys = [
  { key: 'punctuality', label: 'Ketepatan waktu' },
  { key: 'professionalism', label: 'Profesionalisme' },
  { key: 'communication', label: 'Komunikasi' },
  { key: 'quality', label: 'Kualitas pelayanan' },
  { key: 'overall', label: 'Kepuasan keseluruhan' },
] as const
const reviewForm = reactive({ punctuality: '5', professionalism: '5', communication: '5', quality: '5', overall: '5', comment: '' })
async function submitReview() {
  reviewError.value = ''
  if (!contract.value) return
  reviewing.value = true
  try {
    await api('/reviews', { method: 'POST', body: { contractId: contract.value.id, punctuality: Number(reviewForm.punctuality), professionalism: Number(reviewForm.professionalism), communication: Number(reviewForm.communication), quality: Number(reviewForm.quality), overall: Number(reviewForm.overall), comment: reviewForm.comment || undefined } })
    toast.success('Review terkirim', 'Terima kasih atas penilaian Anda.')
    reviewOpen.value = false
  } catch (e: any) { reviewError.value = getApiErrorMessage(e, 'Gagal mengirim review.') } finally { reviewing.value = false }
}

// --- Sengketa ---
const disputeOpen = ref(false)
const disputing = ref(false)
const disputeError = ref('')
const disputeForm = reactive({ category: 'LAYANAN_TIDAK_SESUAI', description: '' })
async function submitDispute() {
  disputeError.value = ''
  const err = required(disputeForm.description, 'Deskripsi')
  if (err) { disputeError.value = err; return }
  if (!contract.value) { disputeError.value = 'Sengketa membutuhkan kontrak.'; return }
  disputing.value = true
  try {
    await api('/disputes', { method: 'POST', body: { contractId: contract.value.id, category: disputeForm.category, description: disputeForm.description.trim() } })
    toast.success('Laporan terkirim', 'Admin akan memeriksa dan menindaklanjuti.')
    disputeOpen.value = false
    disputeForm.description = ''
  } catch (e: any) { disputeError.value = getApiErrorMessage(e, 'Gagal mengirim laporan.') } finally { disputing.value = false }
}

// --- Batal tanpa refund ---
const cancelOpen = ref(false)
const cancelAgree = ref(false)
async function cancelContract() {
  if (!contract.value) return
  acting.value = 'cancel'
  try {
    await api(`/contracts/${contract.value.id}/cancel-by-patient`, { method: 'POST' })
    toast.success(
      'Dibatalkan',
      myPayment.value?.status === 'DIBAYAR_DITAHAN'
        ? 'Tanpa refund — dana diteruskan ke perawat setelah dipotong biaya admin.'
        : 'Kontrak dibatalkan sebelum pembayaran terverifikasi; tidak ada konsekuensi uang.',
    )
    cancelOpen.value = false
    await Promise.all([refreshContracts(), refreshNeed()])
  } catch (e: any) { toast.error('Gagal', getApiErrorMessage(e)) } finally { acting.value = null }
}
</script>
