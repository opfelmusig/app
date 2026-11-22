<template>
  <div
    ref="scroller"
    :style="style"
    class="relative scrollbar-hide flex size-full min-h-0 flex-col gap-6 overflow-hidden overflow-y-auto p-4 text-4xl font-semibold text-white/40 select-none"
  >
    <div
      v-for="item in items"
      :key="item.key"
      :ref="(el) => setLineRef(item.key, el)"
      v-memo="[item, itemProgress(item), lyrics.metadata]"
    >
      <LyricsTimingTimedItems
        :item="item"
        :progress="itemProgress(item)"
        :metadata="lyrics.metadata"
        @seek="seek"
      />
    </div>
    <div ref="songwriters" class="flex w-full flex-col gap-4">
      <div
        :ref="(el) => setLineRef('end', el)"
        class="bg-highlighted/60 min-h-px w-full rounded-full"
      />
      <LyricsFooter :songwriters="lyrics.metadata.songwriters" />
    </div>
    <div :style="{ minHeight: `${Math.max(0, containerHeight - 64 - songwritersHeight)}px` }" />
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  lyrics: AppleMusicLyricsLineDocument | AppleMusicLyricsTimedDocument;
  progress: number;
}>();

const emit = defineEmits<{
  (e: "seek", time: number | null): void;
}>();

const seek = (time: number | null) => emit("seek", time);

const settingsStore = useSettingsStore();
const items = usePreparedLyrics(() => props.lyrics);

const itemProgress = (item: LyricsTimelineItem) =>
  Math.max(item.startMs - 1, Math.min(props.progress, item.endMs + 1));

const containerEl = useTemplateRef("scroller");
const songwritersEl = useTemplateRef("songwriters");
const { height: containerHeight } = useElementSize(containerEl, undefined, { box: "border-box" });
const { height: songwritersHeight } = useElementSize(songwritersEl);
const lineRefs = new Map<string, HTMLElement>();

const setLineRef = (key: string, el: Element | ComponentPublicInstance | null) => {
  if (el instanceof HTMLElement) lineRefs.set(key, el);
  else lineRefs.delete(key);
};

const PADDING = 24;
const SCROLL_DURATION_MS = 400;
const SCROLL_STAGGER_MS = 40;
const SCROLL_STAGGER_DECAY = 0.8;
const USER_IDLE_MS = 5000;

const scrollTargetKey = computed(() => {
  const progress = Math.max(0, props.progress);

  const active = items.value.find((item) => progress >= item.startMs && progress <= item.endMs);

  if (active) return active.key;

  const next = items.value.find((item) => item.startMs > progress);

  if (next) return next.key;

  const lastItem = items.value.at(-1);

  if (lastItem && progress > lastItem.endMs) return "end";

  return null;
});

const autoscrollPaused = ref(false);
let resumeTimer: ReturnType<typeof setTimeout> | null = null;
const scrollAnimations = new Set<Animation>();
let scrollFrame: number | null = null;
let hasScrolled = false;

const stopScroll = () => {
  if (scrollFrame !== null) cancelAnimationFrame(scrollFrame);
  scrollFrame = null;
  const container = containerEl.value;
  const effect = scrollAnimations.values().next().value?.effect;
  const anchor =
    effect instanceof KeyframeEffect && effect.target instanceof HTMLElement ? effect.target : null;
  const anchorTop = anchor?.getBoundingClientRect().top;

  for (const animation of scrollAnimations) animation.cancel();
  scrollAnimations.clear();

  if (container) {
    const offset =
      anchor && anchorTop !== undefined ? anchor.getBoundingClientRect().top - anchorTop : 0;
    container.scrollTo({ top: container.scrollTop + offset, behavior: "instant" });
  }
};

const pauseAutoscroll = () => {
  autoscrollPaused.value = true;
  stopScroll();

  if (resumeTimer) clearTimeout(resumeTimer);

  resumeTimer = setTimeout(() => {
    autoscrollPaused.value = false;
    resumeTimer = null;
    scrollToTarget();
  }, USER_IDLE_MS);
};

const getScrollTargetTop = (container: HTMLElement, key: string) => {
  const el = lineRefs.get(key);
  if (!el) return null;

  return Math.min(
    Math.max(0, el.offsetTop - PADDING),
    Math.max(0, container.scrollHeight - container.clientHeight),
  );
};

const scrollToTarget = (behavior: "smooth" | "instant" = "smooth") => {
  const container = containerEl.value;
  const key = scrollTargetKey.value;
  if (!container || !key || autoscrollPaused.value) return;

  const targetTop = getScrollTargetTop(container, key);
  if (targetTop === null) return;

  if (behavior === "instant" || !hasScrolled) {
    stopScroll();
    container.scrollTop = targetTop;
    hasScrolled = true;
    return;
  }
  const distance = targetTop - container.scrollTop;
  if (Math.abs(distance) < 1) return;

  if (distance < 0 || distance >= container.clientHeight) {
    stopScroll();
    const startTop = container.scrollTop;
    const startTime = performance.now();

    const update = (time: number) => {
      const progress = Math.min(1, (time - startTime) / SCROLL_DURATION_MS);
      const eased = progress < 0.5 ? 4 * progress ** 3 : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      container.scrollTop = startTop + (targetTop - startTop) * eased;

      if (progress < 1) scrollFrame = requestAnimationFrame(update);
      else scrollFrame = null;
    };

    scrollFrame = requestAnimationFrame(update);
    return;
  }

  const rows = Array.from(container.children)
    .filter((element): element is HTMLElement => element instanceof HTMLElement)
    .map((element) => ({ element, bounds: element.getBoundingClientRect() }));
  const viewport = container.getBoundingClientRect();

  stopScroll();
  container.scrollTop = targetTop;

  let delay = 0;
  let stagger = SCROLL_STAGGER_MS;
  for (const { element, bounds } of rows) {
    const target = element.getBoundingClientRect();
    const wasVisible = bounds.bottom > viewport.top && bounds.top < viewport.bottom;
    const isVisible = target.bottom > viewport.top && target.top < viewport.bottom;
    if (!wasVisible && !isVisible) continue;

    const animation = element.animate(
      [{ transform: `translateY(${bounds.top - target.top}px)` }, { transform: "translateY(0)" }],
      {
        duration: SCROLL_DURATION_MS,
        delay,
        easing: "cubic-bezier(0.65, 0, 0.35, 1)",
        fill: "backwards",
      },
    );
    scrollAnimations.add(animation);
    animation.onfinish = () => scrollAnimations.delete(animation);
    delay += stagger;
    stagger *= SCROLL_STAGGER_DECAY;
  }
};

watch(
  () => props.lyrics,
  () => {
    if (resumeTimer) clearTimeout(resumeTimer);
    resumeTimer = null;
    autoscrollPaused.value = false;
    hasScrolled = false;
    stopScroll();
  },
);

watch(
  [() => props.lyrics, scrollTargetKey],
  async () => {
    await nextTick();
    scrollToTarget();
  },
  { flush: "post", immediate: true },
);

watch(
  [() => settingsStore.lyrics.showTranslation, () => settingsStore.lyrics.showTransliteration],
  () => scrollToTarget("instant"),
  { flush: "post" },
);

useResizeObserver(containerEl, () => scrollToTarget("instant"));

useEventListener(containerEl, "wheel", pauseAutoscroll, { passive: true });
useEventListener(containerEl, "touchstart", pauseAutoscroll, { passive: true });
useEventListener(containerEl, "touchmove", pauseAutoscroll, { passive: true });

onBeforeUnmount(() => {
  if (resumeTimer) clearTimeout(resumeTimer);
  stopScroll();
});

const { style } = useCustomScrollShadow(containerEl, {
  orientation: "vertical",
  sizeStart: "24px",
  sizeEnd: "80%",
  observeAttributes: false,
});
</script>
