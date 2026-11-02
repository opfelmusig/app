import { collect } from "@opfelmusig/lib/helpers";

import { parseCatalogArtist } from "#layers/amdata/app/lib/parsers/artists";
import { getUnknownProperty } from "#layers/amdata/app/lib/parsers/helpers";
import { parseCatalogPlaylist } from "#layers/amdata/app/lib/parsers/playlists";
import { parseCatalogSong } from "#layers/amdata/app/lib/parsers/songs";
import {
  catalogArtistsScopes,
  catalogPlaylistsScopes,
  catalogSongsScopes,
} from "#layers/amdata/app/lib/scopes/catalog";

export const playlistViews = ["featured-artists"] as const;
export type PlaylistView = (typeof playlistViews)[number];

const playlistViewScopes = {
  ...catalogPlaylistsScopes,
  ...catalogArtistsScopes,
};

export async function fetchCatalogPlaylist(id: string) {
  const client = useClient();

  const response = await client.catalog.playlists.get(id, {
    scopes: catalogPlaylistsScopes,
  });

  const playlist = response.data[0];
  if (!hasResourceName(playlist)) return null;

  return parseCatalogPlaylist(playlist);
}

export async function fetchCatalogPlaylistViews(id: string) {
  const client = useClient();

  const response = await client.catalog.playlists.get(id, {
    scopes: {
      ...playlistViewScopes,
      playlists: {
        ...catalogPlaylistsScopes.playlists,
        views: {
          "featured-artists": { limit: 12 },
        },
      },
    },
  });

  const playlist = response.data[0];
  if (!playlist) return [];

  return playlistViews.map((view) => {
    const collection = playlist.views?.[view];
    const title = getUnknownProperty(collection?.attributes, "title");

    return {
      view,
      title: typeof title === "string" ? title : view,
      items: (collection?.data ?? []).filter(hasResourceName).map(parseCatalogArtist),
      hasMore: !!collection?.next,
    };
  });
}

export async function fetchCatalogPlaylistView(id: string, view: PlaylistView) {
  const client = useClient();

  const response = await client.catalog.playlists.getView(id, view, {
    limit: 100,
    scopes: playlistViewScopes,
  });

  return response.data.filter(hasResourceName).map(parseCatalogArtist);
}

export async function fetchCatalogPlaylistTracks(id: string) {
  const client = useClient();

  const tracks = await collect(
    client.catalog.playlists.iterateRelationship(id, "tracks", {
      limit: 100,
      scopes: catalogSongsScopes,
    }),
  );

  const songs = tracks
    .filter((track) => track.type === "songs")
    .filter(hasResourceName)
    .map(parseCatalogSong);

  return songs;
}
