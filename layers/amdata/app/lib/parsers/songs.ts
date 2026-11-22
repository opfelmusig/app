import type { ResourceTemplateOf } from "@opfelmusig/lib/types";

import { parseCatalogLinks } from "#layers/amdata/app/lib/parsers/helpers";

type SongAttributeKeys =
  | "name"
  | "albumName"
  | "artistName"
  | "artwork"
  | "durationInMillis"
  | "genreNames"
  | "releaseDate"
  | "discNumber"
  | "trackNumber"
  | "contentRating"
  | "playParams";

export type LibrarySongTemplate = ResourceTemplateOf<
  "library-songs",
  SongAttributeKeys,
  never,
  {
    albums: ResourceTemplateOf<"library-albums">;
    artists: ResourceTemplateOf<"library-artists">;
    catalog: ResourceTemplateOf<
      "songs",
      never,
      "personalRating",
      {
        albums: ResourceTemplateOf<"albums", "name", "editorialVideo">;
        artists: ResourceTemplateOf<"artists", "name">;
        "audio-analysis": ResourceTemplateOf<"audio-analysis", "loudness">;
      }
    >;
  }
>;

export function parseLibrarySong(resource: LibrarySongTemplate): AmLibrarySong {
  const catalog = resource.relationships?.catalog.data[0];
  const catalogAlbums = catalog?.relationships?.albums.data;
  const album = resource.relationships?.albums.data[0];
  const artist = resource.relationships?.artists.data[0];
  const attributes = resource.attributes;

  if (!attributes) throw new Error(`Invalid Apple Music song: ${resource.id}: missing attributes`);

  return {
    id: resource.id,
    type: "library-songs",

    attributes: {
      name: attributes.name,
      albumName: attributes.albumName,
      artistName: attributes.artistName,
      genreNames: attributes.genreNames,
      artwork: attributes.artwork,
      durationInMillis: attributes.durationInMillis,
      discNumber: attributes.discNumber,
      trackNumber: attributes.trackNumber,
      releaseDate: attributes.releaseDate,
      contentRating: attributes.contentRating,
      playParams: attributes.playParams,
      personalRating: catalog?.attributes?.personalRating,
      editorialVideo: catalogAlbums?.map((a) => a.attributes?.editorialVideo).find((e) => !!e),
      loudness: catalog?.relationships?.["audio-analysis"].data[0]?.attributes?.loudness?.main,

      albums: parseCatalogLinks(catalogAlbums),
      artists: parseCatalogLinks(catalog?.relationships?.artists.data),
    },

    extras: {
      catalogId: catalog?.id,
      albumId: album?.id,
      artistId: artist?.id,
    },
  };
}

export type CatalogSongTemplate = ResourceTemplateOf<
  "songs",
  SongAttributeKeys,
  "personalRating",
  {
    albums: ResourceTemplateOf<"albums", "name", "editorialVideo">;
    artists: ResourceTemplateOf<"artists", "name">;
    library: ResourceTemplateOf<"library-songs">;
    "audio-analysis": ResourceTemplateOf<"audio-analysis", "loudness">;
  }
>;

export function parseCatalogSong(resource: CatalogSongTemplate): AmCatalogSong {
  const attributes = resource.attributes;
  const albums = resource.relationships?.albums.data;

  const popularity = resource.meta?.popularity;

  if (!attributes) throw new Error(`Invalid Apple Music song: ${resource.id}: missing attributes`);

  return {
    id: resource.id,
    type: "songs",
    attributes: {
      name: attributes.name,
      albumName: attributes.albumName,
      artistName: attributes.artistName,
      genreNames: attributes.genreNames,
      artwork: attributes.artwork,
      durationInMillis: attributes.durationInMillis,
      discNumber: attributes.discNumber,
      trackNumber: attributes.trackNumber,
      releaseDate: attributes.releaseDate,
      contentRating: attributes.contentRating,
      playParams: attributes.playParams,
      personalRating: attributes.personalRating,
      editorialVideo: albums?.map((a) => a.attributes?.editorialVideo).find((e) => !!e),
      loudness: resource.relationships?.["audio-analysis"].data[0]?.attributes?.loudness?.main,
      popularity: typeof popularity === "number" ? popularity : undefined,

      albums: parseCatalogLinks(albums),
      artists: parseCatalogLinks(resource.relationships?.artists.data),
    },
    extras: {
      libraryId: resource.relationships?.library.data[0]?.id,
    },
  };
}

export type SongTemplate = LibrarySongTemplate | CatalogSongTemplate;
