import { Injectable, computed, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { debounced } from '@signality/core';
import { EMPTY, catchError, switchMap } from 'rxjs';
import type { LoadingState, SpotifyTrack } from '../../../../spec/contracts/types';
import { SpotifyService } from '../../services/spotify/spotify.service';

@Injectable({ providedIn: 'root' })
export class SearchStateService {
  private spotifyService = inject(SpotifyService);

  // State
  query = signal('');
  status = signal<LoadingState>('idle');
  results = signal<SpotifyTrack[]>([]);
  error = signal<string | null>(null);

  // Derived
  hasResults = computed(() => this.results().length > 0);
  isLoading = computed(() => this.status() === 'loading');

  // Use @signality/core debounced to avoid searching on every keystroke
  private debouncedQuery = debounced(this.query, 300);

  constructor() {
    // Convert the debounced signal to an Observable and use switchMap so that
    // each new query automatically cancels any previous in-flight HTTP request.
    toObservable(this.debouncedQuery).pipe(
      switchMap(q => {
        if (q.trim().length < 2) {
          this.results.set([]);
          this.status.set('idle');
          this.error.set(null);
          return EMPTY;
        }
        this.status.set('loading');
        return this.spotifyService.searchTracks(q).pipe(
          catchError(() => {
            this.error.set('Search failed. Please try again.');
            this.status.set('error');
            return EMPTY;
          })
        );
      })
    ).subscribe(result => {
      this.results.set(result.tracks.items);
      this.status.set('success');
      this.error.set(null);
    });
  }

  // Actions
  setQuery(query: string): void {
    this.query.set(query);
  }

  clearSearch(): void {
    this.query.set('');
    this.results.set([]);
    this.status.set('idle');
    this.error.set(null);
  }
}
