import { Component, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LiveAnnouncer } from '@angular/cdk/a11y';

import { SpotifyAuthService } from '../../core/auth/spotify-auth.service';
import { AuthStateService } from '../../core/state/auth.state';
import { SearchStateService } from '../../core/state/search.state';
import { SpotifyService } from '../../services/spotify/spotify.service';
import { TmdbService } from '../../services/tmdb/tmdb.service';
import {
  SearchBarComponent,
  TrackCardComponent,
  MovieCardComponent,
  LoadingSpinnerComponent,
  EmptyStateComponent,
} from '../../shared/index';

import type { SpotifyTrack, TMDBMovie } from '../../../../spec/contracts/types';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    SearchBarComponent,
    TrackCardComponent,
    MovieCardComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  private authService = inject(SpotifyAuthService);
  private authState = inject(AuthStateService);
  private searchState = inject(SearchStateService);
  private spotifyService = inject(SpotifyService);
  private tmdbService = inject(TmdbService);
  private router = inject(Router);
  private liveAnnouncer = inject(LiveAnnouncer);

  readonly isAuthenticated = this.authState.isAuthenticated; // computed() — already readonly
  readonly user = this.authState.user.asReadonly();
  readonly searchQuery = this.searchState.query.asReadonly();
  readonly searchResults = this.searchState.results.asReadonly();
  readonly searchStatus = this.searchState.status.asReadonly();
  readonly hasSearchResults = this.searchState.hasResults; // computed() — already readonly

  readonly topTracks = signal<SpotifyTrack[]>([]);
  readonly popularMovies = signal<TMDBMovie[]>([]);
  readonly topTracksLoading = signal(false);
  readonly popularMoviesLoading = signal(false);

  constructor() {
    effect(() => {
      if (this.isAuthenticated()) {
        this.loadTopTracks();
      } else {
        this.loadPopularMovies();
      }
    });
  }

  onSearch(query: string): void {
    this.searchState.setQuery(query);
  }

  onSearchCleared(): void {
    this.searchState.clearSearch();
  }

  onTrackSelected(track: SpotifyTrack): void {
    this.router.navigate(['/track', track.id]);
  }

  onMovieSelected(movieId: number): void {
    this.router.navigate(['/movie', movieId]);
  }

  connectSpotify(): void {
    this.authService.login();
  }

  private async loadTopTracks(): Promise<void> {
    this.topTracksLoading.set(true);
    try {
      const result = await this.spotifyService.getTopTracks();
      this.topTracks.set(result.items);
      this.liveAnnouncer.announce('Your top tracks loaded');
    } catch {
      this.topTracks.set([]);
    } finally {
      this.topTracksLoading.set(false);
    }
  }

  private async loadPopularMovies(): Promise<void> {
    this.popularMoviesLoading.set(true);
    try {
      const result = await this.tmdbService.getPopularMovies();
      this.popularMovies.set(result.results);
      this.liveAnnouncer.announce('Popular movies loaded');
    } catch {
      this.popularMovies.set([]);
    } finally {
      this.popularMoviesLoading.set(false);
    }
  }
}
