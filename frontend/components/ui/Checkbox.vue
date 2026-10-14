<template>
  <label
    class="flex cursor-pointer items-start gap-2.5 text-sm leading-relaxed transition-opacity"
    :class="disabled && 'cursor-not-allowed opacity-60'"
  >
    <span class="relative mt-0.5 flex h-4.5 w-4.5 shrink-0">
      <input
        :checked="modelValue"
        type="checkbox"
        :disabled="disabled"
        :required="required"
        class="peer h-[18px] w-[18px] shrink-0 cursor-pointer appearance-none rounded-[5px] border border-input bg-transparent shadow-sm transition-all duration-200 checked:border-primary checked:bg-primary hover:border-ring/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
        @change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
      />
      <Check class="pointer-events-none absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 text-primary-foreground opacity-0 transition-opacity duration-150 peer-checked:opacity-100" />
    </span>
    <span class="text-muted-foreground"><slot /></span>
  </label>
</template>

<script setup lang="ts">
import { Check } from 'lucide-vue-next'

withDefaults(defineProps<{
  modelValue?: boolean
  disabled?: boolean
  required?: boolean
}>(), {
  modelValue: false,
})

defineEmits(['update:modelValue'])
</script>

<style scoped>
.h-4\.5, .w-4\.5 { height: 1.125rem; width: 1.125rem; }
</style>
