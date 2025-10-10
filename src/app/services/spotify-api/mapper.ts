import { MappedSpotifyTrack, SpotifySearchResponse, SpotifyTrack } from './types';

export const mapSearchResponseToTrack = (track: SpotifyTrack): MappedSpotifyTrack => {
  return {
    id: track.id,
    name: track.name,
    artists: track.artists.map((artist) => artist.name),
    album: track.album.name,
    albumImage: track.album.images[0]?.url || '',
    previewUrl: track.preview_url,
  };
};
