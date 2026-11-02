import type { DropdownMenuItem } from "@nuxt/ui";
import { ROOT_FOLDER_ID } from "@opfelmusig/lib/helpers";

import MutationFolderDelete from "#layers/libdata/app/components/Mutation/Folder/Delete.vue";
import MutationFolderEdit from "#layers/libdata/app/components/Mutation/Folder/Edit.vue";
import MutationFolderMove from "#layers/libdata/app/components/Mutation/Folder/Move.vue";
import MutationLibraryRemove from "#layers/libdata/app/components/Mutation/Library/Remove.vue";
import MutationPlaylistAdd from "#layers/libdata/app/components/Mutation/Playlist/Add.vue";
import MutationPlaylistDelete from "#layers/libdata/app/components/Mutation/Playlist/Delete.vue";
import MutationPlaylistEdit from "#layers/libdata/app/components/Mutation/Playlist/Edit.vue";
import MutationPlaylistMove from "#layers/libdata/app/components/Mutation/Playlist/Move.vue";

interface ResourceMenuActions {
  play?: () => void;
  shuffle?: () => void;
  removeFromPlaylist?: () => void;
  removeFromQueue?: () => void;
  removeFromHistory?: () => void;
}

interface ResourceMenuSections {
  hidePlayback?: boolean;
}

interface ResourceMenuConfiguration {
  actions?: MaybeRefOrGetter<ResourceMenuActions>;
  extras?: MaybeRefOrGetter<DropdownMenuItem[]>;
  sections?: ResourceMenuSections;
}

export default function useResourceMenu(
  resource: MaybeRefOrGetter<AmResource | null | undefined>,
  config: ResourceMenuConfiguration = {},
) {
  const queueStore = useQueueStore();
  const { play, shuffle, playNext, playAfter, createStation, pendingResource } =
    useResourcePlayback();
  const { copyLink } = useResourceSharing();
  const mutationClient = useMutations();
  const { pinnedIds } = useLibraryPins();
  const auth = useAuth();
  const overlay = useOverlay();

  return computed<DropdownMenuItem[][]>(() => {
    const res = toValue(resource);
    const actions = toValue(config.actions);
    const groups: DropdownMenuItem[][] = [toValue(config.extras) ?? []];

    if (!res) return groups.filter((group) => group.length);
    if (res.type === "stations") {
      if (!config.sections?.hidePlayback) {
        groups.push([
          {
            label: "Play",
            disabled: queueStore.requestedStation?.id === res.id,
            onSelect: actions?.play ?? (() => queueStore.playStation(res)),
          },
        ]);
      }
      return groups.filter((group) => group.length);
    }

    const isSong = res.type === "songs" || res.type === "library-songs";
    const isAlbum = res.type === "albums" || res.type === "library-albums";
    const isArtist = res.type === "artists" || res.type === "library-artists";
    const isPlaylist = res.type === "playlists" || res.type === "library-playlists";
    const isMusic = isSong || isAlbum || isArtist || isPlaylist;
    const isCatalog =
      res.type === "songs" ||
      res.type === "albums" ||
      res.type === "artists" ||
      res.type === "playlists";
    const libraryId = isMusic ? (isCatalog ? res.extras.libraryId : res.id) : undefined;
    const catalogId = isMusic ? (isCatalog ? res.id : res.extras.catalogId) : undefined;
    const counterpartId = isCatalog ? libraryId : catalogId;
    const unavailable = isSong && !res.attributes.playParams;
    const pending = pendingResource.value === res.id;

    const mutations: DropdownMenuItem[] = [];
    if (libraryId) {
      const pinned = pinnedIds.value.has(libraryId);
      if (pinned || !unavailable) {
        mutations.push({
          label: pinned ? "Unpin" : "Pin",
          onSelect: () => mutationClient.setPinned(libraryId, !pinned),
        });
      }
    }

    if (isMusic && !unavailable) {
      const rating = res.attributes.personalRating;
      if (rating) {
        mutations.push({
          label: rating === 1 ? "Undo favorite" : "Undo suggest less",
          onSelect: () => mutationClient.deleteRating(res.id, res.type, counterpartId),
        });
      } else {
        mutations.push(
          {
            label: "Favorite",
            onSelect: () => mutationClient.setRating(res.id, res.type, 1, counterpartId),
          },
          {
            label: "Suggest less",
            onSelect: () => mutationClient.setRating(res.id, res.type, -1, counterpartId),
          },
        );
      }

      if ((res.type === "songs" || res.type === "albums") && !libraryId) {
        mutations.push({
          label: "Add to library",
          onSelect: () => mutationClient.addToLibrary(res.id, res.type),
        });
      }

      if (isSong) {
        mutations.push({
          label: "Add to playlist…",
          onSelect: () => {
            overlay.create(MutationPlaylistAdd, { destroyOnClose: true }).open({ song: res });
          },
        });
      }
    }
    groups.push(mutations);

    const playback: DropdownMenuItem[] = [];
    if (!unavailable && !config.sections?.hidePlayback) {
      const canAppendToQueue =
        queueStore.current && !queueStore.inContext && queueStore.queue.length;

      if (isSong) {
        if (actions?.play) playback.push({ label: "Play", onSelect: actions.play });
        playback.push({ label: "Play next", onSelect: () => queueStore.playNext([res]) });
        if (canAppendToQueue) {
          playback.push({ label: "Add to queue", onSelect: () => queueStore.playAfter([res]) });
        }
      }

      if ((isAlbum || isPlaylist) && !pending) {
        playback.push(
          { label: "Play", onSelect: actions?.play ?? (() => play(res)) },
          { label: "Shuffle", onSelect: actions?.shuffle ?? (() => shuffle(res)) },
          { label: "Play next", onSelect: () => playNext(res) },
        );
        if (canAppendToQueue) {
          playback.push({ label: "Add to queue", onSelect: () => playAfter(res) });
        }
      }

      if ((isSong || isAlbum || isArtist) && catalogId && !pending) {
        playback.push({ label: "Play station", onSelect: () => createStation(res) });
      }
    }
    groups.push(playback);

    const navigation: DropdownMenuItem[] = [];
    if (isMusic && !unavailable) {
      if (isSong) {
        const albumLink = songAlbumLink(res);
        if (albumLink) navigation.push({ label: "Go to album", to: albumLink });
      }

      if (isSong || isAlbum) {
        const artistLinks = resourceArtistLinks(res);
        if (artistLinks.length) {
          navigation.push({
            label: "Go to artist",
            to: artistLinks.length === 1 ? artistLinks[0]?.to : undefined,
            children: artistLinks.length > 1 ? artistLinks : undefined,
          });
        }
      }

      const counterpartLink = resourceRelationLink(res);
      if (counterpartLink) {
        navigation.push({
          label: isCatalog ? "Show in library" : "Show in Apple Music",
          to: counterpartLink,
        });
      }
    }
    groups.push(navigation);

    if (!unavailable && appleMusicLink(res, auth.storefront.value?.id)) {
      groups.push([{ label: "Copy link", onSelect: () => copyLink(res) }]);
    }

    if (res.type === "library-playlists") {
      if (res.extras.canEdit) {
        groups.push([
          {
            label: "Edit playlist",
            onSelect: () => {
              overlay
                .create(MutationPlaylistEdit, { destroyOnClose: true })
                .open({ playlist: res });
            },
          },
          {
            label: "Move playlist",
            onSelect: () => {
              overlay
                .create(MutationPlaylistMove, { destroyOnClose: true })
                .open({ playlist: res });
            },
          },
        ]);
      }
      groups.push([
        {
          label: "Delete playlist",
          color: "error",
          onSelect: () => {
            overlay
              .create(MutationPlaylistDelete, { destroyOnClose: true })
              .open({ playlist: res });
          },
        },
      ]);
    }

    if (res.type === "library-playlist-folders" && res.id !== ROOT_FOLDER_ID) {
      groups.push(
        [
          {
            label: "Edit folder",
            onSelect: () => {
              overlay.create(MutationFolderEdit, { destroyOnClose: true }).open({ folder: res });
            },
          },
          {
            label: "Move folder",
            onSelect: () => {
              overlay.create(MutationFolderMove, { destroyOnClose: true }).open({ folder: res });
            },
          },
        ],
        [
          {
            label: "Delete folder",
            color: "error",
            onSelect: () => {
              overlay.create(MutationFolderDelete, { destroyOnClose: true }).open({ folder: res });
            },
          },
        ],
      );
    }

    if ((isSong || isAlbum) && libraryId) {
      const type = isSong ? "songs" : "albums";
      groups.push([
        {
          label: "Remove from library",
          color: "error",
          onSelect: () => {
            overlay.create(MutationLibraryRemove, { destroyOnClose: true }).open({
              libraryId,
              type,
              catalogId,
              name: res.attributes.name,
            });
          },
        },
      ]);
    }

    if (isSong) {
      const removals: DropdownMenuItem[] = [];
      if (actions?.removeFromPlaylist) {
        removals.push({
          label: "Remove from playlist",
          color: "error",
          onSelect: actions.removeFromPlaylist,
        });
      }
      if (actions?.removeFromQueue) {
        removals.push({ label: "Remove from queue", onSelect: actions.removeFromQueue });
      }
      if (actions?.removeFromHistory) {
        removals.push({ label: "Remove from history", onSelect: actions.removeFromHistory });
      }
      groups.push(removals);
    }

    return groups.filter((group) => group.length);
  });
}
