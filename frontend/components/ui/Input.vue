<template>
  <div class="space-y-1.5">
    <label v-if="label" :for="inputId" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{{ label }}</label>
    <div class="relative">
      <span v-if="$slots.leading" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground [&_svg]:h-4 [&_svg]:w-4">
        <slot name="leading" />
      </span>
      <input
        :id="inputId"
        :type="type"
        :placeholder="placeholder"
        :required="required"
        :value="modelValue"
        :disabled="disabled"
        :min="min"
        :max="max"
        :step="step"
        :autocomplete="autocomplete"
        :aria-invalid="!!error"
        :aria-describedby="error ? `${inputId}-error` : undefined"
        :class="cn(
          'flex h-10 w-full rounded-lg border bg-transparent px-3 py-2 text-sm shadow-sm transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50',
          $slots.leading && 'pl-9',
          error
            ? 'border-destructive focus-visible:ring-destructive/40'
            : 'border-input hover:border-ring/50 focus-visible:border-ring focus-visible:ring-ring/30',
          $attrs.class
        )"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        @blur="$emit('blur', $event)"
      />
    </div>
    <p v-if="hint && !error" class="text-xs text-muted-foreground">{{ hint }}</p>
    <p v-if="error" :id="`${inputId}-error`" class="flex items-center gap-1 text-xs font-medium text-destructive">
      <CircleAlert class="h-3.5 w-3.5 shrink-0" />
      {{ error }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { cn } from '@/lib/utils'
import { CircleAlert } from 'lucide-vue-next'

defineEmits(['update:modelValue', 'blur'])

withDefaults(defineProps<{
  label?: string
  type?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  modelValue?: string | number
  error?: string
  hint?: string
  min?: string | number
  max?: string | number
  step?: string | number
  autocomplete?: string
}>(), {
  type: 'text',
})

const inputId = useId()
</script>
