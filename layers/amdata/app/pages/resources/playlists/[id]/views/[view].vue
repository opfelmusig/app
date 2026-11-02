<template>
  <PageWrapper>
    <header class="flex items-center gap-2 p-4">
      <OMButtonTertiary :to="rawResourceLink('playlists', id)" icon="lucide:arrow-left" />
      <h2>{{ title }}</h2>
    </header>
    <USeparator />
    <AMGridWrapper>
      <AMGridStatus :is-pending :error :total="items.length" :resources="items">
        <AMGrid :items />
      </AMGridStatus>
    </AMGridWrapper>
    <AMFooter class="items-center">
      <AMFooterCount :count="items.length" singular="artist" />
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
import {
  playlistViews,
  fetchCatalogPlaylistView,
  type PlaylistView,
} from "#layers/amdata/app/lib/queries/playlists";

definePageMeta({
  validate: (route) => playlistViews.some((view) => view === route.params.view),
});

const id = useRouteParams<string>("id");
const view = useRouteParams<PlaylistView>("view");

const queryTitle = useRouteQuery<string>("title", "");
const title = computed(() => queryTitle.value || view.value);

const { data, isPending, error, asyncStatus, hasNextPage, loadMore } = useAmInfiniteQuery({
  key: () => ["playlists", "views", "paginated", id.value, view.value],
  initialPageParam: 0,
  query: ({ pageParam, signal }) =>
    fetchCatalogPlaylistView(id.value, view.value, pageParam, signal),
  getNextPageParam: (page) => page.nextOffset,
  staleTime: ms("30m"),
  gcTime: ms("3h"),
});

const items = computed(() => data.value?.pages.flatMap((page) => page.items) ?? []);
</script>
