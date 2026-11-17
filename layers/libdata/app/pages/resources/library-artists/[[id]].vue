<template>
  <div class="flex size-full overflow-hidden">
    <div class="relative flex w-80 shrink-0 flex-col overflow-hidden overflow-y-auto">
      <header class="flex items-center gap-2 border-b border-default p-2">
        <OMButtonSecondary
          icon="lucide:arrow-up-down"
          :active="descending"
          @click="descending = !descending"
        />
        <AMControlsFilters :active="filtersChanged" @reset="resetFilters">
          <AMControlsFiltersItem v-model="selectedRatings" label="Rating" :items="ratingFilter" />
          <AMControlsFiltersSection label="Artist">
            <UCheckbox v-model="hasCatalog" label="Has catalog" />
            <UCheckbox v-model="groupByCatalogId" label="Group by catalog" />
          </AMControlsFiltersSection>
        </AMControlsFilters>
        <UInput
          v-model="search"
          variant="soft"
          color="neutral"
          icon="lucide:search"
          placeholder="Search..."
          :ui="{ base: 'h-9 rounded-xl' }"
        />
      </header>
      <div v-if="artistsPending" class="flex items-center gap-2 p-4 text-sm text-muted">
        <UIcon name="lucide:loader-circle" class="size-4 animate-spin" />
        Loading artists
      </div>
      <div v-else-if="artistsError" class="flex items-center gap-2 p-4 text-sm text-error">
        <UIcon name="lucide:x" class="size-4 shrink-0" />
        <span>{{ artistsError.message }}</span>
      </div>
      <div v-else class="flex cursor-pointer flex-col text-sm select-none">
        <NuxtLink
          v-for="artist in displayedArtists"
          :key="artist.id"
          class="group flex h-14 items-center gap-2 border-b border-default px-2 last:border-b-0 hover:bg-raised route:bg-muted/40 [&:active:not(:has(.no-active:active))]:bg-muted/60"
          :class="{ 'bg-muted/40': id && artist.libraryIds.includes(id) }"
          :to="rawResourceLink('library-artists', artist.id)"
        >
          <AMArtworkWrapper :resource="artist" context="list">
            <AMArtworkImage />
            <AMArtworkPlaceholder />
          </AMArtworkWrapper>
          <div class="flex w-full min-w-0 items-center gap-2 overflow-hidden">
            <span class="truncate">
              {{ artist.attributes.name }}
            </span>
            <OMStar v-if="artist.attributes.personalRating === 1" />
          </div>
        </NuxtLink>
      </div>
      <AMFooter>
        <AMFooterCount :count="displayedArtists.length" singular="artist" />
      </AMFooter>
    </div>
    <USeparator orientation="vertical" />
    <PageWrapper v-if="id">
      <OMContextMenu :items="menuItems">
        <header class="flex flex-col gap-4 p-4">
          <div class="flex min-w-0 items-center gap-2">
            <AMArtworkWrapper :resource="currentArtist" context="list">
              <AMArtworkImage />
              <AMArtworkPlaceholder />
            </AMArtworkWrapper>
            <h2 v-if="currentArtist" class="truncate">
              {{ currentArtist.attributes.name }}
            </h2>
            <div v-else-if="artistPending" class="flex items-center gap-2 text-sm text-muted">
              <UIcon name="lucide:loader-circle" class="size-4 animate-spin" />
              Loading artist
            </div>
            <div v-else-if="artistError" class="flex min-w-0 items-center gap-2 text-sm text-error">
              <UIcon name="lucide:x" class="size-4 shrink-0" />
              <span>{{ artistError.message }}</span>
            </div>
            <p v-else class="text-sm text-muted">Artist not found.</p>
            <OMStar v-if="currentArtist?.attributes.personalRating === 1" large />
          </div>
          <div class="flex items-center gap-2">
            <AMControlsSorting
              v-model="sortBy"
              v-model:direction="direction"
              :items="artistAlbumSorting"
              :active="sortChanged"
              @reset="resetSorting"
            />
            <OMButtonSecondary fill icon="lucide:filter" />
            <OMMenuButton v-if="menuItems.length" :items="menuItems" class="ml-auto" />
          </div>
        </header>
      </OMContextMenu>
      <USeparator />
      <AMGridWrapper>
        <AMGridStatus
          :is-pending="currentArtistAlbumsPending"
          :error="currentArtistAlbumsError"
          :total="currentArtistAlbums?.length"
          :resources="displayedAlbums"
        >
          <AMGrid :items="displayedAlbums" show-year />
        </AMGridStatus>
      </AMGridWrapper>
      <AMFooter>
        <AMFooterCount :count="displayedAlbums?.length" singular="album" />

        <AMFooterLink :resource="currentArtist" />
      </AMFooter>
    </PageWrapper>
  </div>
</template>

<script lang="ts" setup>
import { ratingFilter, type FilterRating } from "#layers/amdata/app/lib/controls/filters";
import { artistSearchKeys } from "#layers/amdata/app/lib/controls/search";
import { artistAlbumSorting } from "#layers/amdata/app/lib/controls/sorting";
import { groupLibraryArtists } from "#layers/libdata/app/lib/artists";
import { fetchLibraryArtist } from "#layers/libdata/app/lib/queries/artists";

const { data: artists, isPending: artistsPending, error: artistsError } = useLibraryArtists();
const groupByCatalogId = usePersistableStorage("opfelmusig:list:artists:group-by-catalog-id", true);
const artistGroups = computed(() =>
  groupLibraryArtists(artists.value ?? [], groupByCatalogId.value),
);
const search = ref("");
const searchedArtists = useSearch(artistGroups, search, [...artistSearchKeys, "names"]);

const descending = ref(false);
const selectedRatings = ref<FilterRating[]>([]);
const hasCatalog = ref(false);
const filtersChanged = computed(
  () => selectedRatings.value.length > 0 || hasCatalog.value || !groupByCatalogId.value,
);

function resetFilters() {
  selectedRatings.value = [];
  hasCatalog.value = false;
  groupByCatalogId.value = false;
}

const displayedArtists = computed(() => {
  const selectedRatingValues = selectedRatings.value.map(Number);
  const filteredArtists = searchedArtists.value.filter((artist) => {
    const rating = artist.attributes.personalRating ?? 0;
    if (selectedRatingValues.length > 0 && !selectedRatingValues.includes(rating)) return false;
    if (hasCatalog.value && !artist.extras.catalogId) return false;

    return true;
  });

  if (search.value.trim()) return filteredArtists;

  return descending.value ? filteredArtists.toReversed() : filteredArtists;
});

const id = useRouteParams<string | undefined>("id");

const {
  data: currentArtist,
  isPending: artistPending,
  error: artistError,
} = useLibraryQuery({
  key: () => ["artists", "resource", id.value ?? null],
  query: () => fetchLibraryArtist(id.value!),
  enabled: id,
  staleTime: ms("3h"),
});
const menuItems = useResourceMenu(() => currentArtist.value);
const {
  data: albums,
  isPending: currentArtistAlbumsPending,
  error: currentArtistAlbumsError,
} = useLibraryAlbums();

const currentArtistAlbums = computed(() => {
  const artistId = id.value;
  if (!artistId) return [];

  const group = artistGroups.value.find((artist) => artist.libraryIds.includes(artistId));
  const artistIds = new Set(group?.libraryIds ?? [artistId]);

  return (albums.value ?? []).filter(
    (album) => album.extras.artistId && artistIds.has(album.extras.artistId),
  );
});

const {
  sortBy,
  direction,
  sortChanged,
  reset: resetSorting,
} = useSorting<AlbumSort>(() => id.value ?? "artists", "title");

const displayedAlbums = computed(() => {
  return sortAlbums(currentArtistAlbums.value ?? [], sortBy.value, direction.value);
});

definePageMeta({
  key: "library-artists",
});
</script>
