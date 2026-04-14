# Task-007 — State Services (Angular Signals)

**Assigned Agent:** G  
**Wave:** 2 (depends on Task-001)

---

## Goal

Implement injectable Angular signal-based state services for all application state domains:
authentication, search, recommendations, and playlist. These services are the single
source of truth consumed by all feature components.

---

## Inputs

- `spec/contracts/types.ts` — `AuthStatus`, `LoadingState`, `SpotifyTrack`, `SpotifyPlaylist`, `SpotifyUser`, `RecommendationResult`, `PlaylistRecommendationResult`, `MovieRecommendation`

---

## File Ownership

```
src/app/
  core/
    state/
      auth.state.ts                ← authentication state service
      search.state.ts              ← Spotify search state service
      recommendations.state.ts     ← track recommendation state service
      playlist.state.ts            ← playlist state service
      index.ts                     ← re-exports
```

---

## State Service Pattern

State services follow the **Zustand-style singleton pattern**: public signals and
computed values live directly on the class alongside action methods. Do NOT use
`private _field = signal()` paired with `readonly field = this._field.asReadonly()` —
keep state flat and public.

```typescript
@Injectable({ providedIn: 'root' })
export class ExampleStateService {

  // State — public writable signals
  items = signal<Item[]>([]);
  status = signal<LoadingState>('idle');

  // Derived state — computed from signals
  count = computed(() => this.items().length);
  isLoading = computed(() => this.status() === 'loading');

  // Actions — methods that update state
  loadItems() { /* ... */ }
  reset() { this.items.set([]); this.status.set('idle'); }
}
```

---

## Implementation Details

### `auth.state.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class AuthStateService {

  // State
  status = signal<AuthStatus>('unauthenticated');
  user = signal<SpotifyUser | null>(null);
  error = signal<string | null>(null);

  // Derived
  isAuthenticated = computed(() => this.status() === 'authenticated');

  // Actions — called by SpotifyAuthService
  setAuthenticating(): void {
    this.status.set('authenticating');
    this.error.set(null);
  }

  setAuthenticated(user: SpotifyUser): void {
    this.user.set(user);
    this.status.set('authenticated');
    this.error.set(null);
  }

  setUnauthenticated(): void {
    this.status.set('unauthenticated');
    this.user.set(null);
  }

  setError(message: string): void {
    this.error.set(message);
    this.status.set('error');
  }
}
```

### `search.state.ts`

Uses `switchMap` via `toObservable` so that fast typing automatically cancels in-flight
Spotify requests — whichever response arrives last never "wins" for an older query.

```typescript
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
```

Imports:
- `debounced` from `@signality/core`
- `toObservable` from `@angular/core/rxjs-interop`
- `switchMap`, `catchError`, `EMPTY` from `rxjs`

### `recommendations.state.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class RecommendationsStateService {
  private recService = inject(RecommendationService);

  // State
  trackId = signal<string | null>(null);
  status = signal<LoadingState>('idle');
  result = signal<RecommendationResult | null>(null);
  error = signal<string | null>(null);
  minRating = signal<number>(6.0);

  // Derived
  isLoading = computed(() => this.status() === 'loading');

  filteredRecommendations = computed<MovieRecommendation[]>(() => {
    const result = this.result();
    if (!result) return [];
    return result.recommendations
      .filter(r => r.movie.vote_average >= this.minRating())
      .sort((a, b) => b.score - a.score);
  });

  // Actions
  loadForTrack(track: SpotifyTrack): void {
    // Skip if same track already successfully loaded
    if (this.trackId() === track.id && this.status() === 'success') return;

    this.trackId.set(track.id);
    this.status.set('loading');
    this.result.set(null);
    this.error.set(null);

    this.recService.getRecommendationsForTrack(track).subscribe({
      next: (result) => {
        this.result.set(result);
        this.status.set('success');
      },
      error: () => {
        this.error.set('Failed to load recommendations. Please try again.');
        this.status.set('error');
      },
    });
  }

  setMinRating(rating: number): void {
    this.minRating.set(rating);
  }

  reset(): void {
    this.trackId.set(null);
    this.status.set('idle');
    this.result.set(null);
    this.error.set(null);
  }
}
```

### `playlist.state.ts`

```typescript
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
```

---

## Key Decisions

- **Zustand-style pattern** — Signals are public on the class. No `private _field / readonly field = asReadonly()` boilerplate at the service level. Components consume signals via `.asReadonly()` at the point of injection — this is where the readonly boundary lives, not in the service.
- **Cache by track ID** — `RecommendationsStateService.loadForTrack()` short-circuits if the same track is already successfully loaded.
- **`@signality/core` usage** — Use `debounced(signal, 300)` from `@signality/core` for the search query debounce. Import: `import { debounced } from '@signality/core'`.
- **No subscription management in components** — All subscriptions live inside state service action methods.

---

## Acceptance Criteria

- [ ] `ng build` completes with zero errors after this task
- [ ] All four state services are `providedIn: 'root'` singletons
- [ ] State signals are public (not private with `asReadonly()` wrappers)
- [ ] `SearchStateService` debounces search input by 300ms using `@signality/core`
- [ ] `SearchStateService` does not search for queries shorter than 2 characters
- [ ] `RecommendationsStateService.loadForTrack()` caches results per track ID
- [ ] `RecommendationsStateService.filteredRecommendations` correctly filters by `minRating`
- [ ] `PlaylistStateService.selectedPlaylist` is a computed derived from `selectedPlaylistId` + `playlists`
- [ ] `PlaylistStateService.loadTracksForSelected()` called automatically when `selectPlaylist()` is called
- [ ] No `any` types used
- [ ] `index.ts` re-exports all public symbols
