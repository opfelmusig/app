<template>
  <PageWrapper>
    <OMContextMenu :items="menuItems">
      <header class="flex flex-col gap-4 p-4 lg:flex-row">
        <AMArtworkWrapper :resource="album" context="header">
          <AMMediaEditorialVideo
            :editorial-video="album?.attributes.editorialVideo"
            variant="square"
          >
            <template #fallback>
              <AMArtworkImage />
              <AMArtworkPlaceholder />
            </template>
          </AMMediaEditorialVideo>
        </AMArtworkWrapper>
        <div class="flex w-full min-w-0 flex-col justify-end gap-4">
          <div v-if="album" class="flex min-w-0 flex-col gap-1">
            <div class="flex items-center gap-2">
              <h2 class="truncate">{{ album.attributes.name }}</h2>
              <OMExplicit v-if="album.attributes.contentRating === 'explicit'" />
              <OMDownloaded v-if="album.extras.libraryId" />
            </div>
            <div class="flex items-center gap-2 text-sm whitespace-nowrap text-muted">
              <AMLinks
                :links="album.attributes.artists"
                type="artists"
                :fallback-name="album.attributes.artistName"
              />
              <template v-if="album.attributes.releaseDate">
                <div class="size-1 shrink-0 rounded-full bg-accented first:hidden" />
                <span>
                  Released
                  <AMReleaseDate :release-date="album.attributes.releaseDate" date-style="long" />
                </span>
              </template>
              <template v-if="album.attributes.genreNames.length">
                <div class="size-1 shrink-0 rounded-full bg-accented first:hidden" />
                <span>{{ album.attributes.genreNames.join(", ") }}</span>
              </template>
            </div>
          </div>
          <div v-else-if="isPending" class="flex items-center gap-2 text-sm text-muted">
            <UIcon name="lucide:loader-circle" class="size-4 animate-spin" />
            Loading album
          </div>
          <div v-else-if="error" class="flex items-center gap-2 text-sm text-error">
            <UIcon name="lucide:x" class="size-4 shrink-0" />
            <span>{{ error.message }}</span>
          </div>
          <p v-else class="text-sm text-muted">Album not found.</p>
          <div class="flex flex-wrap items-center gap-2">
            <OMButtonPlay :disabled="!album || !displayedTracks.length" @click="play()" />
            <OMButtonSecondary
              icon="lucide:shuffle"
              :disabled="!album || !displayedTracks.length"
              @click="play(0, true)"
            />
            <AMFavoriteButton v-if="album" :resource="album" />
            <OMButtonSeparator />
            <AMControlsSorting
              v-model="sortBy"
              v-model:direction="direction"
              :items="albumSongSorting"
              :active="sortChanged"
              @reset="resetSorting"
            />
            <AMControlsFilters :active="changed" @reset="resetFilters">
              <AMControlsFiltersItem
                v-model="selectedRatings"
                label="Rating"
                :items="ratingFilter"
              />
              <AMControlsFiltersItem
                v-model="selectedContentRatings"
                label="Content rating"
                :items="contentRatingFilter"
              />
              <AMControlsFiltersSection label="Library">
                <UCheckbox v-model="inLibrary" label="In library" />
              </AMControlsFiltersSection>
            </AMControlsFilters>
            <AMControlsColumns v-model="columns" :items="songColumns" />
            <OMMenuButton v-if="menuItems.length" :items="menuItems" class="ml-auto" />
          </div>
        </div>
      </header>
    </OMContextMenu>
    <AMSongsWrapper :columns>
      <AMSongsStatus
        :is-pending="tracksPending"
        :error="tracksError"
        :total="tracks?.length"
        :songs="displayedTracks"
      >
        <AMSongs :songs="displayedTracks" album-mode :album-sort="!sortChanged" @play="play" />
      </AMSongsStatus>
    </AMSongsWrapper>
    <AMFooter>
      <span>
        <AMFooterCount :count="displayedTracks.length" singular="song" />,
        {{ tracksDuration(displayedTracks) }}
      </span>
    </AMFooter>
    <USeparator class="last:hidden" />
    <div v-if="album" class="flex flex-col gap-8 py-4">
      <AMResourceShelf
        v-for="section in views"
        :key="section.view"
        :title="section.title"
        :items="section.items"
        :see-more-to="
          section.hasMore
            ? {
                path: `/resources/albums/${id}/views/${section.view}`,
                query: { title: section.title },
              }
            : undefined
        "
        show-artists
        show-year
      />
    </div>
  </PageWrapper>
</template>

<script lang="ts" setup>
import { songColumns } from "#layers/amdata/app/lib/controls/columns";
import { contentRatingFilter, ratingFilter } from "#layers/amdata/app/lib/controls/filters";
import { albumSongSorting } from "#layers/amdata/app/lib/controls/sorting";
import {
  fetchCatalogAlbum,
  fetchCatalogAlbumTracks,
  fetchCatalogAlbumViews,
} from "#layers/amdata/app/lib/queries/albums";

const id = useRouteParams<string>("id");

const {
  data: album,
  isPending,
  error,
} = useAmQuery({
  key: () => ["albums", "resource", id.value],
  query: () => fetchCatalogAlbum(id.value),
  staleTime: ms("1h"),
  gcTime: ms("3h"),
});

const { data: views } = useAmQuery({
  key: () => ["albums", "views", id.value, "all"],
  query: () => fetchCatalogAlbumViews(id.value),
  staleTime: ms("30m"),
  gcTime: ms("3h"),
});

const {
  data: tracks,
  isPending: tracksPending,
  error: tracksError,
} = useAmQuery({
  key: () => ["albums", "tracks", id.value],
  query: () => fetchCatalogAlbumTracks(id.value),
  staleTime: ms("30m"),
  gcTime: ms("3h"),
});

const { columns } = useColumns<SongColumns>("albums", ["artist", "length"]);

const {
  sortBy,
  direction,
  sortChanged,
  reset: resetSorting,
} = useSorting<SongSort>(id, "discAndTrackNumber");

const {
  filters,
  selectedRatings,
  selectedContentRatings,
  inLibrary,
  changed,
  reset: resetFilters,
} = useFilters();

const displayedTracks = computed(() => {
  const filteredTracks = filterResources<AmSong>(tracks.value ?? [], filters.value);
  return sortSongs(filteredTracks, sortBy.value, direction.value);
});

const queueStore = useQueueStore();

function play(index = 0, shuffle = false) {
  if (!album.value || displayedTracks.value.length === 0) return;

  queueStore.playContext({ index, context: album.value, tracks: displayedTracks.value }, shuffle);
}

const menuItems = useResourceMenu(() => album.value, {
  actions: { play: () => play(), shuffle: () => play(0, true) },
});
</script>
