<template>
  <template v-if="!albumMode || discs.length <= 1 || !albumSort">
    <tr v-if="virtualize" ref="start" />
    <tr v-if="paddingTop > 0" :style="{ height: `${paddingTop}px` }">
      <td :colspan />
    </tr>
    <AMSongsItem
      v-for="row in visibleRows"
      :key="row.id"
      :song="row.song"
      :album-mode
      :hide-popularity="songs?.length === 1"
      :reorder-id="reorderIds?.[row.index]"
      :controls-disabled
      :remove-from-playlist="
        removeFromPlaylist ? () => removeFromPlaylist?.(row.song, row.index) : undefined
      "
      :remove-from-history="
        removeFromHistory ? () => removeFromHistory?.(row.song, row.index) : undefined
      "
      @play="$emit('play', row.index)"
    />
    <tr v-if="paddingBottom > 0" :style="{ height: `${paddingBottom}px` }">
      <td :colspan />
    </tr>
  </template>
  <template v-for="disc in discs" v-else :key="disc.number">
    <OMTableSeparator>Disc {{ disc.number }}</OMTableSeparator>
    <AMSongsItem
      v-for="song in disc.songs"
      :key="`${song.item.id}:${song.index}`"
      :song="song.item"
      :album-mode
      @play="$emit('play', song.index)"
    />
  </template>
</template>

<script lang="ts" setup>
import { useVirtualizer } from "@tanstack/vue-virtual";
import { groupBy, map, pipe, values } from "remeda";

const props = defineProps<{
  songs?: AmSong[];
  albumMode?: boolean;
  albumSort?: boolean;
  virtualize?: boolean;
  reorderIds?: readonly string[];
  controlsDisabled?: boolean;
  removeFromPlaylist?: (song: AmSong, index: number) => void;
  removeFromHistory?: (song: AmSong, index: number) => void;
}>();

const columns = useTableColumns();
const reorderEnabled = inject(tableReorderEnabledKey, ref(false));
const colspan = computed(() => columns.value.length + 3 + (reorderEnabled.value ? 1 : 0));

const rows = computed(() =>
  (props.songs ?? []).map((song, index) => ({
    id: props.reorderIds?.[index] ?? `${song.id}:${index}`,
    song,
    index,
  })),
);

const highlightedSongId = useRouteQuery<string>("song_id");
const highlightedIndex = computed(() =>
  rows.value.findIndex((row) => row.song.id === highlightedSongId.value),
);

const scroller = inject(pageScrollerKey);
const start = useTemplateRef("start");
const scrollMargin = ref(0);
const enabled = computed(() => !!scroller && !!props.virtualize && rows.value.length > 40);

function updateOffset() {
  if (!start.value || !scroller?.value) return;
  scrollMargin.value =
    start.value.getBoundingClientRect().top -
    scroller.value.getBoundingClientRect().top +
    scroller.value.scrollTop;
}

useResizeObserver(
  () =>
    scroller?.value && props.virtualize
      ? [
          scroller.value,
          ...Array.from(scroller.value.children).filter(
            (element): element is HTMLElement => element instanceof HTMLElement,
          ),
        ]
      : [],
  updateOffset,
);
watch(start, updateOffset, { flush: "post" });

const virtualizer = useVirtualizer(
  computed(() => {
    const items = rows.value;
    return {
      count: items.length,
      getScrollElement: () => scroller?.value ?? null,
      getItemKey: (index: number) => items[index]!.id,
      estimateSize: () => 56,
      scrollMargin: scrollMargin.value,
      overscan: 8,
      enabled: enabled.value,
    };
  }),
);

const visibleRows = computed(() =>
  enabled.value
    ? virtualizer.value.getVirtualItems().map((row) => rows.value[row.index]!)
    : rows.value,
);
const paddingTop = computed(() =>
  enabled.value
    ? Math.max(0, (virtualizer.value.getVirtualItems()[0]?.start ?? 0) - scrollMargin.value)
    : 0,
);
const paddingBottom = computed(() => {
  if (!enabled.value) return 0;
  const virtualRows = virtualizer.value.getVirtualItems();
  const last = virtualRows[virtualRows.length - 1];
  return Math.max(0, virtualizer.value.getTotalSize() - (last ? last.end - scrollMargin.value : 0));
});

watch(
  [enabled, start, () => scroller?.value, highlightedIndex, scrollMargin],
  () => {
    if (!enabled.value || !start.value || highlightedIndex.value < 0) return;
    virtualizer.value.scrollToIndex(highlightedIndex.value, { align: "center" });
  },
  { flush: "post" },
);

const discs = computed(() =>
  pipe(
    props.songs ?? [],
    map((item, index) => ({ item, index })),
    groupBy(({ item }) => item.attributes.discNumber ?? 1),
    values(),
    map((songs) => ({ number: songs[0].item.attributes.discNumber ?? 1, songs })),
  ),
);

defineEmits<{
  (e: "play", index: number): void;
}>();
</script>
