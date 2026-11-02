import { parseResource } from "#layers/amdata/app/lib/parsers";
import { parseCatalogArtist } from "#layers/amdata/app/lib/parsers/artists";
import { getUnknownProperty } from "#layers/amdata/app/lib/parsers/helpers";
import {
  catalogAlbumsScopes,
  catalogArtistsScopes,
  catalogPlaylistsScopes,
  catalogSongsScopes,
} from "#layers/amdata/app/lib/scopes/catalog";

export const artistViews = [
  "top-songs",
  "featured-albums",
  "full-albums",
  "singles",
  "live-albums",
  "compilation-albums",
  "appears-on-albums",
  "playlists",
  "similar-artists",
  "latest-release",
] as const;

export type ArtistView = (typeof artistViews)[number];

const artistViewScopes = {
  ...catalogSongsScopes,
  ...catalogAlbumsScopes,
  ...catalogPlaylistsScopes,
  ...catalogArtistsScopes,
};

export async function fetchCatalogArtist(id: string) {
  const client = useClient();

  const response = await client.catalog.artists.get(id, {
    scopes: catalogArtistsScopes,
  });

  const artist = response.data[0];
  if (!hasResourceName(artist)) return null;

  return parseCatalogArtist(artist);
}

export async function fetchCatalogArtistViews(id: string) {
  const client = useClient();

  const response = await client.catalog.artists.get(id, {
    scopes: {
      ...artistViewScopes,
      artists: {
        ...catalogArtistsScopes.artists,
        views: {
          "top-songs": { limit: 6 },
          "featured-albums": { limit: 12 },
          "full-albums": { limit: 12 },
          singles: { limit: 12 },
          "live-albums": { limit: 12 },
          "compilation-albums": { limit: 12 },
          "appears-on-albums": { limit: 12 },
          playlists: { limit: 12 },
          "similar-artists": { limit: 12 },
          "latest-release": { limit: 1 },
        },
      },
    },
  });

  const artist = response.data[0];
  if (!artist) return [];

  return artistViews.map((view) => {
    const collection = artist.views?.[view];
    const title = getUnknownProperty(collection?.attributes, "title");
    const items = (collection?.data ?? [])
      .filter(hasResourceName)
      .map((item) => parseResource(item));

    return {
      view,
      title: typeof title === "string" ? title : view,
      items,
      hasMore: !!collection?.next,
    };
  });
}

export async function fetchCatalogArtistView(
  id: string,
  view: ArtistView,
  offset: number,
  signal: AbortSignal,
) {
  const client = useClient();

  const response = await client.catalog.artists.getView(id, view, {
    limit: 100,
    offset,
    scopes: artistViewScopes,
    config: { signal },
  });

  const next = response.next
    ? new URL(response.next, "https://music.apple.com").searchParams.get("offset")
    : null;
  const nextOffset = next !== null ? Number(next) : null;

  return {
    items: response.data.filter(hasResourceName).map((item) => parseResource(item)),
    nextOffset:
      nextOffset !== null && Number.isFinite(nextOffset) && nextOffset > offset ? nextOffset : null,
  };
}
