<template>
  <UContextMenu :items="menuItems" :ui="{ content: 'z-55' }">
    <div
      class="relative flex size-full shrink-0 flex-col overflow-hidden border-r border-default bg-raised px-2 pb-2 whitespace-normal select-none peer-hover:border-accented peer-active:border-accented"
    >
      <div
        ref="scroll-area"
        :style="style"
        class="scrollbar-hide flex h-full flex-col gap-1 overflow-hidden overflow-y-auto py-2"
      >
        <SidebarItemIcon icon="lucide:search" to="/search">Search</SidebarItemIcon>
        <SidebarItemIcon icon="lucide:house" to="/">Home</SidebarItemIcon>
        <SidebarItemIcon icon="lucide:list-video" to="/history">History</SidebarItemIcon>
        <SidebarSection
          v-if="settingsStore.sidebarSections.pins.show"
          v-model="settingsStore.sidebarSections.pins.collapsed"
          label="Pins"
          collapsible
        >
          <SidebarPins />
        </SidebarSection>
        <SidebarSection
          v-model="settingsStore.sidebarSections.library.collapsed"
          label="Library"
          collapsible
        >
          <SidebarItemIcon :icon="resourceIcon('songs')" to="/resources/library-songs">
            Songs
          </SidebarItemIcon>
          <SidebarItemIcon :icon="resourceIcon('albums')" to="/resources/library-albums">
            Albums
          </SidebarItemIcon>
          <SidebarItemIcon :icon="resourceIcon('artists')" to="/resources/library-artists">
            Artists
          </SidebarItemIcon>
          <SidebarItemIcon icon="lucide:guitar" to="/library/genres">Genres</SidebarItemIcon>
          <SidebarItemIcon
            v-if="isCollapsed || !settingsStore.sidebarSections.playlists.show"
            to="/resources/library-playlist-folders"
            icon="lucide:list-music"
          >
            Playlists
          </SidebarItemIcon>
        </SidebarSection>
        <SidebarSection
          v-if="!isCollapsed && settingsStore.sidebarSections.playlists.show"
          v-model="settingsStore.sidebarSections.playlists.collapsed"
          label="Playlists"
          collapsible
        >
          <SidebarPlaylists />
        </SidebarSection>
      </div>
      <div class="flex flex-col gap-2">
        <SidebarBorder />
        <div class="flex flex-col">
          <SidebarUser />
        </div>
      </div>
    </div>
  </UContextMenu>
</template>

<script lang="ts" setup>
import type { ContextMenuItem } from "@nuxt/ui";

const settingsStore = useSettingsStore();
const { isCollapsed, toggle } = useSidebar();

const menuItems = computed<ContextMenuItem[][]>(() => [
  [
    {
      type: "checkbox",
      label: "Expand sidebar",
      checked: !isCollapsed.value,
      onSelect: (event) => event.preventDefault(),
      onUpdateChecked: toggle,
    },
  ],
  [
    {
      type: "checkbox",
      label: "Show pins",
      checked: settingsStore.sidebarSections.pins.show,
      onSelect: (event) => event.preventDefault(),
      onUpdateChecked(checked) {
        settingsStore.sidebarSections.pins.show = checked;
      },
    },
    {
      type: "checkbox",
      label: "Show playlists",
      checked: settingsStore.sidebarSections.playlists.show,
      onSelect: (event) => event.preventDefault(),
      onUpdateChecked(checked) {
        settingsStore.sidebarSections.playlists.show = checked;
      },
    },
  ],
]);

const scrollArea = useTemplateRef("scroll-area");
const { style } = useCustomScrollShadow(scrollArea, {
  orientation: "vertical",
  offset: 4,
});
</script>
