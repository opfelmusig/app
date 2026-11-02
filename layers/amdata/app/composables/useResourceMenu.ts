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
}

interface ResourceMenuExtras {
  start?: MaybeRefOrGetter<DropdownMenuItem[]>;
  end?: MaybeRefOrGetter<DropdownMenuItem[]>;
}

interface ResourceMenuSections {
  hidePlayback?: boolean;
}

interface ResourceMenuConfiguration {
  actions?: ResourceMenuActions;
  extras?: ResourceMenuExtras;
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
    const start = toValue(config.extras?.start);
    const end = toValue(config.extras?.end);

    if (!res) return [start ?? [], end ?? []].filter((group) => group.length);
    if (res.type === "stations") {
      if (config.sections?.hidePlayback) return [];

      return [
        [
          {
            label: "Play",
            disabled: queueStore.requestedStation?.id === res.id,
            onSelect: config.actions?.play ?? (() => queueStore.playStation(res)),
          },
        ],
      ];
    }

    const groups: DropdownMenuItem[][] = [];
    const playback: DropdownMenuItem[] = [];
    const navigation: DropdownMenuItem[] = [];
    const mutations: DropdownMenuItem[] = [];
    const pending = pendingResource.value === res.id;

    if (start) groups.push(start);

    if (
      res.type === "library-songs" ||
      res.type === "library-albums" ||
      res.type === "library-artists" ||
      res.type === "library-playlists" ||
      res.type === "songs" ||
      res.type === "albums" ||
      res.type === "artists" ||
      res.type === "playlists"
    ) {
      if (
        res.type === "library-songs" ||
        res.type === "library-albums" ||
        res.type === "library-artists" ||
        res.type === "library-playlists"
      ) {
        const pinned = pinnedIds.value.has(res.id);

        mutations.push({
          label: pinned ? "Unpin" : "Pin",
          onSelect: () => mutationClient.setPinned(res.id, !pinned),
        });
      } else if (res.extras.libraryId) {
        const id = res.extras.libraryId;
        const pinned = pinnedIds.value.has(id);

        mutations.push({
          label: pinned ? "Unpin" : "Pin",
          onSelect: () => mutationClient.setPinned(id, !pinned),
        });
      }

      const rating = res.attributes.personalRating;
      const counterpartId =
        res.type === "songs" ||
        res.type === "albums" ||
        res.type === "artists" ||
        res.type === "playlists"
          ? res.extras.libraryId
          : res.extras.catalogId;

      if (rating) {
        mutations.push({
          label: res.attributes.personalRating === 1 ? "Undo favorite" : "Undo suggest less",
          onSelect: () => mutationClient.deleteRating(res.id, res.type, counterpartId),
        });
      } else {
        mutations.push({
          label: "Favorite",
          onSelect: () => mutationClient.setRating(res.id, res.type, 1, counterpartId),
        });
        mutations.push({
          label: "Suggest less",
          onSelect: () => mutationClient.setRating(res.id, res.type, -1, counterpartId),
        });
      }

      if ((res.type === "songs" || res.type === "albums") && !res.extras.libraryId) {
        mutations.push({
          label: "Add to library",
          onSelect: () => mutationClient.addToLibrary(res.id, res.type),
        });
      }
    }

    if (res.type === "songs" || res.type === "library-songs") {
      mutations.push({
        label: "Add to playlist…",
        onSelect: () => {
          overlay.create(MutationPlaylistAdd, { destroyOnClose: true }).open({ song: res });
        },
      });
    }

    groups.push(mutations);

    if (res.type === "songs" || res.type === "library-songs") {
      const song = res;
      const albumLink = songAlbumLink(song);

      if (!config.sections?.hidePlayback && song.attributes.playParams && config.actions?.play) {
        playback.push({
          label: "Play",
          onSelect: config.actions.play,
        });
      }

      if (!config.sections?.hidePlayback && song.attributes.playParams) {
        playback.push({
          label: "Play next",
          onSelect: () => queueStore.playNext([res]),
        });
      }

      if (
        !config.sections?.hidePlayback &&
        song.attributes.playParams &&
        queueStore.current &&
        !queueStore.inContext &&
        queueStore.queue.length
      ) {
        playback.push({
          label: "Add to queue",
          onSelect: () => queueStore.playAfter([res]),
        });
      }

      if (albumLink) {
        navigation.push({
          label: "Go to album",
          to: albumLink,
        });
      }
    }

    if (
      res.type === "albums" ||
      res.type === "library-albums" ||
      res.type === "playlists" ||
      res.type === "library-playlists"
    ) {
      const collection = res;
      if (!config.sections?.hidePlayback && !pending) {
        playback.push(
          { label: "Play", onSelect: config.actions?.play ?? (() => play(collection)) },
          { label: "Shuffle", onSelect: config.actions?.shuffle ?? (() => shuffle(collection)) },
          { label: "Play next", onSelect: () => playNext(collection) },
        );

        if (queueStore.current && !queueStore.inContext && queueStore.queue.length) {
          playback.push({ label: "Add to queue", onSelect: () => playAfter(collection) });
        }
      }
    }

    if (
      res.type === "songs" ||
      res.type === "library-songs" ||
      res.type === "albums" ||
      res.type === "library-albums" ||
      res.type === "artists" ||
      res.type === "library-artists"
    ) {
      const seed = res;
      const catalogId =
        seed.type === "songs" || seed.type === "albums" || seed.type === "artists"
          ? seed.id
          : seed.extras.catalogId;
      if (catalogId && !pending) {
        playback.push({ label: "Play station", onSelect: () => createStation(seed) });
      }
    }

    if (
      res.type === "songs" ||
      res.type === "library-songs" ||
      res.type === "albums" ||
      res.type === "library-albums"
    ) {
      const artistLinks = resourceArtistLinks(res);
      if (artistLinks.length) {
        navigation.push({
          label: "Go to artist",
          to: artistLinks.length === 1 ? artistLinks[0]?.to : undefined,
          children: artistLinks.length > 1 ? artistLinks : undefined,
        });
      }
    }

    if (res.type === "songs" || res.type === "library-songs") {
      const song = res;
      if (song.type === "songs" && song.extras.libraryId) {
        navigation.push({
          label: "Show in library",
          to: resourceRelationLink(song),
        });
      }

      if (song.type === "library-songs") {
        const catalogLink = resourceRelationLink(song);
        if (catalogLink) {
          navigation.push({
            label: "Show in Apple Music",
            to: catalogLink,
          });
        }
      }
    }

    if (
      res.type === "albums" ||
      res.type === "library-albums" ||
      res.type === "artists" ||
      res.type === "library-artists" ||
      res.type === "playlists" ||
      res.type === "library-playlists"
    ) {
      const counterpartLink = resourceRelationLink(res);
      if (counterpartLink) {
        navigation.push({
          label: res.type.startsWith("library-") ? "Show in Apple Music" : "Show in library",
          to: counterpartLink,
        });
      }
    }

    groups.push(playback, navigation);

    if (appleMusicLink(res, auth.storefront.value?.id)) {
      groups.push([
        {
          label: "Copy link",
          onSelect: () => copyLink(res),
        },
      ]);
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

    if (
      res.type === "songs" ||
      res.type === "albums" ||
      res.type === "library-songs" ||
      res.type === "library-albums"
    ) {
      const libraryId =
        res.type === "songs" || res.type === "albums" ? res.extras.libraryId : res.id;
      const catalogId =
        res.type === "songs" || res.type === "albums" ? res.id : res.extras.catalogId;
      const type = res.type === "songs" || res.type === "library-songs" ? "songs" : "albums";

      if (libraryId) {
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
    }

    if (end) groups.push(end);

    const disabled =
      (res.type === "songs" || res.type === "library-songs") && !res.attributes.playParams;

    return groups
      .map((group) =>
        disabled
          ? group.filter(
              (item) =>
                item.label === "Unpin" ||
                item.label === "Remove from playlist" ||
                item.label === "Remove from library",
            )
          : group,
      )
      .filter((group) => group.length);
  });
}
