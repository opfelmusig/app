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
    <div v-if="hasNextPage && !error" class="flex justify-center p-4">
      <UButton
        color="neutral"
        variant="ghost"
        :loading="asyncStatus === 'loading'"
        :disabled="asyncStatus === 'loading'"
        class="text-muted"
        @click="loadMore"
      >
        Load more
      </UButton>
    </div>
  </PageWrapper>
</template>

<script lang="ts" setup>
import { useInfiniteQuery } from "@pinia/colada";
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

const { data, isPending, error, asyncStatus, loadNextPage } = useInfiniteQuery({
  ...useAmQueryScope({
    key: () => ["artists", "views", "paginated", id.value, view.value],
  }),
  initialPageParam: 0,
  query: ({ pageParam, signal }) => fetchCatalogArtistView(id.value, view.value, pageParam, signal),
  getNextPageParam: (page) => page.nextOffset,
  staleTime: ms("30m"),
  gcTime: ms("3h"),
  autoRefetch: false,
});

const hasNextPage = computed(() => data.value?.pages.at(-1)?.nextOffset != null);

const partitionedItems = computed(() =>
  partition(data.value?.pages.flatMap((page) => page.items) ?? [], (item) => item.type === "songs"),
);
const songs = computed(() => partitionedItems.value[0]);
const gridItems = computed(() => partitionedItems.value[1]);

function loadMore() {
  if (asyncStatus.value === "loading" || error.value) return;
  if (hasNextPage.value) void loadNextPage({ cancelRefetch: false });
}

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
