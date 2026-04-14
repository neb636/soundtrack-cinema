import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LiveAnnouncer } from '@angular/cdk/a11y';

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

  readonly selectedPlaylist = this.playlistState.selectedPlaylist; // computed() — already readonly
  readonly canGenerateRecommendations = this.playlistState.canGenerateRecommendations; // computed() — already readonly

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
