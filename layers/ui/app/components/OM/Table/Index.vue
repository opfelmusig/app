<template>
  <table class="w-full shrink-0 table-fixed border-separate border-spacing-0 text-sm select-none">
    <thead>
      <tr class="h-8 text-left text-muted">
        <slot name="header" />
        <OMTableHeader v-if="reorderable" class="w-12" />
      </tr>
    </thead>

    <tbody ref="body">
      <slot />
    </tbody>
  </table>
</template>

<script setup lang="ts">
import { useSortable, type UseSortableOptions } from "@vueuse/integrations/useSortable";

const props = defineProps<{
  reorderable?: boolean;
  reorderIds?: readonly string[];
}>();
const emit = defineEmits<{ reorder: [move: TableReorder] }>();

const body = useTemplateRef("body");
const ids = computed(() => [...(props.reorderIds ?? [])]);
provide(
  tableReorderEnabledKey,
  computed(() => !!props.reorderable),
);

let originalNextSibling: ChildNode | null = null;

const sortableOptions: UseSortableOptions & { supportPointer: boolean } = {
  disabled: !props.reorderable,
  draggable: "tr[data-reorder-id]",
  handle: "[data-reorder-handle]",
  animation: 150,
  ghostClass: "opacity-40",
  forceAutoScrollFallback: true,
  supportPointer: false,
  onChoose({ item }) {
    originalNextSibling = item.nextSibling;
  },
  onUpdate: undefined,
  onEnd(event) {
    const nextSibling = originalNextSibling;
    originalNextSibling = null;
    if (
      event.item.parentNode !== event.from ||
      (nextSibling && nextSibling.parentNode !== event.from)
    )
      return;
    event.from.insertBefore(event.item, nextSibling);

    const from = event.oldDraggableIndex;
    const to = event.newDraggableIndex;
    if (!props.reorderable || from === undefined || to === undefined || from === to) return;

    const id = event.item.dataset.reorderId;
    const targetId = ids.value[to];
    if (!id || ids.value[from] !== id || !targetId) return;

    emit("reorder", { id, targetId, placement: from < to ? "after" : "before" });
  },
};

const { option } = useSortable(body, ids, sortableOptions);

watch(
  () => props.reorderable,
  (enabled) => option("disabled", !enabled),
);
</script>
