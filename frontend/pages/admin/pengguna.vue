<template>
  <div class="p-4 md:p-8 pb-24 md:pb-8">
    <div class="mb-6">
      <h1 class="text-2xl font-bold tracking-tight md:text-3xl">Kelola Pengguna</h1>
      <p class="mt-1 text-sm text-muted-foreground">Lihat identitas, status, dan ubah status akun. Anda tidak bisa mengubah status akun sendiri.</p>
    </div>

    <UiCard>
      <div class="overflow-x-auto">
        <table class="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr class="border-b text-xs uppercase tracking-wider text-muted-foreground">
              <th class="px-4 py-3 font-semibold">Pengguna</th>
              <th class="px-4 py-3 font-semibold">Role</th>
              <th class="px-4 py-3 font-semibold">Status</th>
              <th class="px-4 py-3 font-semibold">Terdaftar</th>
              <th class="px-4 py-3 text-right font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="pending" v-for="i in 5" :key="i" class="border-b">
              <td colspan="5" class="px-4 py-4"><div class="skeleton-shimmer h-4 w-2/3 rounded" /></td>
            </tr>
            <tr v-else v-for="u in users" :key="u.id" class="border-b last:border-0 transition-colors hover:bg-muted/40">
              <td class="px-4 py-3">
                <div class="flex items-center gap-2.5">
                  <UiAvatar class="h-8 w-8" :fallback="u.name?.charAt(0)?.toUpperCase() || '?'" />
                  <div class="min-w-0">
                    <p class="truncate font-medium">{{ u.name }}</p>
                    <p class="truncate text-xs text-muted-foreground">{{ u.email }}</p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3 text-muted-foreground">{{ roleLabel(u.role) }}</td>
              <td class="px-4 py-3">
                <UiBadge :variant="statusVariant(u.accountStatus)">{{ statusLabel(u.accountStatus) }}</UiBadge>
              </td>
              <td class="px-4 py-3 text-muted-foreground">{{ formatDate(u.createdAt) }}</td>
              <td class="px-4 py-3 text-right">
                <UiSelect
                  :model-value="u.accountStatus"
                  :disabled="u.id === me?.id || actingId === u.id"
                  class="h-9 w-auto min-w-32 text-xs"
                  @update:model-value="(v: string) => onChangeStatus(u, v)"
                >
                  <option v-for="s in STATUSES" :key="s" :value="s">{{ statusLabel(s) }}</option>
                </UiSelect>
              </td>
            </tr>
            <tr v-if="!pending && !users.length">
              <td colspan="5" class="px-4 py-10 text-center text-muted-foreground">Belum ada pengguna.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </UiCard>
    <p class="mt-3 text-xs text-muted-foreground">Perubahan status langsung memberitahu pengguna via notifikasi in-app.</p>
  </div>
</template>

<script setup lang="ts">
import { statusLabel, statusVariant, formatDate } from '@/lib/format'
import { roleLabel } from '@/lib/roles'
import { getApiErrorMessage } from '@/composables/useApi'

definePageMeta({ ssr: false, middleware: ['auth-admin'] })
useSeoMeta({ title: 'Kelola Pengguna', robots: 'noindex, nofollow' })

const STATUSES = ['AKTIF', 'TIDAK_AKTIF', 'DITANGGUHKAN', 'DIBLOKIR', 'TERKUNCI_PERIODE', 'DIBEKUKAN']

const api = useApi()
const toast = useToast()
const { user: me } = useAuth()

const { data, pending, refresh } = await useAsyncData('admin-users', () => api<any[]>('/users'))
const users = computed(() => data.value ?? [])

const actingId = ref<string | null>(null)
async function onChangeStatus(u: any, status: string) {
  if (status === u.accountStatus) return
  actingId.value = u.id
  try {
    // PATCH /users/:id/status {status} — backend menolak ubah akun sendiri (403)
    await api(`/users/${u.id}/status`, { method: 'PATCH', body: { status } })
    u.accountStatus = status
    toast.success('Status diperbarui', `${u.name} → ${statusLabel(status)}.`)
  } catch (e: any) {
    toast.error('Gagal mengubah status', getApiErrorMessage(e))
    await refresh()
  } finally {
    actingId.value = null
  }
}
</script>
