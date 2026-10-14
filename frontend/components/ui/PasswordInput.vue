<template>
  <div class="space-y-1.5">
    <label v-if="label" :for="inputId" class="text-sm font-medium leading-none">{{ label }}</label>
    <div class="relative">
      <input
        :id="inputId"
        :type="visible ? 'text' : 'password'"
        :placeholder="placeholder"
        :required="required"
        :value="modelValue"
        :disabled="disabled"
        :autocomplete="autocomplete"
        :aria-invalid="!!error"
        :class="cn(
          'flex h-10 w-full rounded-lg border bg-transparent px-3 py-2 pr-10 text-sm shadow-sm transition-all duration-200 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50',
          error
            ? 'border-destructive focus-visible:ring-destructive/40'
            : 'border-input hover:border-ring/50 focus-visible:border-ring focus-visible:ring-ring/30',
          $attrs.class
        )"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
      <button
        type="button"
        class="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        :aria-label="visible ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'"
        @click="visible = !visible"
      >
        <EyeOff v-if="visible" class="h-4 w-4" />
        <Eye v-else class="h-4 w-4" />
      </button>
    </div>
    <p v-if="hint && !error" class="text-xs text-muted-foreground">{{ hint }}</p>
    <p v-if="error" class="flex items-center gap-1 text-xs font-medium text-destructive">
      <CircleAlert class="h-3.5 w-3.5 shrink-0" />
      {{ error }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { cn } from '@/lib/utils'
import { CircleAlert, Eye, EyeOff } from 'lucide-vue-next'

defineEmits(['update:modelValue'])

withDefaults(defineProps<{
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  modelValue?: string
  error?: string
  hint?: string
  autocomplete?: string
}>(), {})

const visible = ref(false)
const inputId = useId()
</script>
