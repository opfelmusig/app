<template>
  <PageWrapper>
    <header class="flex items-center gap-2 p-4">
      <OMButtonTertiary :to="rawResourceLink('artists', id)" icon="lucide:arrow-left" />
      <h2>{{ title }}</h2>
    </header>
    <USeparator />
    <AMSongsWrapper v-if="view === 'top-songs'" :columns="['album', 'artist', 'length']">
      <AMSongsStatus :is-pending :error :total="songs.length" :songs>
        <AMSongs :songs @play="play" />
      </AMSongsStatus>
    </AMSongsWrapper>
    <AMGridWrapper v-else>
      <AMGridStatus :is-pending :error :total="gridItems.length" :resources="gridItems">
        <AMGrid :items="gridItems" show-artists show-year />
      </AMGridStatus>
    </AMGridWrapper>
    <AMFooter class="items-center">
      <AMFooterCount
        :count="view === 'top-songs' ? songs.length : gridItems.length"
        :singular="itemLabel"
      />
      <AMLoadMore
        :has-more="hasNextPage"
        :error
        :loading="asyncStatus === 'loading'"
        @load="loadMore"
      />
    </AMFooter>
  </PageWrapper>
</template>

<script lang="ts" setup>
import { partition } from "remeda";

import {
  artistViews,
  fetchCatalogArtistView,
  type ArtistView,
} from "#layers/amdata/app/lib/queries/artists";

definePageMeta({
  validate: (route) => artistViews.some((view) => view === route.params.view),
});

const id = useRouteParams<string>("id");
const view = useRouteParams<ArtistView>("view");

const resourceName = useRouteQuery<string>("name", "");
const queryTitle = useRouteQuery<string>("title", "");
const title = computed(() => queryTitle.value || view.value);
const contextName = computed(() => [resourceName.value, title.value].filter(Boolean).join(" · "));

const { data, isPending, error, asyncStatus, hasNextPage, loadMore } = useAmInfiniteQuery({
  key: () => ["artists", "views", "paginated", id.value, view.value],
  initialPageParam: 0,
  query: ({ pageParam, signal }) => fetchCatalogArtistView(id.value, view.value, pageParam, signal),
  getNextPageParam: (page) => page.nextOffset,
  staleTime: ms("30m"),
  gcTime: ms("3h"),
});

const partitionedItems = computed(() =>
  partition(data.value?.pages.flatMap((page) => page.items) ?? [], (item) => item.type === "songs"),
);
const songs = computed(() => partitionedItems.value[0]);
const gridItems = computed(() => partitionedItems.value[1]);
const itemLabel = computed(() =>
  view.value === "top-songs"
    ? "song"
    : view.value === "playlists"
      ? "playlist"
      : view.value === "similar-artists"
        ? "artist"
        : "album",
);

const queueStore = useQueueStore();
const route = useRoute();

function play(index: number) {
  if (songs.value.length === 0) return;

  queueStore.playContext({
    tracks: songs.value,
    index,
    context: {
      type: "generic",
      name: contextName.value,
      link: route.fullPath,
    },
  });
}
</script>
