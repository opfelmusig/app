<template>
  <PageWrapper>
    <OMContextMenu :items="menuItems">
      <header class="flex flex-col items-start gap-4 p-4 lg:flex-row">
        <UChip
          position="bottom-right"
          :ui="{ base: 'size-6 ring-3' }"
          inset
          color="neutral"
          :show="profile?.attributes.isPrivate ?? false"
        >
          <template #content>
            <UIcon name="lucide:lock-keyhole" class="size-3.5 [&>g]:stroke-3" mode="svg" />
          </template>
          <UChip
            position="top-right"
            :ui="{ base: 'size-6 ring-3' }"
            inset
            color="success"
            :show="profile?.attributes.isVerified ?? false"
          >
            <template #content>
              <UIcon name="lucide:check" class="size-3.5 [&>path]:stroke-3" mode="svg" />
            </template>
            <AMArtworkWrapper :resource="profile" context="header" round>
              <AMArtworkImage />
              <AMArtworkPlaceholder />
            </AMArtworkWrapper>
          </UChip>
        </UChip>
        <div class="flex w-full min-w-0 flex-col justify-end gap-1 lg:self-stretch">
          <template v-if="profile">
            <h1 class="wrap-break-word">{{ profile.attributes.name }}</h1>
            <h4 class="truncate text-muted">@{{ profile.attributes.handle }}</h4>
          </template>
          <div v-else-if="isPending" class="flex items-center gap-2 text-sm text-muted">
            <UIcon name="lucide:loader-circle" class="size-4 animate-spin" />
            Loading profile
          </div>
          <template v-else>
            <div v-if="error" class="flex items-center gap-2 text-sm text-error">
              <UIcon name="lucide:x" class="size-4 shrink-0" />
              <span>{{ error.message }}</span>
            </div>
            <p v-else class="text-muted">Profile not found.</p>
            <h4 class="truncate text-muted">@{{ handle }}</h4>
          </template>
        </div>
      </header>
    </OMContextMenu>
    <template v-if="profile">
      <USeparator />
      <div class="px-4 pt-4">
        <h2>Shared playlists</h2>
      </div>
      <AMGridWrapper>
        <AMGridStatus
          :is-pending="sharedPlaylistsPending"
          :error="sharedPlaylistsError"
          :total="sharedPlaylists.length"
          :resources="sharedPlaylists"
        >
          <AMGrid :items="sharedPlaylists" />
        </AMGridStatus>
      </AMGridWrapper>
      <AMFooter>
        <AMFooterCount :count="sharedPlaylists.length" singular="playlist" />
      </AMFooter>
    </template>
  </PageWrapper>
</template>

<script lang="ts" setup>
import {
  fetchSocialProfile,
  fetchSocialProfileSharedPlaylists,
} from "#layers/amdata/app/lib/queries/profiles";

const handle = useRouteParams<string>("id");

const {
  data: profile,
  isPending,
  error,
} = useAmQuery({
  key: () => ["social-profiles", "resource", handle.value],
  query: () => fetchSocialProfile(handle.value),
  staleTime: ms("1h"),
  gcTime: ms("3h"),
});

const {
  data: playlists,
  isPending: sharedPlaylistsPending,
  error: sharedPlaylistsError,
} = useAmQuery({
  key: () => ["social-profiles", "shared-playlists", profile.value?.id ?? null],
  query: async () => {
    if (!profile.value) return [];
    return fetchSocialProfileSharedPlaylists(profile.value.id);
  },
  enabled: () => !!profile.value,
  staleTime: ms("30m"),
  gcTime: ms("3h"),
});

const menuItems = useResourceMenu(() => profile.value);
const sharedPlaylists = computed(() => playlists.value ?? []);

useHead({
  title: () => profile.value?.attributes.name ?? `@${handle.value}`,
});
</script>
