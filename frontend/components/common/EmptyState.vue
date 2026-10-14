<template>
  <div class="flex flex-col items-center justify-center px-6 py-10 text-center">
    <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
      <component :is="icon" class="h-7 w-7 text-primary" />
    </div>
    <h3 class="mt-4 text-base font-semibold">{{ title }}</h3>
    <p v-if="description" class="mt-1 max-w-sm text-sm text-muted-foreground leading-relaxed">{{ description }}</p>
    <div v-if="$slots.action" class="mt-5">
      <slot name="action" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

withDefaults(defineProps<{
  icon: Component
  title: string
  description?: string
}>(), { description: '' })
</script>
