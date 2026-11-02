<template>
  <OMContextMenu :items="controlsDisabled ? [] : menuItems">
    <OMTableRow
      ref="row"
      class="scroll-mt-8"
      :highlighted="isHighlighted"
      :disabled
      :reorder-id
      @dblclick="!controlsDisabled && !disabled && $emit('play')"
    >
      <OMTableSimple>
        <AMArtworkWrapper
          v-slot="{ iconClass }"
          :resource="song"
          context="list"
          :transparent="albumMode"
        >
          <template v-if="albumMode">
            <div v-if="!isActive" class="flex size-full items-center justify-center text-muted">
              <span class="truncate text-center tabular-nums group-hover:opacity-0">
                {{ song.attributes.trackNumber }}
              </span>
            </div>
            <div v-else class="absolute inset-0 flex items-center justify-center">
              <OMIcon
                v-if="playbackStore.loading"
                name="lucide:loader-circle"
                class="size-4 animate-spin text-highlighted [&>path]:stroke-3"
              />
              <OMVisualizer v-else />
            </div>
          </template>
          <template v-else>
            <AMArtworkImage />
            <div
              v-if="isActive"
              class="absolute inset-0 flex items-center justify-center bg-muted/50"
            >
              <OMIcon
                v-if="playbackStore.loading"
                name="lucide:loader-circle"
                class="size-4 animate-spin text-highlighted [&>path]:stroke-3"
              />
              <OMVisualizer v-else />
            </div>
            <AMArtworkPlaceholder />
          </template>
          <AMArtworkOverlay
            v-if="!isActive && !controlsDisabled"
            :transparent="albumMode"
            @click="$emit('play')"
          >
            <OMIcon name="lucide:play" :class="iconClass" filled />
          </AMArtworkOverlay>
        </AMArtworkWrapper>
      </OMTableSimple>
      <OMTableData>
        <div class="flex items-center gap-2">
          <span class="truncate">
            {{ song.attributes.name }}
          </span>
          <OMStar v-if="song.attributes.personalRating === 1" />
          <div class="ml-auto flex gap-2 empty:hidden">
            <OMExplicit v-if="song.attributes.contentRating === 'explicit'" />
            <OMDownloaded v-if="song.type === 'songs' && song.extras.libraryId" />
          </div>
        </div>
      </OMTableData>
      <OMTableData v-if="columns.includes('album')" class="text-muted">
        <AMLinks
          :links="song.attributes.albums"
          type="albums"
          :fallback-name="song.attributes.albumName"
          :fallback-id="song.type === 'library-songs' ? song.extras.albumId : undefined"
        />
      </OMTableData>
      <OMTableData v-if="columns.includes('artist')" class="text-muted">
        <AMLinks
          :links="song.attributes.artists"
          type="artists"
          :fallback-name="song.attributes.artistName"
          :fallback-id="song.type === 'library-songs' ? song.extras.artistId : undefined"
        />
      </OMTableData>
      <OMTableData v-if="columns.includes('genre')" class="text-muted">
        {{ song.attributes.genreNames.join(", ") }}
      </OMTableData>
      <OMTableData v-if="columns.includes('year')" class="text-muted tabular-nums">
        <NuxtTime
          v-if="song.attributes.releaseDate"
          :datetime="song.attributes.releaseDate"
          year="numeric"
        />
      </OMTableData>
      <OMTableData v-if="columns.includes('length')" class="text-end text-muted tabular-nums">
        {{ msToHMS(song.attributes.durationInMillis) }}
      </OMTableData>
      <OMTableSimple class="pl-1">
        <OMMenuButton :items="menuItems" :disabled="controlsDisabled" />
      </OMTableSimple>
    </OMTableRow>
  </OMContextMenu>
</template>

<script lang="ts" setup>
const highlightedSongId = useRouteQuery<string>("song_id");

const props = defineProps<{
  song: AmSong;
  albumMode?: boolean;
  reorderId?: string;
  controlsDisabled?: boolean;
  removeFromPlaylist?: () => void;
  removeFromQueue?: () => void;
  removeFromHistory?: () => void;
}>();

const row = useTemplateRef("row");
const isHighlighted = computed(() => highlightedSongId.value === props.song.id);

watch(
  [row, isHighlighted],
  ([, highlighted]) => {
    if (!highlighted) return;

    unrefElement(row.value)?.scrollIntoView({
      block: "center",
      inline: "nearest",
      behavior: "smooth",
    });
  },
  { flush: "post" },
);

const columns = useTableColumns();

const emit = defineEmits<{
  (e: "play"): void;
}>();

const queueStore = useQueueStore();
const playbackStore = usePlaybackStore();

const isActive = computed(() => queueStore.current?.entry.id === props.song.id);
const disabled = computed(() => !props.song.attributes.playParams && !props.controlsDisabled);

const menuItems = useResourceMenu(() => props.song, {
  actions: () => ({
    play: () => emit("play"),
    removeFromPlaylist: props.removeFromPlaylist,
    removeFromQueue: props.removeFromQueue,
    removeFromHistory: props.removeFromHistory,
  }),
});
</script>
