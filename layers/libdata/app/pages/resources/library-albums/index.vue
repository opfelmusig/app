<template>
  <PageWrapper>
    <header class="flex items-center gap-2 p-4">
      <AMControlsSorting
        v-model="sortBy"
        v-model:direction="direction"
        :items="libraryAlbumSorting"
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
    <USeparator />
    <AMGridWrapper v-slot="{ columns }">
      <AMGridStatus :is-pending :error :total="albums?.length" :resources="displayedAlbums">
        <AMGrid :items="displayedAlbums" :columns show-artists virtualize />
      </AMGridStatus>
    </AMGridWrapper>
    <AMFooter>
      <AMFooterCount :count="displayedAlbums?.length" singular="album" />
    </AMFooter>
  </PageWrapper>
</template>

<script lang="ts" setup>
import { contentRatingFilter, ratingFilter } from "#layers/amdata/app/lib/controls/filters";
import { albumSearchKeys } from "#layers/amdata/app/lib/controls/search";
import { libraryAlbumSorting } from "#layers/amdata/app/lib/controls/sorting";

const { data: albums, isPending, error } = useLibraryAlbums();
const search = ref("");
const searchedAlbums = useSearch(albums, search, albumSearchKeys);

const {
  sortBy,
  direction,
  sortChanged,
  reset: resetSorting,
} = useSorting<AlbumSort>("albums", "default");

const {
  filters,
  selectedRatings,
  selectedContentRatings,
  isUploaded,
  changed,
  reset: resetFilters,
} = useFilters();

const displayedAlbums = computed(() => {
  const filteredAlbums = filterResources(searchedAlbums.value, filters.value);

  if (search.value.trim()) return filteredAlbums;

  return sortAlbums(filteredAlbums, sortBy.value, direction.value);
});
</script>
