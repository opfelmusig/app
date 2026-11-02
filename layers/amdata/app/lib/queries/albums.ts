import { collect } from "@opfelmusig/lib/helpers";

import { parseResource } from "#layers/amdata/app/lib/parsers";
import { parseCatalogAlbum } from "#layers/amdata/app/lib/parsers/albums";
import { getUnknownProperty } from "#layers/amdata/app/lib/parsers/helpers";
import { parseCatalogSong } from "#layers/amdata/app/lib/parsers/songs";
import {
  catalogAlbumsScopes,
  catalogPlaylistsScopes,
  catalogSongsScopes,
} from "#layers/amdata/app/lib/scopes/catalog";

export const albumViews = [
  "more-by-artist",
  "other-versions",
  "you-might-also-like",
  "appears-on",
  "audio-extras",
] as const;

export type AlbumView = (typeof albumViews)[number];

const albumViewScopes = {
  ...catalogAlbumsScopes,
  ...catalogPlaylistsScopes,
  stations: {
    fields: ["name", "artwork"],
  },
} as const;

export async function fetchCatalogAlbum(id: string) {
  const client = useClient();

  const response = await client.catalog.albums.get(id, {
    scopes: catalogAlbumsScopes,
  });

  const album = response.data[0];
  if (!hasResourceName(album)) return null;

  return parseCatalogAlbum(album);
}

export async function fetchCatalogAlbumViews(id: string) {
  const client = useClient();

  const response = await client.catalog.albums.get(id, {
    scopes: {
      ...albumViewScopes,
      albums: {
        ...catalogAlbumsScopes.albums,
        views: {
          "more-by-artist": { limit: 12 },
          "other-versions": { limit: 12 },
          "you-might-also-like": { limit: 12 },
          "appears-on": { limit: 12 },
          "audio-extras": { limit: 12 },
        },
      },
    },
  });

  const album = response.data[0];
  if (!album) return [];

  return albumViews.map((view) => {
    const collection = album.views?.[view];
    const title = getUnknownProperty(collection?.attributes, "title");

    return {
      view,
      title: typeof title === "string" ? title : view,
      items: (collection?.data ?? []).filter(hasResourceName).map((item) => parseResource(item)),
      hasMore: !!collection?.next,
    };
  });
}

export async function fetchCatalogAlbumView(id: string, view: AlbumView) {
  const client = useClient();

  const response = await client.catalog.albums.getView(id, view, {
    limit: 100,
    scopes: albumViewScopes,
  });

  return response.data.filter(hasResourceName).map((item) => parseResource(item));
}

export async function fetchCatalogAlbumTracks(id: string) {
  const client = useClient();

  const tracks = await collect(
    client.catalog.albums.iterateRelationship(id, "tracks", {
      limit: 100,
      scopes: catalogSongsScopes,
      config: {
        extraParams: {
          "meta[albums:tracks]": "popularity",
        },
      },
    }),
  );

  const songs = tracks
    .filter((track) => track.type === "songs")
    .filter(hasResourceName)
    .map(parseCatalogSong);

  return songs;
}
