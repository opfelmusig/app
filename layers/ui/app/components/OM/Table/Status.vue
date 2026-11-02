<template>
  <OMTableRow no-hover>
    <td :colspan="columns.length + 3 + (reorderEnabled ? 1 : 0)">
      <div
        class="flex size-full items-center justify-center gap-2 px-4 text-sm whitespace-nowrap"
        :class="error ? 'text-error' : 'text-muted'"
      >
        <slot />
      </div>
    </td>
  </OMTableRow>
</template>

<script lang="ts" setup>
defineProps<{
  error?: boolean;
}>();

const columns = useTableColumns();
const reorderEnabled = inject(tableReorderEnabledKey, ref(false));
</script>
