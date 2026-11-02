<template>
  <AMSongsWrapper
    :columns="[]"
    reorderable
    :reorder-ids="visibleEntries.map((entry) => entry.id)"
    @reorder="queueStore.moveEntry($event.id, $event.targetId, $event.placement)"
  >
    <AMSongsItem
      v-for="entry in visibleEntries"
      :key="entry.id"
      :song="entry.entry"
      :reorder-id="entry.id"
      :remove-from-queue="() => queueStore.deleteEntry(entry.id)"
      @play="queueStore.playEntry(entry.id)"
    />
    <OMTableStatus v-if="remainingCount > 0">
      <div class="flex items-center gap-2">
        <OMIcon name="lucide:layout-grid" class="size-4" filled />
        <span>{{ remainingCount }} more {{ remainingCount === 1 ? "song" : "songs" }}</span>
      </div>
    </OMTableStatus>
  </AMSongsWrapper>
</template>

<script lang="ts" setup>
const props = defineProps<{ entries: QueueEntry[] }>();
const queueStore = useQueueStore();

const visibleEntries = computed(() => props.entries.slice(0, queueStore.maxDisplayedSongs));
const remainingCount = computed(() => props.entries.length - visibleEntries.value.length);
</script>
