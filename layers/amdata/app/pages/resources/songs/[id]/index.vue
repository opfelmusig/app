<template>
  <PageWrapper>
    <OMContextMenu :items="menuItems">
      <header class="flex flex-col gap-4 p-4 lg:flex-row">
        <AMArtworkWrapper :resource="song" context="header">
          <AMMediaEditorialVideo
            :editorial-video="song?.attributes.editorialVideo"
            variant="square"
          >
            <template #fallback>
              <AMArtworkImage />
              <AMArtworkPlaceholder />
            </template>
          </AMMediaEditorialVideo>
        </AMArtworkWrapper>
        <div class="flex w-full min-w-0 flex-col justify-end gap-4">
          <div v-if="song" class="flex min-w-0 flex-col gap-1">
            <div class="flex items-center gap-2">
              <h2 class="truncate">{{ song.attributes.name }}</h2>
              <OMExplicit v-if="song.attributes.contentRating === 'explicit'" />
              <OMDownloaded v-if="song.extras.libraryId" />
            </div>
            <div class="flex items-center gap-2 text-sm whitespace-nowrap text-muted">
              <AMLinks
                :links="song.attributes.albums"
                type="albums"
                :fallback-name="song.attributes.albumName"
              />
              <div class="size-1 shrink-0 rounded-full bg-accented first:hidden" />
              <AMLinks
                :links="song.attributes.artists"
                type="artists"
                :fallback-name="song.attributes.artistName"
              />
              <template v-if="song.attributes.releaseDate">
                <div class="size-1 shrink-0 rounded-full bg-accented first:hidden" />
                <span>
                  Released
                  <AMReleaseDate :release-date="song.attributes.releaseDate" date-style="long" />
                </span>
              </template>
              <template v-if="song.attributes.genreNames.length">
                <div class="size-1 shrink-0 rounded-full bg-accented first:hidden" />
                <span>{{ song.attributes.genreNames.join(", ") }}</span>
              </template>
            </div>
          </div>
          <div v-else-if="isPending" class="flex items-center gap-2 text-sm text-muted">
            <UIcon name="lucide:loader-circle" class="size-4 animate-spin" />
            Loading song
          </div>
          <div v-else-if="error" class="flex items-center gap-2 text-sm text-error">
            <UIcon name="lucide:x" class="size-4 shrink-0" />
            <span>{{ error.message }}</span>
          </div>
          <p v-else class="text-sm text-muted">Song not found.</p>
          <div class="flex flex-wrap items-center gap-2">
            <OMButtonPlay :disabled="!song" @click="play()" />
            <AMFavoriteButton v-if="song" :resource="song" />
            <OMMenuButton v-if="menuItems.length" :items="menuItems" class="ml-auto" />
          </div>
        </div>
      </header>
    </OMContextMenu>
    <USeparator />
    <div class="flex w-full flex-col gap-4 p-4">
      <h2>Lyrics</h2>
      <template v-if="lyrics">
        <div
          v-for="(section, i) in lyrics.sections"
          :key="section.startMs ?? i"
          class="flex w-full flex-col gap-1"
        >
          <div v-for="(line, j) in section.lines" :key="line.key ?? j" class="inline-block">
            <span v-for="(node, k) in line.nodes" :key="node.startMs ?? k">{{ node.text }}</span>
          </div>
        </div>
        <LyricsFooter :songwriters="lyrics.metadata.songwriters" />
      </template>
      <div v-else-if="lyricsPending" class="flex items-center gap-2 text-sm text-muted">
        <UIcon name="lucide:loader-circle" class="size-4 animate-spin" />
        Loading lyrics
      </div>
      <div v-else-if="lyricsError" class="flex items-center gap-2 text-sm text-error">
        <UIcon name="lucide:x" class="size-4 shrink-0" />
        <span>{{ lyricsError.message }}</span>
      </div>
      <p v-else class="text-sm text-muted">No lyrics found.</p>
    </div>
  </PageWrapper>
</template>

<script lang="ts" setup>
import { fetchCatalogSong, fetchCatalogSongLyrics } from "#layers/amdata/app/lib/queries/songs";

const id = useRouteParams<string>("id");

const {
  data: song,
  isPending,
  error,
} = useAmQuery({
  key: () => ["songs", "resource", id.value],
  query: () => fetchCatalogSong(id.value),
  staleTime: ms("1h"),
  gcTime: ms("3h"),
});

const {
  data: lyrics,
  isPending: lyricsPending,
  error: lyricsError,
} = useAmQuery({
  key: () => ["songs", "lyrics", id.value],
  query: () => fetchCatalogSongLyrics(id.value),
  staleTime: Infinity,
  gcTime: ms("3h"),
});

const queueStore = useQueueStore();

function play() {
  if (!song.value) return;

  queueStore.play(song.value);
}

const menuItems = useResourceMenu(() => song.value, {
  actions: { play: () => play() },
});
</script>
