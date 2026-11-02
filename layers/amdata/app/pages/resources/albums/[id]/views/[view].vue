<template>
  <PageWrapper>
    <header class="flex items-center gap-2 p-4">
      <OMButtonTertiary :to="rawResourceLink('albums', id)" icon="lucide:arrow-left" />
      <h2>{{ title }}</h2>
    </header>
    <USeparator />
    <AMGridWrapper>
      <AMGridStatus :is-pending :error :total="items.length" :resources="items">
        <AMGrid :items show-artists show-year />
      </AMGridStatus>
    </AMGridWrapper>
    <AMLoadMore
      :has-more="hasNextPage"
      :error
      :loading="asyncStatus === 'loading'"
      @load="loadMore"
    />
  </PageWrapper>
</template>

<script lang="ts" setup>
import {
  albumViews,
  fetchCatalogAlbumView,
  type AlbumView,
} from "#layers/amdata/app/lib/queries/albums";

definePageMeta({
  validate: (route) => albumViews.some((view) => view === route.params.view),
});

const id = useRouteParams<string>("id");
const view = useRouteParams<AlbumView>("view");

const queryTitle = useRouteQuery<string>("title", "");
const title = computed(() => queryTitle.value || view.value);

const { data, isPending, error, asyncStatus, hasNextPage, loadMore } = useAmInfiniteQuery({
  key: () => ["albums", "views", "paginated", id.value, view.value],
  initialPageParam: 0,
  query: ({ pageParam, signal }) => fetchCatalogAlbumView(id.value, view.value, pageParam, signal),
  getNextPageParam: (page) => page.nextOffset,
  staleTime: ms("30m"),
  gcTime: ms("3h"),
});

const items = computed(() => data.value?.pages.flatMap((page) => page.items) ?? []);
</script>
