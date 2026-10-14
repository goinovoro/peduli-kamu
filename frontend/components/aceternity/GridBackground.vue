<template>
  <div :class="cn('absolute inset-0 overflow-hidden pointer-events-none', $attrs.class)">
    <div class="absolute inset-0 grid-pattern opacity-40" />
    <div class="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
  </div>
</template>

<script setup lang="ts">
import { cn } from '@/lib/utils'
</script>
