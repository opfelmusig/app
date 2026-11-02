<template>
  <PageWrapper>
    <header class="flex flex-col gap-4 p-4">
      <form class="w-full max-w-150" @submit.prevent="search(draft)">
        <UInput
          ref="search-input"
          v-model="draft"
          autofocus
          variant="soft"
          color="neutral"
          icon="lucide:search"
          placeholder="Search..."
          class="w-full"
          :ui="{ base: 'h-10 rounded-xl' }"
        />
      </form>
      <div v-if="term" class="flex gap-2">
        <UButton
          v-for="item in searchFilters"
          :key="item"
          color="neutral"
          size="sm"
          :variant="filter === item ? 'soft' : 'ghost'"
          class="capitalize"
          @click="filter = item"
        >
          {{ item }}
        </UButton>
      </div>
    </header>
    <section v-if="!term && searchHistory.length" class="flex flex-col gap-3 p-4">
      <div class="flex items-center justify-between gap-4">
        <h2>Recently searched</h2>
        <UButton color="neutral" variant="soft" size="sm" @click="searchHistory = []">
          Clear
        </UButton>
      </div>
      <ul class="flex flex-wrap gap-2">
        <li v-for="entry in searchHistory" :key="entry" class="flex max-w-full min-w-0">
          <UButton
            color="neutral"
            variant="soft"
            icon="lucide:history"
            class="min-w-0 rounded-r-none border-r border-bg"
            :label="entry"
            @click="search(entry)"
          />
          <UButton
            color="neutral"
            variant="soft"
            size="xs"
            icon="lucide:x"
            class="shrink-0 rounded-l-none px-2"
            :ui="{ leadingIcon: 'size-3' }"
            @click="removeSearch(entry)"
          />
        </li>
      </ul>
    </section>
    <template v-if="term">
      <div v-if="isPending" class="flex items-center justify-center gap-2 py-8 text-sm text-muted">
        <UIcon name="lucide:loader-circle" class="size-4 animate-spin" />
        Loading results
      </div>
      <p v-else-if="!error && isEmpty" class="py-8 text-center text-sm text-muted">
        No results for “{{ term }}”.
      </p>
      <template v-else-if="results">
        <div v-if="filter === 'all'" class="flex flex-col gap-8 py-4">
          <AMResourceShelf
            v-for="section in sections"
            :key="section"
            :title="section.charAt(0).toUpperCase() + section.slice(1)"
            :items="results[section]"
            :see-more-to="{ path: '/search', query: { term, filter: section } }"
            show-artists
          />
        </div>
        <AMSongsWrapper v-else-if="filter === 'songs'" :columns="['album', 'artist', 'length']">
          <AMSongs :songs="results.songs" @play="play" />
        </AMSongsWrapper>
        <AMGridWrapper v-else>
          <AMGrid :items="results[filter]" show-artists />
        </AMGridWrapper>
      </template>
      <div v-if="error" class="flex items-center gap-2 p-4 text-sm text-error">
        <UIcon name="lucide:x" class="size-4 shrink-0" />
        <span>{{ error.message }}</span>
      </div>
      <AMFooter v-if="results" class="items-center">
        <AMFooterCount
          :count="resultCount"
          :singular="filter === 'all' ? 'result' : filter.slice(0, -1)"
        />
        <AMLoadMore
          :has-more="hasNextPage"
          :error
          :loading="asyncStatus === 'loading'"
          @load="loadMore"
        />
      </AMFooter>
    </template>
  </PageWrapper>
</template>

<script lang="ts" setup>
import {
  fetchCatalogSearch,
  searchFilters,
  type SearchFilter,
} from "#layers/amdata/app/lib/queries/search";

const queueStore = useQueueStore();
const searchHistory = useLocalStorage<string[]>("opfelmusig:search-history", []);

const term = useRouteQuery<string>("term", "");
const filter = useRouteQuery<SearchFilter>("filter", "all", {
  transform: {
    get: (value) => (searchFilters.includes(value) ? value : "all"),
    set: (value) => value,
  },
});
const sections = ["songs", "albums", "artists", "playlists"] as const;
const draft = ref(term.value);

watch(term, (value) => {
  draft.value = value;
});

function search(value: string) {
  const query = value.trim();
  term.value = query;
  draft.value = query;
  if (!query) return;

  searchHistory.value = [
    query,
    ...searchHistory.value.filter((entry) => entry.toLowerCase() !== query.toLowerCase()),
  ].slice(0, 20);
}

function removeSearch(value: string) {
  searchHistory.value = searchHistory.value.filter((entry) => entry !== value);
}

const { data, isPending, error, asyncStatus, hasNextPage, loadMore } = useAmInfiniteQuery({
  key: () => ["search", "paginated", filter.value, term.value],
  initialPageParam: 0,
  query: ({ pageParam, signal }) => fetchCatalogSearch(term.value, filter.value, pageParam, signal),
  getNextPageParam: (page) => page.nextOffset,
  enabled: () => !!term.value.trim(),
  staleTime: Infinity,
  gcTime: ms("5m"),
});

const results = computed(() => {
  const pages = data.value?.pages;
  if (!pages) return undefined;

  return {
    songs: pages.flatMap((page) => page.songs),
    albums: pages.flatMap((page) => page.albums),
    artists: pages.flatMap((page) => page.artists),
    playlists: pages.flatMap((page) => page.playlists),
  };
});

const isEmpty = computed(() => sections.every((section) => !results.value?.[section].length));
const resultCount = computed(() =>
  filter.value === "all"
    ? sections.reduce((count, section) => count + (results.value?.[section].length ?? 0), 0)
    : (results.value?.[filter.value].length ?? 0),
);

function play(index: number) {
  if (!results.value?.songs.length) return;

  queueStore.playContext({
    tracks: results.value.songs,
    index,
    context: {
      type: "generic",
      name: `Search: ${term.value}`,
      link: `/search?${new URLSearchParams({ term: term.value, filter: "songs" })}`,
    },
  });
}

const searchInput = useTemplateRef("search-input");

useKeybind({
  keys: "ctrl-cmd+f",
  run: () => searchInput.value?.inputRef?.focus(),
  config: { prevent: true, ignoreRepeat: true },
});
</script>
