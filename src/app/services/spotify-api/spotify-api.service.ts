import { Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { MappedSpotifyTrack, SpotifySearchResponse } from './types';
import { mapSearchResponseToTrack } from './mapper';

@Injectable({ providedIn: 'root' })
export class SpotifyService {
  private accessToken = signal<string | null>(null);
  private tokenExpiry = signal<number>(0);

  private async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken() && Date.now() < this.tokenExpiry()) {
      return this.accessToken()!;
    }

    const credentials = btoa(`${environment.spotify.clientId}:${environment.spotify.clientSecret}`);

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${credentials}`,
        },
        body: 'grant_type=client_credentials',
      });

      if (!response.ok) {
        throw new Error('Failed to get Spotify access token');
      }

      const data = await response.json();
      this.accessToken.set(data.access_token);
      this.tokenExpiry.set(Date.now() + data.expires_in * 1000);

      return data.access_token;
    } catch (error) {
      console.error('Error getting Spotify access token:', error);
      throw error;
    }
  }

  async searchTracks(query: string): Promise<MappedSpotifyTrack[]> {
    if (!query.trim()) {
      return [];
    }

    try {
      const token = await this.getAccessToken();

      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error('Failed to search tracks');
      }

      const data = (await response.json()) as SpotifySearchResponse;

      return data.tracks.items.map((track) => mapSearchResponseToTrack(track));
    } catch (error) {
      console.error('Error searching tracks:', error);
      throw error;
    }
  }

  async getTrack(trackId: string): Promise<MappedSpotifyTrack | null> {
    try {
      const token = await this.getAccessToken();

      const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get track details');
      }

      const track = await response.json();

      return {
        id: track.id,
        name: track.name,
        artists: track.artists.map((artist: any) => artist.name),
        album: track.album.name,
        albumImage: track.album.images[0]?.url || '',
        previewUrl: track.preview_url,
      };
    } catch (error) {
      console.error('Error getting track details:', error);
      return null;
    }
  }
}
