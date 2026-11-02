<template>
  <div v-if="hasMore && !error" class="flex justify-center p-4">
    <UButton
      color="neutral"
      variant="ghost"
      :loading
      :disabled="loading"
      class="text-muted"
      @click="$emit('load')"
    >
      Load more
    </UButton>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  hasMore: boolean;
  loading: boolean;
  error: Error | null;
}>();

defineEmits<{ load: [] }>();
</script>
