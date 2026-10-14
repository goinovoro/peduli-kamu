<template>
  <button
    type="button"
    class="mb-3 inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
    @click="goBack"
  >
    <ArrowLeft class="h-4 w-4" />
    {{ label }}
  </button>
</template>

<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'

// Kembali ke halaman sebelumnya bila user datang dari navigasi di dalam aplikasi.
// Jika tidak ada riwayat (mis. membuka link langsung), arahkan ke `to`.
const props = withDefaults(defineProps<{ to: string; label?: string }>(), {
  label: 'Kembali',
})

const router = useRouter()

function goBack() {
  const hasAppHistory = typeof window !== 'undefined' && !!window.history.state?.back
  if (hasAppHistory) router.back()
  else navigateTo(props.to)
}
</script>
