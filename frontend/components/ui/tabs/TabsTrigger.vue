<template>
  <button
    :class="cn(
      'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
      modelValue === value ? 'bg-background text-foreground shadow-sm' : '',
      $attrs.class
    )"
    @click="$emit('update:modelValue', value)"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
import { cn } from '@/lib/utils'

defineEmits(['update:modelValue'])

defineProps<{
  value: string
  modelValue?: string
}>()
</script>
