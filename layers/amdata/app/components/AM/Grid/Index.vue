<template>
  <UScrollArea
    v-if="virtualize"
    ref="virtualGrid"
    v-slot="{ item: row }"
    :items="rows"
    :virtualize="{
      getScrollElement,
      scrollMargin,
      estimateSize: 320,
      overscan: 2,
      gap: 16,
    }"
    class="col-span-full"
  >
    <div class="grid gap-4" :style="{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }">
      <template v-for="(item, i) in row" :key="`${item.id}:${i}`">
        <AMGridItem
          v-if="item.type !== 'library-playlist-folders'"
          :resource="item"
          :show-artists
          :show-year
        />
        <AMGridFolderItem v-else :resource="item" />
      </template>
    </div>
  </UScrollArea>
  <template v-else>
    <template v-for="(item, i) in items" :key="`${item.id}:${i}`">
      <AMGridItem
        v-if="item.type !== 'library-playlist-folders'"
        :resource="item"
        :show-artists
        :show-year
      />
      <AMGridFolderItem v-else :resource="item" />
    </template>
  </template>
</template>

<script lang="ts" setup>
import { chunk } from "remeda";

const props = withDefaults(
  defineProps<{
    items?: (
      | AmAlbum
      | AmPlaylist
      | AmArtist
      | AmLibraryPlaylistFolder
      | AmSocialProfile
      | AmCatalogStation
    )[];
    showArtists?: boolean;
    showYear?: boolean;
    virtualize?: boolean;
    columns?: number;
  }>(),
  { items: () => [], columns: 1 },
);

const rows = computed(() => chunk(props.items ?? [], props.columns));
const scroller = inject(pageScrollerKey);
const getScrollElement = () => scroller?.value ?? null;
const virtualGrid = useTemplateRef("virtualGrid");
const scrollMargin = ref(0);

function updateOffset() {
  const element = virtualGrid.value?.$el;
  if (!element || !scroller?.value) return;
  scrollMargin.value =
    element.getBoundingClientRect().top -
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
watch(virtualGrid, updateOffset, { flush: "post" });
</script>
