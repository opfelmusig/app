<template>
  <OMTableSimple>
    <span
      data-reorder-handle
      title="Drag to reorder"
      class="flex size-9 cursor-grab items-center justify-center text-dimmed active:cursor-grabbing"
      @click.stop
      @dblclick.stop
    >
      <OMIcon name="lucide:menu" class="size-4" />
    </span>
  </OMTableSimple>
</template>
