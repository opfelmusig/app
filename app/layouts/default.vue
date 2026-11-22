<template>
  <main class="relative flex size-full h-svh flex-col overflow-hidden" :style="cssVars">
    <Titlebar />
    <div class="flex min-h-0 flex-1">
      <div ref="_el" class="relative h-full shrink-0" :style="{ width: `${width}px` }">
        <div
          class="peer absolute inset-y-0 right-0 z-50 w-2 translate-x-1 cursor-ew-resize touch-none"
          @mousedown="onMouseDown"
          @touchstart="onTouchStart"
          @dblclick="reset"
        />
        <Sidebar />
      </div>
      <div
        class="@container/page flex min-w-0 flex-1 overflow-hidden"
        :class="{ 'pointer-events-none': isDragging }"
      >
        <slot />
      </div>
    </div>
    <Transition
      enter-active-class="transition-transform"
      enter-from-class="translate-x-full"
      leave-active-class="transition-transform"
      leave-to-class="translate-x-full"
    >
      <Panel v-if="settingsStore.panel.isOpen" />
    </Transition>
    <Transition
      persisted
      enter-active-class="transition-transform duration-400"
      enter-from-class="translate-y-full"
      leave-active-class="transition-transform duration-400"
      leave-to-class="translate-y-full"
      @after-leave="immersiveMounted = false"
    >
      <Immersive v-if="immersiveMounted" v-show="settingsStore.immersive.isOpen" />
    </Transition>
    <Player />
    <Settings />
    <CommandPalette />
  </main>
</template>

<script lang="ts" setup>
const { cssVars } = useArtworkTheme();

const { el: _el, width, isDragging, onMouseDown, onTouchStart, reset } = useSidebar();
const settingsStore = useSettingsStore();

const immersiveMounted = ref(settingsStore.immersive.isOpen);
watch(
  () => settingsStore.immersive.isOpen,
  (isOpen) => {
    if (isOpen) immersiveMounted.value = true;
  },
);
</script>
