<template>
  <UModal
    v-model:open="open"
    title="Add to playlist"
    :dismissible="!isLoading"
    :ui="{ content: 'top-[calc(50%-192px)] max-w-lg translate-y-0 overflow-hidden' }"
  >
    <template #content>
      <UCommandPalette
        v-model:search-term="search"
        placeholder="Add to playlist..."
        :groups
        :disabled="isLoading"
        :input="{ disabled: isLoading, fixed: true, ui: { base: 'text-sm' } }"
        :fuse="{
          resultLimit: playlists?.length ?? 0,
          fuseOptions: {
            ignoreLocation: true,
            threshold: 0.2,
            keys: [{ name: 'label', weight: 2 }, 'description'],
          },
        }"
        :ui="{
          content: 'max-h-100',
          item: 'items-center gap-2 p-2 pr-2.5',
          itemTrailing: 'shrink-0 text-dimmed',
        }"
      >
        <template #close>
          <span class="flex size-4 shrink-0 items-center justify-center text-dimmed">
            <UIcon
              v-if="playlistsLoading || foldersLoading"
              name="lucide:loader-circle"
              class="size-4 animate-spin"
            />
          </span>
        </template>
        <template #item-leading="{ item }">
          <AMArtworkWrapper :resource="item.resource" context="small">
            <AMArtworkImage />
            <AMArtworkPlaceholder />
          </AMArtworkWrapper>
        </template>
        <template #item-trailing="{ item }">
          <span class="flex size-4 shrink-0 items-center justify-center">
            <UIcon
              v-if="isLoading && pendingPlaylistId === item.resource.id"
              name="lucide:loader-circle"
              class="size-4 animate-spin"
            />
          </span>
        </template>
        <template #empty>
          {{
            playlistsPending
              ? "Loading playlists..."
              : playlistsError
                ? "Could not load playlists."
                : groups[0]?.items?.length
                  ? "No playlists found."
                  : "No editable playlists."
          }}
        </template>
        <template v-if="(playlistsError && playlists?.length) || foldersError" #footer>
          <p class="px-2.5 py-2 text-xs text-muted">
            {{ playlistsError ? "Could not refresh playlists." : "Could not load folder names." }}
          </p>
        </template>
      </UCommandPalette>
    </template>
  </UModal>
</template>

<script lang="ts" setup>
import type { CommandPaletteGroup } from "@nuxt/ui";

const props = defineProps<{ song: AmSong }>();
const open = defineModel<boolean>("open", { default: false });
const search = ref("");
const pendingPlaylistId = ref<string>();

const {
  data: playlists,
  isPending: playlistsPending,
  isLoading: playlistsLoading,
  error: playlistsError,
} = useLibraryPlaylists();
const { isLoading: foldersLoading, error: foldersError } = useLibraryFolders();

const mutations = useMutations();
const { mutate, isLoading } = useMutation({
  mutation: (playlistId: string) =>
    mutations.addPlaylistTracks(playlistId, [{ id: props.song.id, type: props.song.type }]),
  onSuccess: () => {
    open.value = false;
  },
});

function add(playlist: AmLibraryPlaylist) {
  if (isLoading.value || !playlist.extras.canEdit) return;
  pendingPlaylistId.value = playlist.id;
  mutate(playlist.id);
}

const groups = computed<CommandPaletteGroup[]>(() => [
  {
    id: "playlists",
    items: (playlists.value ?? [])
      .filter((playlist) => playlist.extras.canEdit)
      .toSorted(byName)
      .map((playlist) => ({
        id: playlist.id,
        label: playlist.attributes.name,
        resource: playlist,
        onSelect: (event: Event) => {
          event.preventDefault();
          add(playlist);
        },
      })),
  },
]);
</script>
