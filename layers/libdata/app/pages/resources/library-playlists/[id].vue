<template>
  <PageWrapper>
    <header class="flex flex-col gap-4 p-4 lg:flex-row">
      <UChip
        position="bottom-right"
        :ui="{ base: 'size-6 ring-3' }"
        class="shrink-0 self-start"
        inset
        color="neutral"
        :show="!!playlist"
      >
        <template #content>
          <UTooltip
            :text="playlist?.extras.isPublic ? 'Public playlist' : 'Private playlist'"
            arrow
          >
            <UIcon
              :name="playlist?.extras.isPublic ? 'lucide:globe' : 'lucide:lock-keyhole'"
              class="size-3.5 [&>g]:stroke-3"
              mode="svg"
            />
          </UTooltip>
        </template>
        <AMArtworkWrapper :resource="playlist" context="header">
          <AMMediaEditorialVideo
            :editorial-video="playlist?.attributes.editorialVideo"
            variant="square"
          >
            <template #fallback>
              <AMArtworkImage />
              <AMArtworkPlaceholder />
            </template>
          </AMMediaEditorialVideo>
        </AMArtworkWrapper>
      </UChip>
      <div class="flex w-full min-w-0 flex-col justify-end gap-4">
        <div v-if="playlist" class="flex w-full min-w-0 flex-col gap-1 whitespace-nowrap">
          <h2>{{ playlist.attributes.name }}</h2>
          <div class="flex items-center gap-2 text-sm whitespace-nowrap text-muted">
            <span v-if="playlist.attributes.curatorName" class="truncate">
              <NuxtLink
                v-if="playlist.attributes.curatorSocialHandle"
                :to="rawResourceLink('social-profiles', playlist.attributes.curatorSocialHandle)"
                class="hover:underline"
              >
                {{ playlist.attributes.curatorName }}
              </NuxtLink>
              <span v-else>
                {{ playlist.attributes.curatorName }}
              </span>
            </span>
            <div
              v-if="playlist.attributes.curatorName"
              class="size-1 shrink-0 rounded-full bg-accented"
            />
            <UTooltip
              v-if="playlist.attributes.lastModifiedDate"
              :text="playlist.attributes.lastModifiedDate.toLocaleString()"
              arrow
            >
              <span class="truncate">
                Updated
                <NuxtTime
                  :datetime="playlist.attributes.lastModifiedDate"
                  date-style="medium"
                  time-style="medium"
                  relative
                />
              </span>
            </UTooltip>
          </div>
          <p
            v-if="playlist?.attributes.description"
            class="line-clamp-2 text-sm whitespace-break-spaces text-dimmed"
          >
            {{ playlist.attributes.description }}
          </p>
        </div>
        <div v-else-if="isPending" class="flex items-center gap-2 text-sm text-muted">
          <UIcon name="lucide:loader-circle" class="size-4 animate-spin" />
          Loading playlist
        </div>
        <div v-else-if="error" class="flex items-center gap-2 text-sm text-error">
          <UIcon name="lucide:x" class="size-4 shrink-0" />
          <span>{{ error.message }}</span>
        </div>
        <p v-else class="text-sm text-muted">Playlist not found.</p>
        <div class="flex items-center gap-2">
          <OMButtonPlay
            :disabled="editing || !playlist || !displayedTracks.length"
            @click="play()"
          />
          <OMButtonSecondary
            icon="lucide:shuffle"
            :disabled="editing || !playlist || !displayedTracks.length"
            @click="play(0, true)"
          />
          <AMFavoriteButton v-if="playlist" :resource="playlist" :disabled="editing" />
          <OMButtonSeparator />
          <AMControlsSorting
            v-model="displaySortBy"
            v-model:direction="displayDirection"
            :disabled="editing"
            :items="defaultSongSorting"
            :active="!editing && sortChanged"
            @reset="resetSorting"
          />
          <AMControlsFilters
            :disabled="editing"
            :active="!editing && changed"
            @reset="resetFilters"
          >
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
          <AMControlsColumns v-model="columns" :disabled="editing" :items="songColumns" />
          <template v-if="editing || playlist?.extras.canEdit">
            <OMButtonSeparator />
            <template v-if="editing">
              <OMButtonSecondary
                icon="lucide:x"
                :disabled="savingOrder"
                @click="orderDraft = null"
              />
              <OMButtonSecondary
                :icon="savingOrder ? 'lucide:loader-circle' : 'lucide:check'"
                :disabled="savingOrder"
                :class="savingOrder ? '[&_svg]:animate-spin' : ''"
                @click="saveOrder"
              />
            </template>
            <OMButtonSecondary
              v-else
              icon="lucide:pencil"
              :disabled="!tracks?.length || tracksLoading || !!tracksError || removingTrack"
              @click="startReordering"
            />
          </template>
          <OMMenuButton
            v-if="menuItems.length"
            :items="menuItems"
            :disabled="editing"
            class="ml-auto"
          />
        </div>
      </div>
    </header>
    <AMSongsWrapper
      :columns
      :reorderable="editing && !savingOrder"
      :reorder-ids="songRows.map((row) => row.id)"
      @reorder="reorder"
    >
      <AMSongsStatus
        :is-pending="tracksPending"
        :error="tracksError"
        :total="tracks?.length"
        :songs="displayedTracks"
      >
        <AMSongsItem
          v-for="(row, index) in songRows"
          :key="row.id"
          :song="row.song"
          :reorder-id="row.id"
          :controls-disabled="editing"
          :remove-from-playlist="
            !editing && playlist?.extras.canEdit ? () => removeSong(row.song) : undefined
          "
          @play="play(index)"
        />
      </AMSongsStatus>
    </AMSongsWrapper>
    <AMFooter>
      <span>
        <AMFooterCount :count="displayedTracks?.length" singular="song" />,
        <span>
          {{ tracksDuration(displayedTracks) }}
        </span>
      </span>

      <AMFooterLink :resource="playlist ?? undefined" />
    </AMFooter>
  </PageWrapper>
</template>

<script lang="ts" setup>
import { defaultSongColumns, songColumns } from "#layers/amdata/app/lib/controls/columns";
import { contentRatingFilter, ratingFilter } from "#layers/amdata/app/lib/controls/filters";
import { defaultSongSorting, type SortingDirection } from "#layers/amdata/app/lib/controls/sorting";
import { fetchLibraryPlaylist } from "#layers/libdata/app/lib/queries/playlists";

const id = useRouteParams<string>("id");

const {
  data: playlist,
  isPending,
  error,
} = useLibraryQuery({
  key: () => ["playlists", "resource", id.value],
  query: () => fetchLibraryPlaylist(id.value),
  staleTime: ms("3h"),
});
const {
  data: tracks,
  isPending: tracksPending,
  isLoading: tracksLoading,
  error: tracksError,
} = useLibraryPlaylistTracks(id);

const mutations = useMutations();

interface PlaylistOrderDraft {
  playlistId: string;
  original: AmLibrarySong[];
  rows: { id: string; song: AmLibrarySong }[];
}

const orderDraft = shallowRef<PlaylistOrderDraft | null>(null);
const editing = computed(() => orderDraft.value !== null);
const { mutate: submitOrder, isLoading: savingOrder } = useMutation({
  mutation: (draft: PlaylistOrderDraft) =>
    mutations.reorderPlaylistTracks(
      draft.playlistId,
      draft.rows.map((row) => row.song),
    ),
  onSuccess: (_, draft) => {
    if (orderDraft.value === draft) orderDraft.value = null;
  },
});

function startReordering() {
  if (
    !playlist.value?.extras.canEdit ||
    playlist.value.id !== id.value ||
    !tracks.value?.length ||
    tracksLoading.value ||
    tracksError.value ||
    removingTrack.value
  )
    return;

  orderDraft.value = {
    playlistId: id.value,
    original: [...tracks.value],
    rows: tracks.value.map((song, index) => ({ id: String(index), song })),
  };
}

function reorder(move: TableReorder) {
  const draft = orderDraft.value;
  if (!draft || savingOrder.value) return;
  const from = draft.rows.findIndex((row) => row.id === move.id);
  const target = draft.rows.findIndex((row) => row.id === move.targetId);
  if (from < 0 || target < 0 || from === target) return;

  const to = target + (move.placement === "after" ? 1 : 0) - (from < target ? 1 : 0);
  const rows = [...draft.rows];
  const [row] = rows.splice(from, 1);
  if (!row) return;
  rows.splice(to, 0, row);
  orderDraft.value = { ...draft, rows };
}

function saveOrder() {
  const draft = orderDraft.value;
  if (!draft || savingOrder.value || draft.playlistId !== id.value) return;
  if (draft.rows.every((row, index) => row.song === draft.original[index])) {
    orderDraft.value = null;
    return;
  }
  submitOrder(draft);
}

watch(id, () => {
  orderDraft.value = null;
});

const { mutate: removeTrack, isLoading: removingTrack } = useMutation({
  mutation: (input: { playlistId: string; original: AmLibrarySong[]; index: number }) =>
    mutations.removePlaylistTrack(input.playlistId, input.original, input.index),
});

function removeSong(song: AmSong) {
  if (
    editing.value ||
    !playlist.value?.extras.canEdit ||
    tracksLoading.value ||
    tracksError.value ||
    song.type !== "library-songs"
  )
    return;
  if (!tracks.value || playlist.value.id !== id.value) return;

  const index = tracks.value.indexOf(song);
  if (index < 0) return;

  removeTrack({ playlistId: id.value, original: [...tracks.value], index });
}

const { columns } = useColumns("playlists", defaultSongColumns);

const { sortBy, direction, sortChanged, reset: resetSorting } = useSorting<SongSort>(id, "default");

const displaySortBy = computed({
  get: () => (editing.value ? "default" : sortBy.value),
  set: (value: SongSort) => {
    if (!editing.value) sortBy.value = value;
  },
});
const displayDirection = computed({
  get: () => (editing.value ? "asc" : direction.value),
  set: (value: SortingDirection) => {
    if (!editing.value) direction.value = value;
  },
});

const {
  filters,
  selectedRatings,
  selectedContentRatings,
  isUploaded,
  changed,
  reset: resetFilters,
} = useFilters();

const displayedTracks = computed(() => {
  if (orderDraft.value) return orderDraft.value.rows.map((row) => row.song);
  const filteredSongs = filterResources(tracks.value ?? [], filters.value);

  return sortSongs(filteredSongs, sortBy.value, direction.value);
});

const songRows = computed(
  () =>
    orderDraft.value?.rows ??
    displayedTracks.value.map((song, index) => ({ id: String(index), song })),
);

const queueStore = useQueueStore();

function play(index: number = 0, shuffle: boolean = false) {
  if (editing.value || !playlist.value || displayedTracks.value.length === 0) return;

  queueStore.playContext(
    {
      index,
      context: playlist.value,
      tracks: displayedTracks.value,
    },
    shuffle,
  );
}

const menuItems = useResourceMenu(() => playlist.value, {
  actions: { play: () => play(), shuffle: () => play(0, true) },
});
</script>
