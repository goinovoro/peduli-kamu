<template>
  <div class="space-y-1.5">
    <label v-if="label" class="text-sm font-medium leading-none">{{ label }}</label>
    <label
      class="group flex cursor-pointer items-center gap-3 rounded-lg border border-dashed px-4 py-3.5 text-sm transition-all duration-200 hover:border-ring/60 hover:bg-muted/40"
      :class="[
        error ? 'border-destructive/60' : 'border-input',
        fileName ? 'border-solid border-primary/40 bg-primary/[0.03]' : '',
      ]"
    >
      <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors" :class="fileName ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground group-hover:text-foreground'">
        <FileUp class="h-4 w-4" />
      </span>
      <span class="min-w-0 flex-1">
        <span v-if="fileName" class="block truncate font-medium">{{ fileName }}</span>
        <span v-else class="block text-muted-foreground">{{ placeholder }}</span>
        <span class="mt-0.5 block text-xs text-muted-foreground">{{ acceptLabel }}</span>
      </span>
      <input ref="input" type="file" :accept="accept" class="sr-only" @change="onChange" />
    </label>
    <p v-if="hint && !error" class="text-xs text-muted-foreground">{{ hint }}</p>
    <p v-if="error" class="flex items-center gap-1 text-xs font-medium text-destructive">
      <CircleAlert class="h-3.5 w-3.5 shrink-0" />
      {{ error }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { FileUp, CircleAlert } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  label?: string
  placeholder?: string
  accept?: string
  acceptLabel?: string
  hint?: string
  error?: string
}>(), {
  placeholder: 'Klik untuk memilih file',
  accept: 'image/jpeg,image/png,application/pdf',
  acceptLabel: 'JPG, PNG, atau PDF · maks 5MB',
})

const emit = defineEmits(['update:file'])

const input = ref<HTMLInputElement | null>(null)
const fileName = ref('')

function onChange() {
  const f = input.value?.files?.[0] ?? null
  fileName.value = f?.name ?? ''
  emit('update:file', f)
}

defineExpose({ input })
</script>
