<template>
  <div :class="cn(variants({ context, transparent }), props.class, round && 'rounded-full')">
    <slot :icon-class :image-size :artwork />
    <button
      v-if="canViewArtwork"
      type="button"
      aria-label="View artwork"
      class="absolute inset-0 z-20 cursor-zoom-in rounded-[inherit] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
      @click.stop="viewArtwork"
    />
  </div>
</template>

<script lang="ts" setup>
import type { Artwork } from "@opfelmusig/lib/types";

import AMArtworkViewer from "#layers/amdata/app/components/AM/Artwork/Viewer.vue";
import { artworkContextKey } from "#layers/amdata/app/lib/contexts/artwork";

const variants = cva(
  "group relative isolate flex aspect-square shrink-0 items-center justify-center overflow-hidden text-muted select-none",
  {
    variants: {
      context: {
        header: "size-40 rounded-3xl",
        profile: "size-24",
        grid: "w-full rounded-3xl",
        list: "size-9 rounded-lg",
        player: "size-10 rounded-lg",
        small: "size-5 rounded-md",
        "folder-preview": "w-full rounded-xl",
        account: "size-12",
      },
      transparent: {
        false: "bg-muted",
      },
    },
    defaultVariants: {
      transparent: false,
    },
  },
);

type Resources = AmSong | AmAlbum | AmArtist | AmPlaylist | AmSocialProfile | AmCatalogStation;

type ArtworkVariants = VariantProps<typeof variants>;

const props = defineProps<{
  context: NonNullable<ArtworkVariants["context"]>;
  transparent?: boolean;
  round?: boolean;
  class?: string;
  resource?: Resources | null;
  artwork?: Artwork;
  viewable?: boolean;
}>();

const resource = computed(() => props.resource);
const overlay = useOverlay();

const isRoundedResource = computed(
  () =>
    resource.value?.type === "library-artists" ||
    resource.value?.type === "artists" ||
    resource.value?.type === "social-profiles",
);
const round = computed(() => isRoundedResource.value || props.round);

const artwork = computed(() => props.artwork ?? resource.value?.attributes.artwork);
const canViewArtwork = computed(
  () => (props.context === "header" || props.viewable) && !!artwork.value?.url,
);
const icon = computed(() => resourceIcon(resource.value?.type));

function viewArtwork() {
  const currentArtwork = artwork.value;
  if (!canViewArtwork.value || !currentArtwork) return;

  overlay.create(AMArtworkViewer, { destroyOnClose: true }).open({
    artwork: currentArtwork,
    name: resource.value?.attributes.name ?? "Artwork",
  });
}

const imageSize = computed(
  () =>
    ({
      header: 320,
      profile: 192,
      grid: 520,
      list: 72,
      small: 56,
      player: 80,
      "folder-preview": 224,
      account: 96,
    })[props.context],
);

const iconClass = computed(() =>
  cn(
    {
      header: "size-20",
      profile: "size-12",
      grid: "size-20",
      list: "size-4",
      small: "size-3",
      player: "size-4",
      "folder-preview": "size-6",
      account: "size-6",
    }[props.context],
  ),
);

provide(artworkContextKey, { artwork, imageSize, iconClass, icon });
</script>
