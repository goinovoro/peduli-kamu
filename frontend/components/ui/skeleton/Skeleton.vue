<template>
  <div :class="cn('animate-pulse rounded-md bg-primary/10', $attrs.class)" />
</template>

<script setup lang="ts">
import { cn } from '@/lib/utils'
</script>
