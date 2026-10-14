<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div v-if="open" class="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" @click.self="onClose">
        <div class="dialog-backdrop fixed inset-0 bg-black/60 backdrop-blur-sm" />
        <div :class="cn('dialog-panel relative z-50 max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border bg-background p-6 shadow-2xl sm:max-w-lg sm:rounded-xl', $attrs.class)">
          <slot />
          <button class="absolute right-4 top-4 rounded-full p-1.5 opacity-60 ring-offset-background transition-all hover:bg-accent hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" @click="onClose" aria-label="Tutup dialog">
            <X class="h-4 w-4" />
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { cn } from '@/lib/utils'
import { X } from 'lucide-vue-next'

defineProps<{ open: boolean }>()
const emit = defineEmits(['update:open'])

function onClose() {
  emit('update:open', false)
}
</script>

<style scoped>
.dialog-enter-active { transition: opacity 0.25s ease; }
.dialog-enter-active .dialog-panel {
  transition: opacity 0.3s cubic-bezier(0.22, 1, 0.36, 1), transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}
.dialog-leave-active { transition: opacity 0.2s ease; }
.dialog-leave-active .dialog-panel {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.dialog-enter-from, .dialog-leave-to { opacity: 0; }
.dialog-enter-from .dialog-panel { opacity: 0; transform: translateY(24px) scale(0.97); }
.dialog-leave-to .dialog-panel { opacity: 0; transform: translateY(12px) scale(0.98); }
@media (min-width: 640px) {
  .dialog-enter-from .dialog-panel { transform: translateY(12px) scale(0.95); }
}
</style>
