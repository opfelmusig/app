<template>
  <PageWrapper>
    <OMContextMenu :items="resourceMenuItems">
      <header class="flex flex-col gap-4 p-4">
        <div class="flex h-9 min-w-0 items-center gap-2">
          <UTooltip :content="{ side: 'bottom' }" arrow text="Go to parent folder">
            <NuxtLink :to="rawResourceLink('library-playlist-folders', folder?.extras.parentId)">
              <OMButtonTertiary
                icon="lucide:arrow-up-left"
                :disabled="folderPending || !!folderError || !folder"
              />
            </NuxtLink>
          </UTooltip>
          <div v-if="folderPending" class="flex items-center gap-2 text-sm text-muted">
            <UIcon name="lucide:loader-circle" class="size-4 animate-spin" />
            Loading folder
          </div>
          <div v-else-if="folderError" class="flex min-w-0 items-center gap-2 text-sm text-error">
            <UIcon name="lucide:x" class="size-4 shrink-0" />
            <span class="truncate">{{ folderError.message }}</span>
          </div>
          <h2 v-else class="truncate">
            {{
              folder?.attributes.name ?? (id === ROOT_FOLDER_ID ? "Playlists" : "Folder not found")
            }}
          </h2>
          <OMMenuButton
            v-if="(folder || id === ROOT_FOLDER_ID) && !folderPending && !folderError"
            :items="folderMenuItems"
            class="ml-auto"
          />
        </div>
      </header>
    </OMContextMenu>
    <USeparator />
    <AMGridWrapper>
      <AMGridStatus :is-pending="isPending" :error="error" :resources="children">
        <AMGrid :items="children" />
      </AMGridStatus>
    </AMGridWrapper>
    <AMFooter>
      <AMFooterCount :count="children?.length" singular="item" />
    </AMFooter>
    <MutationPlaylistCreate v-model:open="createPlaylistOpen" :parent="folder" />
    <MutationFolderCreate v-model:open="createFolderOpen" :parent="folder" />
  </PageWrapper>
</template>

<script lang="ts" setup>
import { ROOT_FOLDER_ID } from "@opfelmusig/lib/helpers";

import { fetchLibraryFolder } from "#layers/libdata/app/lib/queries/folders";

const id = useRouteParams<string>("id", ROOT_FOLDER_ID);

const {
  data: folder,
  isPending: folderPending,
  error: folderError,
} = useLibraryQuery({
  key: () => ["playlist-folders", "resource", id.value],
  query: () => fetchLibraryFolder(id.value),
  staleTime: ms("3h"),
});
const { data: children, isPending, error } = useLibraryFolderChildren(id);

const createPlaylistOpen = ref(false);
const createFolderOpen = ref(false);

const resourceMenuItems = useResourceMenu(() => folder.value);
const folderMenuItems = useResourceMenu(() => folder.value, {
  extras: [
    {
      label: "Create playlist",
      onSelect: () => {
        createPlaylistOpen.value = true;
      },
    },
    {
      label: "Create folder",
      onSelect: () => {
        createFolderOpen.value = true;
      },
    },
  ],
});

watch(id, () => {
  createPlaylistOpen.value = false;
  createFolderOpen.value = false;
});
</script>
