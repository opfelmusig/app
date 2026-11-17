<template>
  <PageWrapper v-slot="{ scroller }" class="py-4">
    <UScrollArea
      v-if="data?.length"
      v-slot="{ item: shelf }"
      :items="data"
      :virtualize="{
        getScrollElement: () => scroller,
        estimateSize: 350,
        overscan: 2,
        gap: 32,
        scrollMargin: 16,
      }"
      class="shrink-0"
    >
      <AMResourceShelf
        :title="shelf.attributes.title ?? 'Recommendations'"
        :description="shelf.attributes.reason"
        :items="shelf.relationships.content"
        :see-more-to="shelf.attributes.hasSeeAll ? `/home/${shelf.id}` : undefined"
        show-artists
      />
    </UScrollArea>
    <div class="flex w-full justify-center px-4">
      <div
        v-if="!data && isPending"
        class="flex items-center justify-center gap-2 py-8 text-sm text-muted"
      >
        <UIcon name="lucide:loader-circle" class="size-4 animate-spin" />
        Loading recommendations
      </div>
      <div v-else-if="error" class="flex items-center gap-2 text-sm text-error">
        <UIcon name="lucide:x" class="size-4 shrink-0" />
        <span>{{ error.message }}</span>
      </div>
      <p v-else-if="data?.length === 0" class="py-8 text-center text-sm text-muted">
        No recommendations available.
      </p>
    </div>
  </PageWrapper>
</template>

<script lang="ts" setup>
import { fetchHome } from "#layers/amdata/app/lib/queries/home";

const { data, isPending, error } = useAmQuery({
  key: () => ["home", "list"],
  query: () => fetchHome(),
  staleTime: ms("2m"),
  gcTime: ms("3h"),
});
</script>
