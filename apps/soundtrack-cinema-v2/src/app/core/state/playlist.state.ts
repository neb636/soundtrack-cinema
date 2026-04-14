import { Injectable, computed, inject, signal } from '@angular/core';
import type {
  LoadingState,
  PlaylistRecommendationResult,
  SpotifyPlaylist,
  SpotifyTrack,
} from '../../../../spec/contracts/types';
import { RecommendationService } from '../../services/recommendation/recommendation.service';
import { SpotifyService } from '../../services/spotify/spotify.service';

@Injectable({ providedIn: 'root' })
export class PlaylistStateService {
  private spotifyService = inject(SpotifyService);
  private recService = inject(RecommendationService);

  // State
  status = signal<LoadingState>('idle');
  playlists = signal<SpotifyPlaylist[]>([]);
  selectedPlaylistId = signal<string | null>(null);
  tracksStatus = signal<LoadingState>('idle');
  tracks = signal<SpotifyTrack[]>([]);
  recommendationsStatus = signal<LoadingState>('idle');
  recommendations = signal<PlaylistRecommendationResult | null>(null);
  error = signal<string | null>(null);

  // Derived
  selectedPlaylist = computed(() => {
    const id = this.selectedPlaylistId();
    if (!id) return null;
    return this.playlists().find(p => p.id === id) ?? null;
  });

  canGenerateRecommendations = computed(() =>
    this.tracksStatus() === 'success' && this.tracks().length > 0
  );

  // Actions
  async loadPlaylists(): Promise<void> {
    this.status.set('loading');
    try {
      const result = await this.spotifyService.getMyPlaylists();
      this.playlists.set(result.items);
      this.status.set('success');
    } catch {
      this.error.set('Could not load playlists.');
      this.status.set('error');
    }
  }

  selectPlaylist(id: string): void {
    this.selectedPlaylistId.set(id);
    this.tracks.set([]);
    this.recommendations.set(null);
    this.recommendationsStatus.set('idle');
    this.loadTracksForSelected(id);
  }

  async loadRecommendations(): Promise<void> {
    const playlist = this.selectedPlaylist();
    if (!playlist || !this.canGenerateRecommendations()) return;

    this.recommendationsStatus.set('loading');
    try {
      const result = await this.recService.getRecommendationsForPlaylist(playlist, this.tracks());
      this.recommendations.set(result);
      this.recommendationsStatus.set('success');
    } catch {
      this.error.set('Failed to generate recommendations.');
      this.recommendationsStatus.set('error');
    }
  }

  private async loadTracksForSelected(playlistId: string): Promise<void> {
    this.tracksStatus.set('loading');
    try {
      const playlist = await this.spotifyService.getPlaylist(playlistId);
      const tracks = (playlist.tracks.items ?? [])
        .map(item => item.track)
        .filter((t): t is SpotifyTrack => t !== null);
      this.tracks.set(tracks);
      this.tracksStatus.set('success');
    } catch {
      this.error.set('Could not load playlist tracks.');
      this.tracksStatus.set('error');
    }
  }
}
