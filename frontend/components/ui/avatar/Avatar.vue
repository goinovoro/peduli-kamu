<template>
  <span :class="cn('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full', $attrs.class)">
    <img v-if="src" :src="src" :alt="alt" class="aspect-square h-full w-full object-cover" @error="imgError = true" />
    <span v-if="(!src || imgError) && fallback" class="flex h-full w-full items-center justify-center rounded-full bg-muted text-sm font-medium">
      {{ fallback }}
    </span>
    <span v-if="(!src || imgError) && !fallback" class="flex h-full w-full items-center justify-center rounded-full bg-primary/10 text-primary">
      <slot />
    </span>
  </span>
</template>

<script setup lang="ts">
import { cn } from '@/lib/utils'
import { ref } from 'vue'

defineProps<{
  src?: string
  alt?: string
  fallback?: string
}>()

const imgError = ref(false)
</script>
