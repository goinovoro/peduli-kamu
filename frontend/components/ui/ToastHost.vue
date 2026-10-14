<template>
  <div class="pointer-events-none fixed inset-x-0 bottom-20 z-[100] flex flex-col items-center gap-2 px-4 md:bottom-6 md:items-end md:px-6" aria-live="polite">
    <TransitionGroup name="toast">
      <div
        v-for="t in toasts"
        :key="t.id"
        class="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-card p-4 shadow-lg"
      >
        <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" :class="iconBg(t.type)">
          <component :is="iconFor(t.type)" class="h-4 w-4" :class="iconColor(t.type)" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-semibold leading-snug">{{ t.title }}</p>
          <p v-if="t.message" class="mt-0.5 break-words text-xs text-muted-foreground leading-relaxed">{{ t.message }}</p>
        </div>
        <button class="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent" @click="dismiss(t.id)" aria-label="Tutup notifikasi">
          <X class="h-4 w-4" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-vue-next'

const { toasts, dismiss } = useToast()

function iconFor(type: string) {
  if (type === 'success') return CheckCircle2
  if (type === 'error') return XCircle
  if (type === 'warning') return AlertTriangle
  return Info
}

function iconBg(type: string) {
  if (type === 'success') return 'bg-emerald-100'
  if (type === 'error') return 'bg-destructive/10'
  if (type === 'warning') return 'bg-amber-100'
  return 'bg-sky-100'
}

function iconColor(type: string) {
  if (type === 'success') return 'text-emerald-600'
  if (type === 'error') return 'text-destructive'
  if (type === 'warning') return 'text-amber-600'
  return 'text-sky-600'
}
</script>

<style scoped>
.toast-enter-active, .toast-leave-active { transition: all 0.25s ease; }
.toast-enter-from { opacity: 0; transform: translateY(12px) scale(0.97); }
.toast-leave-to { opacity: 0; transform: translateX(24px); }
</style>
