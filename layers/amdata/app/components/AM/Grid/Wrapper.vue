<template>
  <div ref="container" class="w-full min-w-0 p-4">
    <div class="grid w-full gap-4" :style="gridStyle">
      <slot :columns />
    </div>
  </div>
</template>

<script lang="ts" setup>
const container = useTemplateRef("container");

const containerWidth = ref(0);

const minItemWidth = 180;
const maxItemWidth = 260;
const gap = 16;

useResizeObserver(container, ([entry]) => {
  if (entry) containerWidth.value = entry.contentRect.width;
});

const availableColumns = computed(() => {
  return Math.floor((containerWidth.value + gap) / (minItemWidth + gap));
});

const columns = computed(() => {
  return Math.max(1, availableColumns.value);
});

const gridWidth = computed(() => {
  return columns.value * maxItemWidth + (columns.value - 1) * gap;
});

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${columns.value}, minmax(0, 1fr))`,
  maxWidth: `${gridWidth.value}px`,
}));
</script>
