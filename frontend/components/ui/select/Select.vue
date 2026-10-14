<template>
  <div class="space-y-1.5">
    <label v-if="label" :for="inputId" class="text-sm font-medium leading-none">{{ label }}</label>
    <select
      :id="inputId"
      :value="modelValue"
      :disabled="disabled"
      :aria-invalid="!!error"
      :class="cn(
        'flex h-10 w-full items-center justify-between rounded-lg border bg-transparent px-3 py-2 text-sm shadow-sm transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
        error
          ? 'border-destructive focus-visible:ring-destructive/40'
          : 'border-input hover:border-ring/50 focus-visible:border-ring focus-visible:ring-ring/30',
        $attrs.class
      )"
      @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <slot />
    </select>
    <p v-if="hint && !error" class="text-xs text-muted-foreground">{{ hint }}</p>
    <p v-if="error" class="flex items-center gap-1 text-xs font-medium text-destructive">
      <CircleAlert class="h-3.5 w-3.5 shrink-0" />
      {{ error }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { cn } from '@/lib/utils'
import { CircleAlert } from 'lucide-vue-next'

defineEmits(['update:modelValue'])

withDefaults(defineProps<{
  label?: string
  modelValue?: string
  disabled?: boolean
  error?: string
  hint?: string
}>(), {})

const inputId = useId()
</script>
