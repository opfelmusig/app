<template>
  <OMContextMenu :items="menuItems">
    <div class="pointer-events-auto flex items-end justify-center">
      <motion.div
        class="relative shrink-0 border border-inverted/10 backdrop-blur-md transition-colors"
        :class="expanded ? 'bg-default/90' : 'cursor-pointer bg-default/80'"
        :initial="false"
        :animate="target"
        :transition="transition"
        @click="expandedByClick = true"
        @pointerdown="onPointerDown"
        @pointerup="pressed = false"
        @pointercancel="pressed = false"
        @pointerenter="hovered = true"
        @pointerleave="collapse"
      >
        <div class="size-full overflow-hidden rounded-[inherit]">
          <div
            ref="content"
            class="flex flex-col gap-4 transition-[padding] duration-150 ease-out"
            :class="expanded ? 'p-4 px-6' : lifted ? 'px-3 py-2' : 'px-2.5 py-1.5'"
          >
            <ImmersivePlayerInfo :expanded />
            <div
              class="flex shrink-0 flex-col gap-4 self-center transition-opacity duration-150 ease-out"
              :class="expanded ? 'opacity-100' : 'pointer-events-none opacity-0'"
              :style="{ width: `${expandedWidth - 48}px` }"
            >
              <ImmersivePlayerProgress />
              <ImmersivePlayerControls />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  </OMContextMenu>
</template>

<script lang="ts" setup>
import { motion, type Transition } from "motion-v";

const queueStore = useQueueStore();
const settingsStore = useSettingsStore();
const menuItems = useResourceMenu(() => queueStore.current?.entry, {
  extras: () => [
    {
      type: "checkbox",
      label: "Always show player",
      checked: settingsStore.immersive.keepExpanded,
      onSelect: (event) => event.preventDefault(),
      onUpdateChecked(checked) {
        settingsStore.immersive.keepExpanded = checked;
      },
    },
  ],
  sections: {
    hidePlayback: true,
  },
});

const expandedByClick = ref(false);
const expanded = computed(() => settingsStore.immersive.keepExpanded || expandedByClick.value);
const hovered = ref(false);
const pressed = ref(false);
const content = useTemplateRef("content");
const { height: contentHeight } = useElementSize(content, undefined, { box: "border-box" });
const { width: windowWidth } = useWindowSize();

const expandedWidth = computed(() => Math.min(480, windowWidth.value - 56));
const lifted = computed(() => hovered.value && !pressed.value);
const target = computed(() => ({
  width: Math.min(expandedWidth.value, expanded.value ? 480 : lifted.value ? 212 : 200),
  height: expanded.value ? contentHeight.value : lifted.value ? 40 : 34,
  borderRadius: expanded.value ? 32 : 40,
  boxShadow:
    lifted.value || expanded.value
      ? "0 -8px 32px rgba(0, 0, 0, 0.3)"
      : "0 -2px 8px rgba(0, 0, 0, 0.12)",
}));

const transition = computed<Transition>(() => {
  if (pressed.value) return { duration: 0.08, ease: "easeOut" };

  return {
    type: "spring",
    stiffness: 380,
    damping: expanded.value ? 27 : 36,
    mass: 0.8,
    boxShadow: { duration: 0.18 },
  };
});

function collapse() {
  expandedByClick.value = false;
  hovered.value = false;
  pressed.value = false;
}

function onPointerDown(event: PointerEvent) {
  if (!expanded.value && event.button === 0) pressed.value = true;
}
</script>
