<template>
  <UButton
    :color="error ? 'error' : active ? 'primary' : 'neutral'"
    variant="soft"
    class="size-9 shrink-0 justify-center rounded-xl transition-transform active:scale-95"
    size="lg"
    :disabled
  >
    <template v-if="icon" #leading>
      <OMIcon :name="icon" class="size-4" :filled="fill && active" />
    </template>
  </UButton>
</template>

<script lang="ts" setup>
defineProps<{
  disabled?: boolean;
  icon?: string;
  fill?: boolean;
  active?: boolean;
  error?: boolean;
}>();
</script>
