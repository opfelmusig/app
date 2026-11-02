import { getNextOffset } from "@opfelmusig/lib/helpers";

import { parseCatalogAlbum } from "#layers/amdata/app/lib/parsers/albums";
import { parseCatalogArtist } from "#layers/amdata/app/lib/parsers/artists";
import { parseCatalogPlaylist } from "#layers/amdata/app/lib/parsers/playlists";
import { parseCatalogSong } from "#layers/amdata/app/lib/parsers/songs";
import {
  catalogAlbumsScopes,
  catalogArtistsScopes,
  catalogPlaylistsScopes,
  catalogSongsScopes,
} from "#layers/amdata/app/lib/scopes/catalog";

export const searchFilters = ["all", "songs", "albums", "artists", "playlists"] as const;
export type SearchFilter = (typeof searchFilters)[number];

const searchResultKeys = {
  songs: "song",
  albums: "album",
  artists: "artist",
  playlists: "playlist",
} as const;

export async function fetchCatalogSearch(
  term: string,
  filter: SearchFilter,
  offset: number,
  signal: AbortSignal,
) {
  const client = useClient();

  const response = await client.catalog.search(term, {
    shape: {
      types: filter === "all" ? ["songs", "albums", "artists", "playlists"] : [filter],
    },
    limit: filter === "all" ? 6 : 50,
    offset,
    config: { signal },
    scopes: {
      ...catalogSongsScopes,
      ...catalogAlbumsScopes,
      ...catalogArtistsScopes,
      ...catalogPlaylistsScopes,
    },
  });

  return {
    nextOffset:
      filter === "all"
        ? null
        : getNextOffset(response.results[searchResultKeys[filter]]?.next, offset),
    songs: (response.results.song?.data ?? []).filter(hasResourceName).map(parseCatalogSong),
    albums: (response.results.album?.data ?? []).filter(hasResourceName).map(parseCatalogAlbum),
    artists: (response.results.artist?.data ?? []).filter(hasResourceName).map(parseCatalogArtist),
    playlists: (response.results.playlist?.data ?? [])
      .filter(hasResourceName)
      .map(parseCatalogPlaylist),
  };
}
