<template>
  <div class="relative z-120">
    <UModal
      v-model:open="isOpen"
      :ui="{ content: 'top-[calc(50%-192px)] max-w-lg translate-y-0 overflow-hidden' }"
    >
      <template #content>
        <UCommandPalette
          v-model:search-term="search"
          placeholder="Go to..."
          :input="{ fixed: true, ui: { base: 'text-sm' } }"
          :groups="groups"
          :fuse="{ resultLimit: 6 }"
          preserve-group-order
          :class="query ? '' : 'divide-y-0'"
          :ui="{
            content: query ? 'max-h-100' : 'hidden',
            item: 'items-center gap-2 p-2 pr-2.5',
            label: 'px-2.5 text-xs font-normal text-muted',
            itemTrailing: 'shrink-0 text-xs text-dimmed',
          }"
          @update:model-value="isOpen = false"
        >
          <template #item-leading="{ item }">
            <AMArtworkWrapper v-if="item.resource" :resource="item.resource" context="small">
              <AMArtworkImage />
              <AMArtworkPlaceholder />
            </AMArtworkWrapper>
          </template>
          <template #item-trailing="{ item }">
            <UIcon v-if="item.kind" :name="resourceIcon(item.kind)" class="size-3.5" />
          </template>
          <template v-if="query" #footer>
            <p v-if="isPending || error" class="px-2.5 py-1 text-xs text-muted">
              {{ error ? "Could not load library results." : "Loading library..." }}
            </p>
            <div class="flex items-center justify-between gap-2 px-2.5 py-2 text-xs text-muted">
              <span>Search Apple Music</span>
              <span class="flex gap-1"><UKbd value="meta" /><UKbd value="enter" /></span>
            </div>
          </template>
        </UCommandPalette>
      </template>
    </UModal>
  </div>
</template>

<script lang="ts" setup>
import type { CommandPaletteGroup, CommandPaletteItem } from "@nuxt/ui";
import { useFuse } from "@vueuse/integrations/useFuse";

const settingsStore = useSettingsStore();
const { commandPaletteOpen: isOpen } = storeToRefs(settingsStore);
const search = ref("");
const query = computed(() => search.value.trim());
const linkTarget = computed(() => parseAppleMusicLink(query.value));

const playlists = useLibraryPlaylists();
const albums = useLibraryAlbums();
const artists = useLibraryArtists();
const songs = useLibrarySongs();

const isPending = computed(
  () =>
    songs.isPending.value ||
    playlists.isPending.value ||
    albums.isPending.value ||
    artists.isPending.value,
);
const error = computed(
  () => songs.error.value ?? playlists.error.value ?? albums.error.value ?? artists.error.value,
);

const pages: CommandPaletteItem[] = [
  { label: "Search", to: "/search" },
  { label: "Home", to: "/" },
  { label: "History", to: "/history" },
  { label: "Songs", to: "/resources/library-songs" },
  { label: "Albums", to: "/resources/library-albums" },
  { label: "Artists", to: "/resources/library-artists" },
  { label: "Playlists", to: "/resources/library-playlist-folders" },
  {
    label: "Settings",
    onSelect: () => {
      settingsStore.isOpen = true;
    },
  },
];

const libraryItems = computed<CommandPaletteItem[]>(() => {
  if (!isOpen.value) return [];

  return [
    ...(songs.data.value ?? []),
    ...(albums.data.value ?? []),
    ...(artists.data.value ?? []),
    ...(playlists.data.value ?? []),
  ].flatMap((resource) => {
    const to = resourceLink(resource);
    if (!to) return [];

    return [
      {
        label: resource.attributes.name,
        suffix: "artistName" in resource.attributes ? resource.attributes.artistName : undefined,
        kind: resource.type,
        resource,
        active: false,
        to,
      } satisfies CommandPaletteItem,
    ];
  });
});

const searchableItems = computed(() => [
  ...pages.map((item) => ({ ...item, active: false, group: "app" })),
  ...libraryItems.value.map((item) => ({ ...item, group: "library" })),
]);

const { results } = useFuse(query, searchableItems, {
  fuseOptions: {
    ignoreLocation: true,
    threshold: 0.2,
    keys: [{ name: "label", weight: 2 }, "suffix"],
  },
  resultLimit: 6,
  matchAllWhenSearchEmpty: false,
});

const groups = computed<CommandPaletteGroup[]>(() => {
  if (!query.value) return [];

  const groups: CommandPaletteGroup[] = [];
  const target = linkTarget.value;

  if (target)
    groups.push({
      id: "link",
      ignoreFilter: true,
      items: [
        {
          label: `Open ${target.type.slice(0, -1)}`,
          kind: target.type,
          active: false,
          to: rawResourceLink(target.type, target.id),
        },
      ],
    });

  groups.push({
    id: "app",
    label: "App",
    ignoreFilter: true,
    items: results.value.filter(({ item }) => item.group === "app").map(({ item }) => item),
  });

  groups.push({
    id: "library",
    label: "Library",
    ignoreFilter: true,
    items: results.value.filter(({ item }) => item.group === "library").map(({ item }) => item),
  });

  return groups;
});

useKeybind({
  keys: "ctrl-cmd+enter",
  run() {
    const term = query.value;
    isOpen.value = false;
    return navigateTo({ path: "/search", query: { term } });
  },
  config: {
    prevent: true,
    stop: true,
    ignoreIfEditable: false,
    ignoreRepeat: true,
    when: () => isOpen.value && !!query.value,
  },
});

watch(isOpen, (open) => {
  if (open) search.value = "";
});
</script>
