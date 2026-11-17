<template>
  <PageWrapper>
    <header class="flex items-center gap-2 p-4">
      <OMButtonPlay :disabled="!displayedEntries.length" @click="play()" />
      <OMButtonSecondary
        icon="lucide:shuffle"
        :disabled="!displayedEntries.length"
        @click="play(0, true)"
      />
      <OMButtonSeparator />
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
      <UTooltip text="Clear history">
        <OMButtonTertiary
          icon="lucide:trash-2"
          class="ml-auto"
          :disabled="!historyStore.entries.length"
          @click="historyStore.clear"
        />
      </UTooltip>
    </header>
    <USeparator v-if="!historyStore.entries.length || !displayedEntries.length" />
    <p v-if="!historyStore.entries.length" class="p-4 text-sm text-muted">
      No listening history yet.
    </p>
    <p v-else-if="!displayedEntries.length" class="p-4 text-sm text-muted">
      No songs match your search or filters.
    </p>
    <AMSongsWrapper v-if="displayedEntries.length" :columns>
      <AMSongs
        :songs="displayedSongs"
        :remove-from-history="removeFromHistory"
        virtualize
        @play="play"
      />
    </AMSongsWrapper>
    <AMFooter v-if="displayedEntries.length">
      <AMFooterCount :count="displayedEntries.length" singular="song" />
    </AMFooter>
  </PageWrapper>
</template>

<script lang="ts" setup>
import { indexBy } from "remeda";

import { defaultSongColumns, songColumns } from "#layers/amdata/app/lib/controls/columns";
import { contentRatingFilter, ratingFilter } from "#layers/amdata/app/lib/controls/filters";
import { songSearchKeys } from "#layers/amdata/app/lib/controls/search";

const historyStore = useHistoryStore();
const queueStore = useQueueStore();
const { columns } = useColumns<SongColumns>("songs", defaultSongColumns);
const {
  filters,
  selectedRatings,
  selectedContentRatings,
  isUploaded,
  changed,
  reset: resetFilters,
} = useFilters();

const search = ref("");
const tracks = computed(() => historyStore.entries.map((entry) => entry.track));
const searchedSongs = useSearch(tracks, search, songSearchKeys);
const displayedEntries = computed(() => {
  const entriesById = indexBy(historyStore.entries, (entry) => entry.track.id);

  return filterResources<AmSong>(searchedSongs.value, filters.value).flatMap((song) => {
    const entry = entriesById[song.id];
    return entry ? [entry] : [];
  });
});

const displayedSongs = computed(() => displayedEntries.value.map((entry) => entry.track));

function play(index = 0, shuffle = false) {
  if (index < 0 || !displayedEntries.value.length) return;
  queueStore.playContext(
    {
      index,
      tracks: displayedEntries.value.map((entry) => entry.track),
      context: {
        type: "generic",
        name: "History",
        link: "/history",
      },
    },
    shuffle,
  );
}

function removeFromHistory(_song: AmSong, index: number) {
  const entry = displayedEntries.value[index];
  if (entry) historyStore.deleteEntry(entry.id);
}
</script>
