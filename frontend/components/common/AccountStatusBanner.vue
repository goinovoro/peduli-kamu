<template>
  <div v-if="banner" class="border-b px-4 py-2.5 text-center text-[13px] font-medium" :class="bannerClass" role="alert">
    {{ banner }}
  </div>
</template>

<script setup lang="ts">
// Banner status akun — akun non-Aktif dibatasi (tidak bisa buat kebutuhan/bayar).
// Pesan selaras dengan FLOWUSER-PASIEN #2 + FLOWADMIN #17.
const { user } = useAuth()

const BLOCKED = ['DITANGGUHKAN', 'DIBLOKIR', 'DIBEKUKAN']

const banner = computed(() => {
  const s = user.value?.accountStatus
  if (!s || s === 'AKTIF') return null
  if (s === 'BELUM_LENGKAP') return 'Lengkapi profil Anda untuk mengaktifkan semua fitur.'
  if (s === 'TERKUNCI_PERIODE') return 'Akun terkunci (deposit berakhir). Bayar deposit periode baru untuk membuka akses.'
  if (s === 'TIDAK_AKTIF') return 'Akun Anda nonaktif. Hubungi Admin untuk pengaktifan kembali.'
  if (BLOCKED.includes(s)) return 'Akun Anda dibatasi. Hubungi Admin Peduli Kamu untuk klarifikasi.'
  return `Status akun: ${s}. Beberapa fitur mungkin dibatasi.`
})

const bannerClass = computed(() => {
  const s = user.value?.accountStatus
  if (s === 'BELUM_LENGKAP') return 'bg-sky-50 text-sky-800'
  return 'bg-amber-50 text-amber-800'
})
</script>
