<template>
  <div :class="cn('flex flex-wrap gap-2', $attrs.class)">
    <span v-for="(tag, i) in items" :key="i" class="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20">
      {{ tag }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { cn } from '@/lib/utils'

defineProps<{ items: string[] }>()
</script>
