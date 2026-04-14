import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { debounced } from '@signality/core';
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
    // Track the latest request so stale responses from superseded queries are ignored.
    let latestRequestId = 0;

    effect(() => {
      const q = this.debouncedQuery();
      const requestId = ++latestRequestId;

      if (q.trim().length < 2) {
        this.results.set([]);
        this.status.set('idle');
        this.error.set(null);
        return;
      }

      this.status.set('loading');

      this.spotifyService.searchTracks(q).then(result => {
        if (requestId !== latestRequestId) return;
        this.results.set(result.tracks.items);
        this.status.set('success');
        this.error.set(null);
      }).catch(() => {
        if (requestId !== latestRequestId) return;
        this.error.set('Search failed. Please try again.');
        this.status.set('error');
      });
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
