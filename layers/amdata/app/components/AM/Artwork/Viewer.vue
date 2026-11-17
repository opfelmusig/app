<template>
  <UModal
    v-model:open="open"
    :title="`Artwork for ${name}`"
    :ui="{
      overlay: 'z-110 bg-black/75',
      content:
        'z-110 aspect-square size-[min(90vw,90dvh)] max-h-none max-w-none divide-y-0 bg-black p-0 ring-0 sm:max-h-none',
    }"
  >
    <template #content="{ close }">
      <img
        :key="imageSrc"
        :src="imageSrc"
        :alt="artwork.alt ?? `Artwork for ${name}`"
        loading="eager"
        decoding="async"
        fetchpriority="high"
        draggable="false"
        class="size-full object-cover select-none"
      />
      <UButton
        icon="lucide:x"
        aria-label="Close artwork"
        color="neutral"
        variant="solid"
        class="absolute top-3 right-3 size-9 justify-center rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70 active:bg-black/80"
        @click="close"
      />
    </template>
  </UModal>
</template>

<script lang="ts" setup>
import { getArtworkUrl } from "@opfelmusig/lib/helpers";
import type { Artwork } from "@opfelmusig/lib/types";

const props = defineProps<{
  artwork: Artwork;
  name: string;
}>();
const open = defineModel<boolean>("open", { default: false });

const imageSrc = computed(() => getArtworkUrl(props.artwork, { width: 3000 }));
</script>
