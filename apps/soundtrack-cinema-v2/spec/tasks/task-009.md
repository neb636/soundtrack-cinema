# Task-009 — Home / Search Feature Page

**Assigned Agent:** I  
**Wave:** 3 (depends on Task-002, Task-003, Task-004, Task-007, Task-008)

---

## Goal

Build the home page: the primary landing experience. Shows a hero section, song search
bar with live results, the user's top tracks (authenticated), and popular movies
(unauthenticated fallback).

---

## Inputs

- Task-002 outputs: `ShellComponent`, routing, design tokens
- Task-003 outputs: `SpotifyAuthService`
- Task-004 outputs: `SpotifyService` (top tracks)
- Task-007 outputs: `AuthStateService`, `SearchStateService`
- Task-008 outputs: `SearchBarComponent`, `TrackCardComponent`, `LoadingSpinnerComponent`, `EmptyStateComponent`, `MovieCardComponent`, `TmdbImagePipe`
- Task-005 outputs: `TmdbService` (popular movies), `TmdbImagePipe`

---

## File Ownership

```
src/app/
  features/
    home/
      home.component.ts
      home.component.html
      home.component.css
```

---

## Implementation Details

### `home.component.ts`

Standalone component, route: `/` (child of shell).

```typescript
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [SearchBarComponent, TrackCardComponent, MovieCardComponent,
            LoadingSpinnerComponent, EmptyStateComponent, TmdbImagePipe,
            RouterLink],
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

  private loadTopTracks(): void { ... }
  private loadPopularMovies(): void { ... }
}
```

### `home.component.html`

Three logical sections:

**1. Hero Section** (always visible):
```html
<section class="hero" aria-labelledby="hero-title">
  <h1 id="hero-title">Discover movies through music</h1>
  <p class="hero-subtitle">Search any song and find movies that match its vibe</p>

  <app-search-bar
    [value]="searchQuery()"
    [disabled]="!isAuthenticated()"
    placeholder="Search songs or artists..."
    (queryChange)="onSearch($event)"
    (cleared)="onSearchCleared()"
    (disabledClick)="connectSpotify()" />

  @if (!isAuthenticated()) {
    <div class="auth-prompt">
      <p>Connect your Spotify account to search for songs</p>
      <button class="btn-spotify" (click)="connectSpotify()">
        Connect Spotify
      </button>
    </div>
  }
</section>
```

**2. Search Results** (visible when search is active):
```html
@if (hasSearchResults() || searchStatus() === 'loading') {
  <section class="search-results" aria-label="Search results" aria-live="polite">
    @if (searchStatus() === 'loading') {
      <app-loading-spinner message="Searching Spotify..." />
    } @else {
      @for (track of searchResults(); track track.id) {
        <app-track-card [track]="track" (selected)="onTrackSelected($event)" />
      }
    }
  </section>
}
```

**3. Discovery Section** (visible when search is idle):
```html
@if (searchStatus() === 'idle') {
  @if (isAuthenticated()) {
    <!-- Top Tracks -->
    <section class="top-tracks" aria-labelledby="top-tracks-title">
      <h2 id="top-tracks-title">Your Top Tracks</h2>
      @if (topTracksLoading()) {
        <app-loading-spinner size="sm" />
      } @else {
        <div class="tracks-scroll">
          @for (track of topTracks(); track track.id) {
            <app-track-card [track]="track" (selected)="onTrackSelected($event)" />
          }
        </div>
      }
    </section>
  } @else {
    <!-- Popular Movies -->
    <section class="popular-movies" aria-labelledby="popular-title">
      <h2 id="popular-title">Popular Movies Right Now</h2>
      <div class="movies-grid">
        @for (movie of popularMovies(); track movie.id) {
          <app-movie-card
            [recommendation]="{ movie, score: movie.vote_average * 10, source: 'tmdb-search' }"
            [showSource]="false"
            (viewDetails)="onMovieSelected($event)" />
        }
      </div>
    </section>
  }
}
```

### CSS Layout

```css
.hero {
  text-align: center;
  padding: 64px 24px 48px;
  max-width: 640px;
  margin: 0 auto;
}

.hero h1 {
  font-size: clamp(1.8rem, 5vw, 3rem);
  font-weight: 700;
  margin-bottom: 16px;
}

.btn-spotify {
  background: var(--color-spotify);
  color: #fff;
  border: none;
  padding: 12px 32px;
  border-radius: var(--border-radius-md);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity var(--transition-fast);
}
.btn-spotify:hover { opacity: 0.85; }

.movies-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
  padding: 16px 24px;
}

.tracks-scroll {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 8px 24px;
  scrollbar-width: thin;
}
```

---

## Acceptance Criteria

- [ ] `ng build` completes with zero errors after this task
- [ ] Home page loads at `/` without errors
- [ ] Unauthenticated: search bar disabled, "Connect Spotify" button visible, popular movies shown
- [ ] "Connect Spotify" button calls `SpotifyAuthService.login()`
- [ ] Authenticated: search bar enabled, top tracks shown
- [ ] Typing in search bar updates `SearchStateService.query`
- [ ] Search results appear below search bar as user types
- [ ] Clicking a track result navigates to `/track/:id`
- [ ] Clicking a movie card navigates to `/movie/:id`
- [ ] Search results section has `aria-live="polite"` for screen reader announcements
- [ ] Loading states display `LoadingSpinnerComponent`
- [ ] Empty states display `EmptyStateComponent` with appropriate message
- [ ] Page is responsive (grid works at mobile widths)
