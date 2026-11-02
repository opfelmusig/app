<template>
  <div
    class="relative flex h-14.25 w-full shrink-0 items-center gap-2 overflow-hidden border-t border-default bg-muted/20 p-2 whitespace-nowrap select-none"
  >
    <OMContextMenu :items="menuItems">
      <div
        class="flex w-full min-w-0 items-center gap-2"
        :style="{ maxWidth: `${width && !isCollapsed ? width - 16 : 244}px` }"
      >
        <AMArtworkWrapper
          v-slot="{ iconClass }"
          :resource
          context="player"
          class="transition-[scale,opacity]"
          :class="playbackStore.paused ? 'scale-90 opacity-80' : ''"
        >
          <AMArtworkImage />
          <AMArtworkPlaceholder />
          <OMMenuButton :items="menuItems">
            <AMArtworkOverlay>
              <OMIcon name="lucide:ellipsis" :class="iconClass" />
            </AMArtworkOverlay>
          </OMMenuButton>
        </AMArtworkWrapper>
        <template v-if="resource">
          <OMScrollingTextGroup class="flex w-full min-w-0 flex-1 flex-col overflow-hidden">
            <OMScrollingText class="text-sm">
              <div class="flex items-center gap-2">
                <span>{{ resource.attributes.name }}</span>
                <OMStar v-if="resource.attributes.personalRating === 1" />
              </div>
            </OMScrollingText>
            <OMScrollingText
              v-if="
                resource.attributes.artists.length ||
                resource.attributes.artistName ||
                resource.attributes.albums.length ||
                resource.attributes.albumName
              "
              class="text-xs text-muted"
            >
              <span class="flex w-max items-center gap-1.5 whitespace-nowrap">
                <AMLinks
                  v-if="resource.attributes.artists.length"
                  :links="resource.attributes.artists"
                  type="artists"
                />
                <span v-else-if="resource.attributes.artistName">
                  {{ resource.attributes.artistName }}
                </span>
                <span
                  v-if="
                    (resource.attributes.artists.length || resource.attributes.artistName) &&
                    (resource.attributes.albums.length || resource.attributes.albumName)
                  "
                  class="size-1 min-w-1 shrink-0 rounded-full bg-white/20"
                />
                <AMLinks
                  v-if="resource.attributes.albums.length"
                  :links="resource.attributes.albums"
                  type="albums"
                />
                <span v-else-if="resource.attributes.albumName">
                  {{ resource.attributes.albumName }}
                </span>
              </span>
            </OMScrollingText>
          </OMScrollingTextGroup>
        </template>
      </div>
    </OMContextMenu>
    <div class="mr-4 flex min-w-100 flex-1 shrink-0 items-center gap-4 overflow-hidden">
      <div class="flex shrink-0 items-center gap-1">
        <div class="mr-1 h-8 w-px shrink-0 grow-0 rounded-full bg-border" />
        <div
          class="flex size-10 shrink-0 items-center justify-center rounded-xl transition-transform hover:bg-muted active:scale-95"
          :class="queueStore.isStation ? 'pointer-events-none opacity-50' : ''"
          @click="queueStore.toggleShuffle"
        >
          <UIcon
            mode="svg"
            name="lucide:shuffle"
            class="size-4"
            :class="!queueStore.isStation && queueStore.isShuffling ? 'text-primary' : 'text-muted'"
          />
        </div>
        <PlayerControls
          :paused="playbackStore.paused"
          :loading="playbackStore.loading"
          @previous="playbackStore.previous"
          @toggle="playbackStore.toggle"
          @next="playbackStore.next"
        />
        <div
          class="flex size-10 shrink-0 items-center justify-center rounded-xl transition-transform hover:bg-muted active:scale-95"
          :class="queueStore.isStation ? 'pointer-events-none opacity-50' : ''"
          @click="queueStore.isLooping = !queueStore.isLooping"
        >
          <UIcon
            mode="svg"
            name="lucide:repeat"
            class="size-4"
            :class="!queueStore.isStation && queueStore.isLooping ? 'text-primary' : 'text-muted'"
          />
        </div>
      </div>
      <PlayerProgress
        :key="queueStore.current?.id"
        :position="playbackStore.position"
        :duration="playbackStore.duration"
        :disabled="!resource"
        @seek="playbackStore.seek"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { DropdownMenuItem } from "@nuxt/ui";
import { withQuery } from "ufo";

const queueStore = useQueueStore();
const playbackStore = usePlaybackStore();
const settingsStore = useSettingsStore();
const resource = computed(() => queueStore.current?.entry);
const playbackSourceLink = computed(() => {
  const context = queueStore.context;
  const current = queueStore.current;
  if (!current?.fromContext || !context || context.type === "stations") return;

  const songId = current.entry.id;
  if (context.type === "generic") {
    return context.link ? withQuery(context.link, { song_id: songId }) : undefined;
  }

  return rawResourceLink(context.type, context.id, songId);
});

const { width, isCollapsed } = useSidebar();

const { isOpen, open, close } = useMiniplayer();

const menuItems = useResourceMenu(() => queueStore.current?.entry, {
  extras: () => {
    const items: DropdownMenuItem[] = [
      {
        label: "Open immersive player",
        onSelect: () => {
          settingsStore.immersive.isOpen = true;
        },
      },
      isOpen.value
        ? {
            label: "Close miniplayer",
            onSelect: close,
          }
        : {
            label: "Open miniplayer",
            onSelect: open,
          },
    ];

    if (playbackSourceLink.value) {
      items.push({
        label: "Go to source",
        to: playbackSourceLink.value,
      });
    }

    return items;
  },
  sections: {
    hidePlayback: true,
  },
});
</script>
