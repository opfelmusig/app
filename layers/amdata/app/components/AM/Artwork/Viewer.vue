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
        loading="eager"
        decoding="async"
        fetchpriority="high"
        draggable="false"
        class="size-full object-cover select-none"
      />
      <div class="absolute top-3 right-3 flex gap-2">
        <UButton
          icon="lucide:download"
          title="Download artwork"
          color="neutral"
          variant="soft"
          :loading="downloading"
          :disabled="!imageSrc"
          class="size-9 justify-center rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70 active:bg-black/80"
          @click="download"
        />
        <UButton
          icon="lucide:x"
          color="neutral"
          variant="soft"
          class="size-9 justify-center rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70 active:bg-black/80"
          @click="close"
        />
      </div>
    </template>
  </UModal>
</template>

<script lang="ts" setup>
import { getArtworkUrl } from "@opfelmusig/lib/helpers";
import type { Artwork } from "@opfelmusig/lib/types";
import { invoke } from "@tauri-apps/api/core";

const props = defineProps<{
  artwork: Artwork;
  name: string;
}>();
const open = defineModel<boolean>("open", { default: false });
const downloading = ref(false);
const toast = useToast();

const imageSrc = computed(() => getArtworkUrl(props.artwork, { width: 2048 }));

async function download() {
  if (!imageSrc.value || downloading.value) return;

  downloading.value = true;
  try {
    await invoke("native_artwork_download", { url: imageSrc.value, name: props.name });
  } catch (cause) {
    logger.withTag("artwork").error("Could not download artwork", { cause });
    toast.add({
      title: "Could not download artwork",
      description: String(cause),
      color: "error",
    });
  } finally {
    downloading.value = false;
  }
}
</script>
