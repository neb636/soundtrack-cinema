import { Component, OnInit, Signal, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LiveAnnouncer } from '@angular/cdk/a11y';

import { SpotifyPlaylist } from '../../../../spec/contracts/types';
import { AuthStateService } from '../../core/state/auth.state';
import { PlaylistStateService } from '../../core/state/playlist.state';
import { SpotifyAuthService } from '../../core/auth/spotify-auth.service';
import {
  MovieCardComponent,
  TrackCardComponent,
  LoadingSpinnerComponent,
  EmptyStateComponent,
} from '../../shared/index';

@Component({
  selector: 'app-playlist',
  standalone: true,
  imports: [
    MovieCardComponent,
    TrackCardComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    RouterLink,
  ],
  templateUrl: './playlist.component.html',
  styleUrl: './playlist.component.css',
})
export class PlaylistComponent implements OnInit {
  private authState = inject(AuthStateService);
  private authService = inject(SpotifyAuthService);
  private playlistState = inject(PlaylistStateService);
  private router = inject(Router);
  private liveAnnouncer = inject(LiveAnnouncer);

  readonly isAuthenticated = this.authState.isAuthenticated; // computed() — already readonly

  // From playlist state — use .asReadonly() on plain signals; computed() is already readonly
  readonly playlistsStatus = this.playlistState.status.asReadonly();
  readonly playlists = this.playlistState.playlists.asReadonly();
  readonly selectedId = this.playlistState.selectedPlaylistId.asReadonly();
  readonly tracksStatus = this.playlistState.tracksStatus.asReadonly();
  readonly tracks = this.playlistState.tracks.asReadonly();
  readonly recsStatus = this.playlistState.recommendationsStatus.asReadonly();
  readonly recommendations = this.playlistState.recommendations.asReadonly();
  readonly error = this.playlistState.error.asReadonly();

  readonly selectedPlaylist: Signal<SpotifyPlaylist | null> = computed(() => {
    const id = this.selectedId();
    if (!id) return null;
    return this.playlists().find(p => p.id === id) ?? null;
  });

  readonly canGenerateRecommendations: Signal<boolean> = computed(() =>
    this.tracksStatus() === 'success' && this.tracks().length > 0
  );

  ngOnInit(): void {
    if (this.isAuthenticated()) {
      this.playlistState.loadPlaylists();
    }
  }

  selectPlaylist(playlistId: string): void {
    this.playlistState.selectPlaylist(playlistId);
  }

  generateRecommendations(): void {
    this.playlistState.loadRecommendations();
    this.liveAnnouncer.announce('Generating movie recommendations for your playlist...');
  }

  onViewMovie(movieId: number): void {
    this.router.navigate(['/movie', movieId]);
  }

  connectSpotify(): void {
    this.authService.login();
  }
}
