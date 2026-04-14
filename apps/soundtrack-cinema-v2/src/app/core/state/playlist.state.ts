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
  loadPlaylists(): void {
    this.status.set('loading');
    this.spotifyService.getMyPlaylists().subscribe({
      next: (result) => {
        this.playlists.set(result.items);
        this.status.set('success');
      },
      error: () => {
        this.error.set('Could not load playlists.');
        this.status.set('error');
      },
    });
  }

  selectPlaylist(id: string): void {
    this.selectedPlaylistId.set(id);
    this.tracks.set([]);
    this.recommendations.set(null);
    this.recommendationsStatus.set('idle');
    this.loadTracksForSelected(id);
  }

  loadRecommendations(): void {
    const playlist = this.selectedPlaylist();
    if (!playlist || !this.canGenerateRecommendations()) return;

    this.recommendationsStatus.set('loading');
    this.recService
      .getRecommendationsForPlaylist(playlist, this.tracks())
      .subscribe({
        next: (result) => {
          this.recommendations.set(result);
          this.recommendationsStatus.set('success');
        },
        error: () => {
          this.error.set('Failed to generate recommendations.');
          this.recommendationsStatus.set('error');
        },
      });
  }

  private loadTracksForSelected(playlistId: string): void {
    this.tracksStatus.set('loading');
    this.spotifyService.getPlaylist(playlistId).subscribe({
      next: (playlist) => {
        const tracks = (playlist.tracks.items ?? [])
          .map(item => item.track)
          .filter((t): t is SpotifyTrack => t !== null);
        this.tracks.set(tracks);
        this.tracksStatus.set('success');
      },
      error: () => {
        this.error.set('Could not load playlist tracks.');
        this.tracksStatus.set('error');
      },
    });
  }
}
