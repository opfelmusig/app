<template>
  <UContextMenu :items="menuItems" :ui="{ content: 'z-105' }">
    <div class="relative flex size-full max-h-svh flex-col overflow-hidden">
      <template v-if="lyrics">
        <LyricsTimingNone v-if="lyrics.timing === 'none'" :lyrics />
        <LyricsTimingTimed v-else :lyrics :progress @seek="seek" />
      </template>
      <div v-else class="flex size-full items-center justify-center overflow-hidden">
        <div v-if="pending" :class="statusClass()">
          <UIcon name="lucide:loader-circle" class="size-4 animate-spin" />
          <span>Loading</span>
        </div>
        <div v-else-if="error" :class="statusClass({ color: 'error' })">
          <UIcon name="lucide:x" class="size-4" />
          <span>{{ error.message }}</span>
        </div>
        <div v-else-if="!lyrics" :class="statusClass()">No lyrics found</div>
      </div>
    </div>
  </UContextMenu>
</template>

<script lang="ts" setup>
import type { ContextMenuItem } from "@nuxt/ui";

defineProps<{
  lyrics?: AppleMusicLyricsDocument;
  pending: boolean;
  error: Error | null;
  progress: number;
}>();

const emit = defineEmits<{
  seek: [time: number | null];
}>();

const seek = (time: number | null) => emit("seek", time);

const settingsStore = useSettingsStore();
const menuItems = computed<ContextMenuItem[]>(() => [
  {
    type: "checkbox",
    label: "Show translation",
    checked: settingsStore.lyrics.showTranslation,
    onSelect: (event) => event.preventDefault(),
    onUpdateChecked(checked) {
      settingsStore.lyrics.showTranslation = checked;
    },
  },
  {
    type: "checkbox",
    label: "Show transliteration",
    checked: settingsStore.lyrics.showTransliteration,
    onSelect: (event) => event.preventDefault(),
    onUpdateChecked(checked) {
      settingsStore.lyrics.showTransliteration = checked;
    },
  },
]);

const statusClass = cva(
  "flex h-14 shrink-0 items-center justify-center gap-2 px-4 text-sm whitespace-nowrap",
  {
    variants: {
      color: {
        muted: "text-muted",
        error: "text-error",
      },
    },
    defaultVariants: {
      color: "muted",
    },
  },
);
</script>
