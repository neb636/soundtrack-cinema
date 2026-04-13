import { Track } from '@spotify/web-api-ts-sdk';

export type MappedSpotifyTrack = {
  id: string;
  name: string;
  artists: string[];
  album: string;
  albumImage: string;
  previewUrl: string | null;
};


export const mapSpotifyTrackFromSDK = (track: Track): MappedSpotifyTrack => {
  return {
    id: track.id,
    name: track.name,
    artists: track.artists.map((artist) => artist.name),
    album: track.album.name,
    albumImage: track.album.images[0]?.url || '',
    previewUrl: track.preview_url,
  };
};
