<template>
  <PageWrapper>
    <header class="flex items-center gap-2 p-4">
      <OMButtonPlay :disabled="!displayedSongs.length" @click="play()" />
      <OMButtonSecondary
        icon="lucide:shuffle"
        :disabled="!displayedSongs.length"
        @click="play(0, true)"
      />
      <OMButtonSeparator />
      <AMControlsSorting
        v-model="sortBy"
        v-model:direction="direction"
        :items="librarySongSorting"
        :active="sortChanged"
        @reset="resetSorting"
      />
      <AMControlsFilters :active="changed" @reset="resetFilters">
        <AMControlsFiltersItem v-model="selectedRatings" label="Rating" :items="ratingFilter" />
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
      <UInput
        v-model="search"
        variant="soft"
        color="neutral"
        icon="lucide:search"
        placeholder="Search..."
        class="shrink-0"
        :ui="{ base: 'h-9 rounded-xl' }"
      />
    </header>
    <AMSongsWrapper :columns>
      <AMSongsStatus
        :is-pending="songsPending"
        :error="songsError"
        :total="songs?.length"
        :songs="displayedSongs"
      >
        <AMSongs :songs="displayedSongs" virtualize @play="play" />
      </AMSongsStatus>
    </AMSongsWrapper>
    <AMFooter>
      <span>
        <AMFooterCount :count="displayedSongs?.length" singular="song" />,
        <span>
          {{ tracksDuration(displayedSongs) }}
        </span>
      </span>
    </AMFooter>
  </PageWrapper>
</template>

<script lang="ts" setup>
import { defaultSongColumns, songColumns } from "#layers/amdata/app/lib/controls/columns";
import { contentRatingFilter, ratingFilter } from "#layers/amdata/app/lib/controls/filters";
import { songSearchKeys } from "#layers/amdata/app/lib/controls/search";
import { librarySongSorting } from "#layers/amdata/app/lib/controls/sorting";

const { data: songs, isPending: songsPending, error: songsError } = useLibrarySongs();

const { columns } = useColumns<SongColumns>("songs", defaultSongColumns);

const {
  sortBy,
  direction,
  sortChanged,
  reset: resetSorting,
} = useSorting<SongSort>("songs", "default");

const {
  filters,
  selectedRatings,
  selectedContentRatings,
  isUploaded,
  changed,
  reset: resetFilters,
} = useFilters();

const search = ref("");
const searchedSongs = useSearch(songs, search, songSearchKeys);

const displayedSongs = computed(() => {
  const filteredSongs = filterResources(searchedSongs.value, filters.value);

  if (search.value.trim()) return filteredSongs;

  return sortSongs(filteredSongs, sortBy.value, direction.value);
});

const queueStore = useQueueStore();

function play(index: number = 0, shuffle: boolean = false) {
  if (displayedSongs.value.length === 0) return;

  queueStore.playContext(
    {
      index,
      tracks: displayedSongs.value,
      context: { type: "generic", name: "Library songs", link: "/resources/library-songs" },
    },
    shuffle,
  );
}
</script>
