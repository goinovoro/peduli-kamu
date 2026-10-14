<template>
  <div :class="cn('relative overflow-hidden rounded-xl', $attrs.class)">
    <div class="absolute inset-[-1000%] animate-[move-border_4s_linear_infinite]" :style="{ background: 'conic-gradient(from 90deg at 50% 50%, transparent 0%, hsl(199 89% 48%) 25%, transparent 50%)' }" />
    <div class="relative z-10 h-full rounded-[calc(0.75rem-1px)] bg-card">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { cn } from '@/lib/utils'
</script>
