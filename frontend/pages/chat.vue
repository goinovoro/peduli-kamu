<template>
  <div class="container mx-auto px-4 py-8 pb-24 md:pb-8">
    <div class="mb-6">
      <h1 class="text-2xl font-bold tracking-tight md:text-3xl">Chat</h1>
      <p class="mt-1 text-sm text-muted-foreground">
        {{ isMitra ? 'Negosiasi dengan pasien dari minat yang diterima.' : 'Negosiasi dengan mitra dari minat yang Anda terima.' }}
        Chat hanya terbuka setelah minat <b>DITERIMA</b>.
      </p>
    </div>

    <div v-if="pending" class="grid gap-4 md:grid-cols-3">
      <div class="skeleton-shimmer h-64 rounded-xl" />
      <div class="skeleton-shimmer h-64 rounded-xl md:col-span-2" />
    </div>
    <div v-else-if="loadError" class="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
      <p class="text-sm font-medium text-destructive">{{ loadError }}</p>
      <UiButton variant="outline" size="sm" class="mt-3" @click="refreshAll()">Coba lagi</UiButton>
    </div>
    <div v-else-if="!threads.length" class="rounded-xl border p-10 text-center">
      <MessageCircle class="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
      <p class="font-medium">Belum ada percakapan</p>
      <p class="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
        {{ isMitra ? 'Ajukan minat di Cari Kerja. Setelah pasien menerima, chat muncul di sini.' : 'Terima minat di Dashboard → Minat & Chat. Setelah diterima, chat muncul di sini.' }}
      </p>
      <NuxtLink :to="isMitra ? '/mitra/kebutuhan' : '/family/dashboard'">
        <UiButton class="mt-4" size="sm">{{ isMitra ? 'Cari Kerja' : 'Ke Dashboard' }}</UiButton>
      </NuxtLink>
    </div>

    <div v-else class="grid gap-4 md:grid-cols-3">
      <!-- Daftar thread -->
      <UiCard v-show="!selected || isDesktop" class="p-2 md:col-span-1">
        <div class="p-2">
          <input v-model="search" type="text" placeholder="Cari nama / kebutuhan..." class="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </div>
        <div class="max-h-[60vh] space-y-1 overflow-y-auto p-2">
          <button
            v-for="t in filtered"
            :key="t.id"
            class="flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors hover:bg-muted/60"
            :class="selected?.id === t.id ? 'bg-primary/10 ring-1 ring-primary/40' : ''"
            @click="openThread(t)"
          >
            <UiAvatar class="h-10 w-10 shrink-0" :fallback="threadName(t).charAt(0) || '?'" />
            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between gap-2">
                <p class="truncate text-sm font-bold">{{ threadName(t) }}</p>
                <UiBadge :variant="statusVariant(t.status)" class="shrink-0 text-[10px]">{{ statusLabel(t.status) }}</UiBadge>
              </div>
              <p class="truncate text-xs text-muted-foreground">{{ t.need?.serviceType || needTitle(t.needId) }}</p>
              <p class="mt-0.5 truncate text-xs text-muted-foreground">{{ t.lastBody || t.intro || 'Belum ada pesan' }}</p>
            </div>
          </button>
        </div>
      </UiCard>

      <!-- Ruang chat -->
      <UiCard v-show="selected || isDesktop" class="flex min-h-[50vh] flex-col p-4 md:col-span-2">
        <div v-if="!selected" class="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          Pilih percakapan di sebelah kiri.
        </div>
        <template v-else>
          <div class="flex items-center gap-3 border-b pb-3">
            <UiButton size="sm" variant="outline" class="md:hidden" @click="selected = null">←</UiButton>
            <UiAvatar class="h-10 w-10" :fallback="threadName(selected).charAt(0) || '?'" />
            <div class="min-w-0 flex-1">
              <p class="truncate font-bold">{{ threadName(selected) }}</p>
              <p class="truncate text-xs text-muted-foreground">{{ selected.need?.serviceType || needTitle(selected.needId) }}</p>
            </div>
            <UiBadge :variant="statusVariant(selected.status)" class="text-[11px]">{{ statusLabel(selected.status) }}</UiBadge>
          </div>

          <div v-if="selected.status !== 'DITERIMA'" class="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
            Minat masih <b>{{ statusLabel(selected.status) }}</b> — chat terkunci sampai diterima. Backend menolak kirim (403) sebelum DITERIMA.
          </div>

          <div ref="scrollBox" class="mt-3 max-h-[50vh] flex-1 space-y-2 overflow-y-auto">
            <div v-if="chatPending" class="text-center text-xs text-muted-foreground">Memuat...</div>
            <div v-for="msg in messages" :key="msg.id" class="flex" :class="msg.senderUserId === me?.id ? 'justify-end' : 'justify-start'">
              <div class="max-w-[80%] rounded-lg px-3 py-2 text-[13px]" :class="msg.senderUserId === me?.id ? 'bg-primary text-primary-foreground' : 'border bg-background'">
                {{ msg.body }}
                <p class="mt-1 text-[10px] opacity-70">{{ formatDateTime(msg.createdAt) }}</p>
              </div>
            </div>
            <p v-if="!chatPending && !messages.length && selected.status === 'DITERIMA'" class="text-center text-xs text-muted-foreground">Belum ada pesan. Mulai negosiasi jadwal, biaya, dan scope.</p>
          </div>

          <form class="mt-3 flex gap-2 border-t pt-3" @submit.prevent="send">
            <input v-model="body" type="text" placeholder="Tulis pesan..." :disabled="selected.status !== 'DITERIMA'" class="flex h-10 flex-1 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50" />
            <UiButton type="submit" size="sm" :disabled="sending || !body.trim() || selected.status !== 'DITERIMA'">
              <Loader2 v-if="sending" class="mr-1 h-3.5 w-3.5 animate-spin" />
              Kirim
            </UiButton>
          </form>

          <div class="mt-3 flex flex-wrap gap-2 border-t pt-3">
            <NuxtLink v-if="!isMitra && selected.status === 'DITERIMA'" :to="`/family/needs/${selected.needId}`"><UiButton size="sm">Buat Deal →</UiButton></NuxtLink>
            <UiButton size="sm" variant="outline" @click="reloadMessages()">Muat ulang</UiButton>
          </div>
        </template>
      </UiCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { MessageCircle, Loader2 } from 'lucide-vue-next'
import { toRoleGroup } from '@/lib/roles'
import { statusLabel, statusVariant, formatDateTime } from '@/lib/format'
import { getApiErrorMessage } from '@/composables/useApi'

definePageMeta({ ssr: false, middleware: ['auth'] })
useSeoMeta({ title: 'Chat', robots: 'noindex, nofollow' })

const api = useApi()
const toast = useToast()
const { user: me } = useAuth()
const isMitra = computed(() => toRoleGroup(me.value?.role) === 'mitra')

const search = ref('')
const threads = ref<any[]>([])
const needNames = ref<Record<string, string>>({})
const pending = ref(true)
const loadError = ref('')
const selected = ref<any>(null)
const messages = ref<any[]>([])
const chatPending = ref(false)
const body = ref('')
const sending = ref(false)
const scrollBox = ref<HTMLElement | null>(null)
const isDesktop = ref(false)

function threadName(t: any) {
  if (isMitra.value) return t.need?.serviceType || needNames.value[t.needId] || 'Pasien'
  return t.caregiver?.user?.name || 'Mitra'
}
function needTitle(needId: string) {
  return needNames.value[needId] || 'Kebutuhan'
}
const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return threads.value
  return threads.value.filter((t: any) =>
    threadName(t).toLowerCase().includes(q) ||
    (t.need?.serviceType || needNames.value[t.needId] || '').toLowerCase().includes(q),
  )
})

async function load() {
  pending.value = true
  loadError.value = ''
  try {
    if (isMitra.value) {
      const mine = await api<any[]>('/interests/me')
      threads.value = mine
      mine.forEach((m: any) => {
        if (m.need?.serviceType) needNames.value[m.needId] = m.need.serviceType
      })
    } else {
      const needsList = await api<any[]>('/needs/me')
      needsList.forEach((n: any) => { needNames.value[n.id] = n.serviceType })
      const per = await Promise.all(needsList.map((n: any) => api<any[]>(`/interests/need/${n.id}`).catch(() => [])))
      threads.value = per.flat()
    }
  } catch (e: any) {
    loadError.value = getApiErrorMessage(e, 'Gagal memuat percakapan.')
  } finally {
    pending.value = false
  }
}
async function refreshAll() {
  await load()
  if (selected.value) {
    const fresh = threads.value.find((t: any) => t.id === selected.value.id)
    if (fresh) selected.value = fresh
    await reloadMessages()
  }
}

async function openThread(t: any) {
  selected.value = t
  body.value = ''
  await reloadMessages()
}
async function reloadMessages() {
  if (!selected.value) return
  chatPending.value = true
  try {
    messages.value = await api<any[]>(`/messages/interest/${selected.value.id}`)
    selected.value.lastBody = messages.value[messages.value.length - 1]?.body
    nextTick(() => {
      if (scrollBox.value) scrollBox.value.scrollTop = scrollBox.value.scrollHeight
    })
  } catch {
    messages.value = []
  } finally {
    chatPending.value = false
  }
}
async function send() {
  if (!body.value.trim() || !selected.value) return
  sending.value = true
  try {
    await api('/messages', { method: 'POST', body: { interestId: selected.value.id, body: body.value.trim() } })
    body.value = ''
    await reloadMessages()
  } catch (e: any) {
    toast.error('Gagal mengirim', getApiErrorMessage(e))
  } finally {
    sending.value = false
  }
}

onMounted(async () => {
  isDesktop.value = window.innerWidth >= 768
  await load()
  const q = useRoute().query.thread as string | undefined
  if (q) {
    const found = threads.value.find((t: any) => t.id === q)
    if (found) await openThread(found)
  }
})
</script>
