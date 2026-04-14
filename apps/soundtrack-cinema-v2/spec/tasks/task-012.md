# Task-012 — Playlist Feature Page

**Assigned Agent:** L  
**Wave:** 3 (depends on Task-002, Task-003, Task-004, Task-006, Task-007, Task-008)

---

## Goal

Build the playlist mode page: lets authenticated users browse their Spotify playlists,
select one, preview its tracks, and generate aggregated movie recommendations for
the entire playlist.

---

## Inputs

- Task-002 outputs: routing, design tokens
- Task-003 outputs: `SpotifyAuthService` (auth guard, redirect if not logged in)
- Task-004 outputs: `SpotifyService` (playlists, playlist tracks)
- Task-006 outputs: `RecommendationService.getRecommendationsForPlaylist()`
- Task-007 outputs: `PlaylistStateService`, `AuthStateService`
- Task-008 outputs: `MovieCardComponent`, `TrackCardComponent`, `LoadingSpinnerComponent`, `EmptyStateComponent`, `TmdbImagePipe`

---

## File Ownership

```
src/app/
  features/
    playlist/
      playlist.component.ts
      playlist.component.html
      playlist.component.css
```

---

## Implementation Details

### `playlist.component.ts`

```typescript
@Component({
  selector: 'app-playlist',
  standalone: true,
  imports: [MovieCardComponent, TrackCardComponent, LoadingSpinnerComponent,
            EmptyStateComponent, TmdbImagePipe, RouterLink],
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
    if (!this.isAuthenticated()) {
      this.router.navigate(['/']);
      return;
    }
    this.playlistState.loadPlaylists();
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
```

### `playlist.component.html`

```html
<div class="playlist-page">
  <!-- Header -->
  <header class="page-header">
    <a routerLink="/" class="btn-back" aria-label="Go back to home">← Home</a>
    <h1>Playlist Movie Finder</h1>
    <p class="subtitle">Select a playlist to discover movies that match its vibe</p>
  </header>

  <!-- Unauthenticated -->
  @if (!isAuthenticated()) {
    <app-empty-state
      icon="🎵"
      title="Connect Spotify to use playlists"
      message="Sign in with Spotify to access your playlists and get personalized recommendations."
      actionLabel="Connect Spotify"
      (action)="connectSpotify()" />
  } @else {

    <!-- Playlist grid -->
    <section class="playlists-section" aria-labelledby="playlists-title">
      <h2 id="playlists-title" class="section-title">Your Playlists</h2>

      @if (playlistsStatus() === 'loading') {
        <app-loading-spinner message="Loading your playlists..." />
      } @else if (playlistsStatus() === 'error') {
        <app-empty-state icon="⚠️" title="Could not load playlists" [message]="error() ?? ''" />
      } @else {
        <div class="playlists-grid" role="list" aria-label="Your Spotify playlists">
          @for (playlist of playlists(); track playlist.id) {
            <button
              class="playlist-card"
              role="listitem"
              [class.selected]="selectedId() === playlist.id"
              [attr.aria-pressed]="selectedId() === playlist.id"
              [attr.aria-label]="playlist.name + ', ' + playlist.tracks.total + ' songs'"
              (click)="selectPlaylist(playlist.id)">
              <img
                class="playlist-cover"
                [src]="playlist.images[0]?.url || '/assets/no-poster.svg'"
                [alt]="playlist.name + ' cover'"
                width="120"
                height="120" />
              <div class="playlist-info">
                <span class="playlist-name">{{ playlist.name }}</span>
                <span class="playlist-count">{{ playlist.tracks.total }} songs</span>
              </div>
            </button>
          }
        </div>
      }
    </section>

    <!-- Selected playlist + tracks -->
    @if (selectedPlaylist(); as playlist) {
      <section class="selected-section" aria-labelledby="selected-title">
        <div class="selected-header">
          <h2 id="selected-title">{{ playlist.name }}</h2>
          @if (playlist.description) {
            <p class="playlist-desc">{{ playlist.description }}</p>
          }
        </div>

        <!-- Track preview -->
        @if (tracksStatus() === 'loading') {
          <app-loading-spinner message="Loading tracks..." size="sm" />
        } @else if (tracksStatus() === 'success') {
          <div class="tracks-preview" aria-label="Playlist tracks preview">
            @for (track of tracks().slice(0, 5); track track.id) {
              <app-track-card [track]="track" />
            }
            @if (tracks().length > 5) {
              <p class="tracks-more">+ {{ tracks().length - 5 }} more tracks</p>
            }
          </div>

          <!-- Generate button -->
          <div class="generate-section">
            <button
              class="btn-generate"
              [disabled]="!canGenerateRecommendations() || recsStatus() === 'loading'"
              (click)="generateRecommendations()"
              aria-label="Find movies for {{ playlist.name }} playlist">
              @if (recsStatus() === 'loading') {
                Finding movies...
              } @else {
                Find Movies for This Playlist
              }
            </button>
          </div>
        }
      </section>
    }

    <!-- Recommendations results -->
    @if (recommendations(); as recs) {
      <section class="recs-section" aria-labelledby="recs-title" aria-live="polite">
        <h2 id="recs-title">
          Movie Recommendations
          <span class="recs-count">({{ recs.recommendations.length }})</span>
        </h2>

        @if (recsStatus() === 'loading') {
          <app-loading-spinner message="Analyzing your playlist..." size="lg" />
        } @else {
          <div class="movies-grid">
            @for (rec of recs.recommendations; track rec.movie.id) {
              <div class="movie-with-context">
                <app-movie-card
                  [recommendation]="rec"
                  (viewDetails)="onViewMovie($event)" />
                <p class="match-count" aria-label="{{ rec.matchCount }} tracks matched">
                  ♫ matched by {{ rec.matchCount }} track{{ rec.matchCount === 1 ? '' : 's' }}
                </p>
              </div>
            }
          </div>
        }
      </section>
    }
  }
</div>
```

### `playlist.component.css`

```css
.playlist-page {
  max-width: var(--max-content-width);
  margin: 0 auto;
  padding: 0 24px 48px;
}

.page-header {
  padding: 32px 0 24px;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 32px;
}

.page-header h1 {
  font-size: 2rem;
  font-weight: 700;
  margin: 8px 0;
}

.subtitle {
  color: var(--color-text-secondary);
}

.section-title {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 16px;
}

.playlists-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.playlist-card {
  background: var(--color-bg-card);
  border: 2px solid transparent;
  border-radius: var(--border-radius-md);
  padding: 12px;
  cursor: pointer;
  text-align: center;
  transition: border-color var(--transition-fast), transform var(--transition-fast);
}

.playlist-card:hover {
  border-color: var(--color-border);
  transform: translateY(-2px);
}

.playlist-card.selected {
  border-color: var(--color-accent);
}

.playlist-cover {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: var(--border-radius-sm);
  margin-bottom: 8px;
}

.playlist-name {
  display: block;
  font-weight: 600;
  font-size: 0.85rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.playlist-count {
  display: block;
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin-top: 4px;
}

.btn-generate {
  background: var(--color-accent);
  color: #000;
  border: none;
  padding: 14px 32px;
  border-radius: var(--border-radius-md);
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: background-color var(--transition-fast);
  margin-top: 16px;
}

.btn-generate:hover:not(:disabled) { background: var(--color-accent-hover); }
.btn-generate:disabled { opacity: 0.5; cursor: not-allowed; }

.movies-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 20px;
}

.match-count {
  text-align: center;
  font-size: 0.75rem;
  color: var(--color-spotify);
  margin-top: 6px;
}

.tracks-more {
  color: var(--color-text-secondary);
  font-size: 0.85rem;
  padding: 8px 0;
}
```

---

## Acceptance Criteria

- [ ] `ng build` completes with zero errors after this task
- [ ] Unauthenticated users see "Connect Spotify" prompt (not a redirect)
- [ ] Authenticated users see their Spotify playlists in a grid
- [ ] Clicking a playlist marks it as selected (visual highlight + `aria-pressed`)
- [ ] Selecting a playlist loads and shows a preview of up to 5 tracks
- [ ] "Find Movies" button is disabled until tracks are loaded
- [ ] Clicking "Find Movies" calls `PlaylistStateService.loadRecommendations()`
- [ ] Recommendations grid shows with `matchCount` indicator per movie
- [ ] Loading states shown with `LoadingSpinnerComponent` for each phase
- [ ] Error states shown with `EmptyStateComponent`
- [ ] `aria-live` region announces when recommendations load
- [ ] Clicking a movie navigates to `/movie/:id`
- [ ] Page is responsive at mobile widths
