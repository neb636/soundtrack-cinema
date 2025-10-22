import { Injectable } from '@angular/core';
import { MaxInt, SpotifyApi } from '@spotify/web-api-ts-sdk';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SpotifyService {
  private sdk: SpotifyApi | null = null;

  private readonly clientId = environment.spotify.clientId;
  private readonly redirectUri = `${window.location.origin}/callback`;
  private readonly scopes = [
    'playlist-read-private',
    'playlist-read-collaborative',
    'user-read-private',
    'user-read-email',
    'user-top-read',
    'user-library-read',
  ];

  constructor() {
    // Initialize SDK on service creation to restore any existing session
    this.initializeSDK();
  }

  private initializeSDK(): void {
    if (!this.sdk) {
      this.sdk = SpotifyApi.withUserAuthorization(
        this.clientId,
        this.redirectUri,
        this.scopes
      );
    }
  }

  async authenticate(): Promise<SpotifyApi> {
    if (!this.sdk) {
      this.initializeSDK();
    }

    return this.sdk!;
  }

  getSDK(): SpotifyApi {
    if (!this.sdk) {
      throw new Error('SDK not initialized. Call authenticate() first.');
    }
    return this.sdk;
  }

  isAuthenticated(): boolean {
    if (!this.sdk) {
      return false;
    }
    
    try {
      const token = this.sdk.getAccessToken();
      return token !== null && token !== undefined;
    } catch {
      return false;
    }
  }

  logout(): void {
    this.sdk?.logOut();
    this.sdk = null;
  }

  // Convenience methods that wrap SDK calls

  async paginatedSearch(params: {
    query: string;
    types: Array<'album' | 'artist' | 'playlist' | 'track'>;
    offset: number;
    limit: MaxInt<50>;
  }) {
    const { query, types, offset, limit } = params;
    const sdk = this.getSDK();

    return await sdk.search(query, types, undefined, limit, offset);
  }

  getAlbum(id: string) {
    const sdk = this.getSDK();
    return sdk.albums.get(id);
  }


  getArtist(id: string) {
    const sdk = this.getSDK();
    return sdk.artists.get(id);
  }

  getPlaylist(id: string) {
    const sdk = this.getSDK();
    return sdk.playlists.getPlaylist(id,);
  }

  getTrack(id: string) {
    const sdk = this.getSDK();
    return sdk.tracks.get(id);
  }

  getPaginatedUserPlaylists(limit?: MaxInt<50>, offset?: number) {
    const sdk = this.getSDK();
    return sdk.currentUser.playlists.playlists(limit, offset);
  }

  getCurrentUserProfile() {
    const sdk = this.getSDK();
    return sdk.currentUser.profile();
  }

  getTopArtists(timeRange?: 'short_term' | 'medium_term' | 'long_term', limit?: MaxInt<50>) {
    const sdk = this.getSDK();
    return sdk.currentUser.topItems('artists', timeRange, limit);
  }


  getTopTracks(timeRange?: 'short_term' | 'medium_term' | 'long_term', limit?: MaxInt<50>) {
    const sdk = this.getSDK();
    return sdk.currentUser.topItems('tracks', timeRange, limit);
  }


  async getAllPages<T>(
    fetcher: (limit: MaxInt<50>, offset: number) => Promise<{ items: T[]; total: number; next: string | null }>
  ): Promise<T[]> {
    const allItems: T[] = [];
    let offset = 0;
    const limit: MaxInt<50> = 50;

    while (true) {
      const page = await fetcher(limit, offset);
      allItems.push(...page.items);

      if (!page.next || allItems.length >= page.total) {
        break;
      }

      offset += limit;
    }

    return allItems;
  }

  async getAllUserPlaylists() {
    return this.getAllPages((limit, offset) =>
      this.getPaginatedUserPlaylists(limit, offset)
    );
  }
}
