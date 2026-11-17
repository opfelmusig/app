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
          <div v-if="album" class="flex w-full min-w-0 flex-col gap-1 whitespace-nowrap">
            <div class="flex items-center gap-2">
              <h2 class="truncate">{{ album.attributes.name }}</h2>
              <OMExplicit v-if="album.attributes.contentRating === 'explicit'" />
            </div>
            <div class="flex items-center gap-2 text-sm whitespace-nowrap text-muted">
              <AMLinks
                :links="album.attributes.artists"
                type="artists"
                :fallback-name="album.attributes.artistName"
                :fallback-id="album.extras.artistId"
              />
              <div class="size-1 shrink-0 rounded-full bg-accented first:hidden" />
              <span v-if="album.attributes.releaseDate" class="truncate">
                Released
                <AMReleaseDate :release-date="album.attributes.releaseDate" date-style="long" />
              </span>
              <div
                v-if="album.attributes.releaseDate"
                class="size-1 shrink-0 rounded-full bg-accented first:hidden"
              />
              <span v-if="album.attributes.genreNames.length > 0" class="truncate">
                {{ album.attributes.genreNames.join(", ") }}
              </span>
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
          <div class="flex items-center gap-2">
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
              <AMControlsFiltersSection label="Type">
                <UCheckbox v-model="isUploaded" label="Uploaded" />
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
        <AMFooterCount :count="displayedTracks?.length" singular="song" />,
        <span>
          {{ tracksDuration(displayedTracks) }}
        </span>
      </span>

      <AMFooterLink :resource="album" />
    </AMFooter>
  </PageWrapper>
</template>

<script lang="ts" setup>
import { songColumns } from "#layers/amdata/app/lib/controls/columns";
import { contentRatingFilter, ratingFilter } from "#layers/amdata/app/lib/controls/filters";
import { albumSongSorting } from "#layers/amdata/app/lib/controls/sorting";
import { fetchLibraryAlbum } from "#layers/libdata/app/lib/queries/albums";

const id = useRouteParams<string>("id");

const {
  data: album,
  isPending,
  error,
} = useLibraryQuery({
  key: () => ["albums", "resource", id.value],
  query: () => fetchLibraryAlbum(id.value),
  staleTime: ms("3h"),
});
const { data: tracks, isPending: tracksPending, error: tracksError } = useLibraryAlbumTracks(id);

const { columns } = useColumns("albums", ["artist", "length"]);

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
  isUploaded,
  changed,
  reset: resetFilters,
} = useFilters();

const displayedTracks = computed(() => {
  const filteredSongs = filterResources(tracks.value ?? [], filters.value);

  return sortSongs(filteredSongs, sortBy.value, direction.value);
});

const queueStore = useQueueStore();

function play(index: number = 0, shuffle: boolean = false) {
  if (!album.value || displayedTracks.value.length === 0) return;

  queueStore.playContext(
    {
      index,
      context: album.value,
      tracks: displayedTracks.value,
    },
    shuffle,
  );
}

const menuItems = useResourceMenu(() => album.value, {
  actions: { play: () => play(), shuffle: () => play(0, true) },
});
</script>
