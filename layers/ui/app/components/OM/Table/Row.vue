<template>
  <tr
    class="group last:[&>td]:border-b-0"
    :class="[
      small ? 'h-10' : 'h-14',
      highlighted
        ? 'bg-primary/5 hover:bg-primary/10 [&:active:not(:has(.no-active:active))]:bg-primary/15'
        : '',
      noHover || highlighted
        ? ''
        : 'hover:bg-raised [&:active:not(:has(.no-active:active))]:bg-muted/60',
      disabled ? '[&>td>*]:opacity-50' : '',
    ]"
    :data-reorder-id="reorderId"
  >
    <slot />
    <OMTableReorder v-if="reorderEnabled && reorderId" />
  </tr>
</template>

<script lang="ts" setup>
defineProps<{
  noHover?: boolean;
  small?: boolean;
  reorderId?: string;
  highlighted?: boolean;
  disabled?: boolean;
}>();

const reorderEnabled = inject(tableReorderEnabledKey, ref(false));
</script>
