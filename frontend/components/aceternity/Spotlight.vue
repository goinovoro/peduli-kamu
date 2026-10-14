<template>
  <div :class="cn('absolute overflow-hidden pointer-events-none', $attrs.class)">
    <div class="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl animate-spotlight" />
  </div>
</template>

<script setup lang="ts">
import { cn } from '@/lib/utils'
</script>
