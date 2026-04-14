import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import type {
  SpotifyUser,
  SpotifyTrack,
  SpotifyArtist,
  SpotifyAlbum,
  SpotifyPlaylist,
  SpotifySearchResult,
  SpotifyPaginatedPlaylists,
  SpotifyTopTracksResult,
  SpotifyTopArtistsResult,
} from '../../../../spec/contracts/types';

@Injectable({ providedIn: 'root' })
export class SpotifyService {
  private http = inject(HttpClient);
  private readonly BASE = 'https://api.spotify.com/v1';

  /** GET /me — current user profile */
  getMe(): Observable<SpotifyUser> {
    return this.http.get<SpotifyUser>(`${this.BASE}/me`);
  }

  /** GET /search?q=...&type=track — search tracks */
  searchTracks(query: string, limit = 20, offset = 0): Observable<SpotifySearchResult> {
    const params = new HttpParams()
      .set('q', query)
      .set('type', 'track')
      .set('limit', limit)
      .set('offset', offset);
    return this.http.get<SpotifySearchResult>(`${this.BASE}/search`, { params });
  }

  /** GET /tracks/{id} */
  getTrack(id: string): Observable<SpotifyTrack> {
    return this.http.get<SpotifyTrack>(`${this.BASE}/tracks/${id}`);
  }

  /** GET /artists/{id} — includes genres */
  getArtist(id: string): Observable<SpotifyArtist> {
    return this.http.get<SpotifyArtist>(`${this.BASE}/artists/${id}`);
  }

  /** GET /albums/{id} */
  getAlbum(id: string): Observable<SpotifyAlbum> {
    return this.http.get<SpotifyAlbum>(`${this.BASE}/albums/${id}`);
  }

  /** GET /me/playlists */
  getMyPlaylists(limit = 20, offset = 0): Observable<SpotifyPaginatedPlaylists> {
    const params = new HttpParams()
      .set('limit', limit)
      .set('offset', offset);
    return this.http.get<SpotifyPaginatedPlaylists>(`${this.BASE}/me/playlists`, { params });
  }

  /** GET /playlists/{id}?fields=id,name,images,tracks.items(track(id,name,artists,album,duration_ms,preview_url,external_urls)) */
  getPlaylist(id: string): Observable<SpotifyPlaylist> {
    const params = new HttpParams()
      .set('fields', 'id,name,images,tracks.items(track(id,name,artists,album,duration_ms,preview_url,external_urls))');
    return this.http.get<SpotifyPlaylist>(`${this.BASE}/playlists/${id}`, { params });
  }

  /** GET /me/top/tracks?time_range=medium_term */
  getTopTracks(
    timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term',
    limit = 20
  ): Observable<SpotifyTopTracksResult> {
    const params = new HttpParams()
      .set('time_range', timeRange)
      .set('limit', limit);
    return this.http.get<SpotifyTopTracksResult>(`${this.BASE}/me/top/tracks`, { params });
  }

  /** GET /me/top/artists */
  getTopArtists(
    timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term',
    limit = 20
  ): Observable<SpotifyTopArtistsResult> {
    const params = new HttpParams()
      .set('time_range', timeRange)
      .set('limit', limit);
    return this.http.get<SpotifyTopArtistsResult>(`${this.BASE}/me/top/artists`, { params });
  }
}
