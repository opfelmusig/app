<template>
  <div class="flex size-full flex-col overflow-hidden @2xl/page:flex-row">
    <div
      class="relative flex w-full shrink-0 flex-col overflow-hidden overflow-y-auto border-default @2xl/page:w-80 @2xl/page:border-r"
      :class="name ? 'max-h-[40%] border-b @2xl/page:max-h-none @2xl/page:border-b-0' : 'h-full'"
    >
      <header class="flex items-center gap-2 border-b border-default p-2">
        <OMButtonSecondary
          icon="lucide:arrow-up-down"
          :active="descending"
          @click="descending = !descending"
        />
        <UInput
          v-model="search"
          fixed
          variant="soft"
          color="neutral"
          icon="lucide:search"
          placeholder="Search..."
          class="min-w-0 flex-1"
          :ui="{ base: 'h-9 min-w-0 rounded-xl text-sm' }"
        />
      </header>
      <div class="flex cursor-pointer flex-col text-sm select-none">
        <NuxtLink
          v-for="genre in sortedGenres"
          :key="genre"
          class="flex gap-2 truncate border-b border-default p-4 last:border-b-0 hover:bg-raised route:bg-muted/40"
          :to="{ name: 'library-genres-name', params: { name: genre } }"
        >
          {{ genre }}
        </NuxtLink>
      </div>
      <AMFooter>
        <AMFooterCount :count="sortedGenres?.length" singular="genre" />
      </AMFooter>
    </div>
    <PageWrapper v-if="name" class="flex-1 @max-2xl/page:min-h-0">
      <header class="flex flex-col gap-4 p-4">
        <div class="flex min-w-0 items-center gap-2">
          <h2 class="truncate">
            {{ name }}
          </h2>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <AMControlsSorting
            v-model="sortBy"
            v-model:direction="direction"
            :items="defaultAlbumSorting"
            :active="sortChanged"
            @reset="resetSorting"
          />
          <OMButtonSecondary fill icon="lucide:filter" />
        </div>
      </header>
      <USeparator />
      <AMGridWrapper>
        <AMGridStatus
          :is-pending="currentGenreAlbumsPending"
          :error="currentGenreAlbumsError"
          :total="currentGenreAlbums?.length"
          :resources="displayedAlbums"
        >
          <AMGrid :items="displayedAlbums" show-artists />
        </AMGridStatus>
      </AMGridWrapper>
      <AMFooter>
        <AMFooterCount :count="displayedAlbums?.length" singular="album" />
      </AMFooter>
    </PageWrapper>
  </div>
</template>

<script lang="ts" setup>
import { filter, flatMap, isTruthy, pipe, sort, unique } from "remeda";

import { defaultAlbumSorting } from "#layers/amdata/app/lib/controls/sorting";

const {
  data: albums,
  isPending: currentGenreAlbumsPending,
  error: currentGenreAlbumsError,
} = useLibraryAlbums();

const genres = computed(() =>
  pipe(
    albums.value ?? [],
    flatMap((album) => album.attributes.genreNames),
    filter(isTruthy),
    unique(),
    sort((left, right) => left.localeCompare(right)),
  ),
);

const name = useRouteParams<string | undefined>("name");
const currentGenreAlbums = computed(() => {
  const genre = name.value;
  if (!genre) return [];

  return (albums.value ?? []).filter((album) => album.attributes.genreNames.includes(genre));
});

const search = ref("");

const searchedGenres = useSearch(genres, search);

const descending = ref(false);

const sortedGenres = computed(() => {
  if (search.value.trim()) return searchedGenres.value;

  return descending.value ? searchedGenres.value.toReversed() : searchedGenres.value;
});

const {
  sortBy,
  direction,
  sortChanged,
  reset: resetSorting,
} = useSorting<AlbumSort>(() => name.value ?? "genres", "title");

const displayedAlbums = computed(() => {
  return sortAlbums(currentGenreAlbums.value ?? [], sortBy.value, direction.value);
});
</script>
