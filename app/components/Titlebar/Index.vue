<template>
  <UContextMenu :items="menuItems" :disabled="isMacos" :ui="{ content: 'z-55' }">
    <div
      class="flex h-9.25 w-full shrink-0 justify-between border-b border-default text-muted select-none"
      data-tauri-drag-region
    >
      <div
        class="flex size-full justify-between gap-1.5 p-1.5"
        :class="isMacos ? 'ml-19' : ''"
        data-tauri-drag-region
      >
        <div class="flex items-center gap-1.5" data-tauri-drag-region>
          <template v-if="isDefaultLayout">
            <TitlebarAction
              :icon="isCollapsed ? 'lucide:panel-left-open' : 'lucide:panel-left-close'"
              small-icon
              @click="toggle"
            />
            <TitlebarAction icon="lucide:chevron-left" :disabled="!canGoBack" @click="goBack" />
            <TitlebarAction
              icon="lucide:chevron-right"
              :disabled="!canGoForward"
              @click="goForward"
            />
          </template>
          <TitlebarAction icon="lucide:rotate-ccw" small-icon @click="reload" />
          <TitlebarBadge v-if="isDev" label="DEV" color="error" variant="soft" />
        </div>
        <div
          v-if="isDefaultLayout"
          class="flex items-center gap-1.5"
          :class="isMacos ? '[&>button]:last:rounded-tr-[9px]' : ''"
          data-tauri-drag-region
        >
          <div class="mr-2 flex w-40 shrink-0 items-center gap-2">
            <UIcon name="lucide:volume" class="size-3.5 shrink-0" />
            <USlider
              v-model="volumeStore.volume"
              :min="0"
              :max="1"
              :step="0.01"
              class="py-3"
              size="sm"
              :ui="{
                range: 'bg-white transition-colors',
              }"
            />
            <UIcon name="lucide:volume-2" class="ml-1 size-3.5 shrink-0" />
          </div>
          <USeparator orientation="vertical" class="h-4 shrink-0" />
          <TitlebarAction
            v-if="isDefaultLayout"
            icon="lucide:command"
            :active="settingsStore.commandPaletteOpen"
            small-icon
            @click="settingsStore.commandPaletteOpen = !settingsStore.commandPaletteOpen"
          />
          <TitlebarAction
            v-if="isDefaultLayout"
            icon="lucide:settings"
            :active="settingsStore.isOpen"
            small-icon
            @click="settingsStore.isOpen = true"
          />
          <TitlebarAction
            :icon="
              settingsStore.panel.isOpen ? 'lucide:panel-right-close' : 'lucide:panel-right-open'
            "
            small-icon
            :active="settingsStore.panel.isOpen"
            @click="settingsStore.panel.isOpen = !settingsStore.panel.isOpen"
          />
          <USeparator
            v-if="!isMacos && !settingsStore.system.hideTitlebarControls"
            orientation="vertical"
            class="h-4 shrink-0"
          />
        </div>
      </div>
      <TitlebarControls v-if="!isMacos && !settingsStore.system.hideTitlebarControls" />
    </div>
  </UContextMenu>
</template>

<script lang="ts" setup>
import type { ContextMenuItem } from "@nuxt/ui";

const { isCollapsed, toggle } = useSidebar();
const { canGoBack, canGoForward, goBack, goForward, reload } = useNavigation();
const layout = useLayout();

const settingsStore = useSettingsStore();
const volumeStore = useVolumeStore();

const menuItems = computed<ContextMenuItem[]>(() => [
  {
    type: "checkbox",
    label: "Show title bar controls",
    checked: !settingsStore.system.hideTitlebarControls,
    onSelect: (event) => event.preventDefault(),
    onUpdateChecked(checked) {
      settingsStore.system.hideTitlebarControls = !checked;
    },
  },
]);

const isDefaultLayout = computed(() => layout.value === "default");
</script>
