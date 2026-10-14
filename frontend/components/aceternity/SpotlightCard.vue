<template>
  <div :class="cn('relative overflow-hidden rounded-xl border bg-card p-[1px] shadow-sm', $attrs.class)" @mouseenter="isHovered = true" @mouseleave="isHovered = false">
    <div v-if="isHovered" class="absolute inset-0 z-0 rounded-xl bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 opacity-100 transition-opacity duration-500" />
    <div class="relative z-10 h-full rounded-[calc(0.75rem-1px)] bg-card">
      <slot :hovered="isHovered" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { cn } from '@/lib/utils'
import { ref } from 'vue'

const isHovered = ref(false)
</script>
