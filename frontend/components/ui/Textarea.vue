<template>
  <div class="space-y-1.5">
    <label v-if="label" :for="inputId" class="text-sm font-medium leading-none">{{ label }}</label>
    <textarea
      :id="inputId"
      :placeholder="placeholder"
      :required="required"
      :rows="rows"
      :value="modelValue"
      :disabled="disabled"
      :aria-invalid="!!error"
      :class="cn(
        'flex min-h-20 w-full rounded-lg border bg-transparent px-3 py-2 text-sm shadow-sm transition-all duration-200 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50',
        error
          ? 'border-destructive focus-visible:ring-destructive/40'
          : 'border-input hover:border-ring/50 focus-visible:border-ring focus-visible:ring-ring/30',
        $attrs.class
      )"
      @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    />
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
  placeholder?: string
  required?: boolean
  disabled?: boolean
  rows?: number
  modelValue?: string
  error?: string
  hint?: string
}>(), {
  rows: 3,
})

const inputId = useId()
</script>
