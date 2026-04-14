# Task-011 — Movie Detail Page

**Assigned Agent:** K  
**Wave:** 3 (depends on Task-002, Task-005, Task-008)

---

## Goal

Build the movie detail page: displays full movie information from TMDB with an
IMDB link, genre badges, runtime, and a "back to results" link with context
of which track brought the user here.

---

## Inputs

- Task-002 outputs: routing (route param `:id`), design tokens
- Task-005 outputs: `TmdbService.getMovie()`, `TmdbImagePipe`
- Task-008 outputs: `LoadingSpinnerComponent`, `EmptyStateComponent`, `RatingBadgeComponent`

---

## File Ownership

```
src/app/
  features/
    movie-detail/
      movie-detail.component.ts
      movie-detail.component.html
      movie-detail.component.css
```

---

## Implementation Details

### `movie-detail.component.ts`

```typescript
@Component({
  selector: 'app-movie-detail',
  standalone: true,
  imports: [LoadingSpinnerComponent, EmptyStateComponent, RatingBadgeComponent,
            TmdbImagePipe, RouterLink],
  templateUrl: './movie-detail.component.html',
  styleUrl: './movie-detail.component.css',
})
export class MovieDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private tmdbService = inject(TmdbService);

  readonly movie = signal<TMDBMovie | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  /** Track ID from query param (set when navigating from track detail) */
  fromTrackId: string | null = null;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.fromTrackId = this.route.snapshot.queryParamMap.get('from');
    if (!id || isNaN(+id)) {
      this.router.navigate(['/']);
      return;
    }
    this.tmdbService.getMovie(+id).subscribe({
      next: (movie) => {
        this.movie.set(movie);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Movie not found.');
        this.loading.set(false);
      },
    });
  }

  /** Construct the IMDB URL from imdb_id */
  getImdbUrl(imdbId: string): string {
    return `https://www.imdb.com/title/${imdbId}/`;
  }

  /** Get release year from release_date string */
  getReleaseYear(releaseDate: string | undefined): string {
    return releaseDate?.substring(0, 4) ?? '';
  }

  /** Format runtime in minutes to "Xh Ym" format */
  formatRuntime(minutes: number | null | undefined): string {
    if (!minutes) return '';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  goBack(): void {
    if (this.fromTrackId) {
      this.router.navigate(['/track', this.fromTrackId]);
    } else {
      this.router.navigate(['/']);
    }
  }
}
```

### `movie-detail.component.html`

```html
<div class="movie-detail-page">
  <!-- Navigation -->
  <nav class="breadcrumb" aria-label="Breadcrumb">
    <button class="btn-back" (click)="goBack()">
      ← Back to {{ fromTrackId ? 'recommendations' : 'home' }}
    </button>
  </nav>

  <!-- Loading -->
  @if (loading()) {
    <div class="loading-wrapper" aria-live="polite" aria-busy="true">
      <app-loading-spinner size="lg" message="Loading movie details..." />
    </div>
  }

  <!-- Error -->
  @else if (error()) {
    <app-empty-state
      icon="🎬"
      [title]="error()!"
      actionLabel="Go Home"
      (action)="router.navigate(['/'])" />
  }

  <!-- Movie content -->
  @else if (movie(); as m) {
    <article class="movie-content" aria-label="Movie details">

      <!-- Poster + Info layout -->
      <div class="movie-layout">
        <!-- Poster column -->
        <aside class="poster-column">
          <img
            class="movie-poster"
            [src]="m.poster_path | tmdbImage:'w500'"
            [alt]="m.title + ' movie poster'"
            width="300"
            height="450" />
        </aside>

        <!-- Info column -->
        <div class="info-column">
          <header>
            <h1 class="movie-title">
              {{ m.title }}
              <span class="movie-year" aria-label="Release year">
                ({{ getReleaseYear(m.release_date) }})
              </span>
            </h1>

            @if (m.tagline) {
              <p class="tagline">{{ m.tagline }}</p>
            }
          </header>

          <!-- Metadata row -->
          <div class="meta-row" aria-label="Movie metadata">
            <app-rating-badge [rating]="m.vote_average" />
            <span class="meta-votes" aria-label="{{ m.vote_count }} votes">
              {{ m.vote_count | number }} votes
            </span>
            @if (m.runtime) {
              <span class="meta-runtime" aria-label="Runtime">
                {{ formatRuntime(m.runtime) }}
              </span>
            }
          </div>

          <!-- Genres -->
          @if (m.genres && m.genres.length > 0) {
            <div class="genres" role="list" aria-label="Genres">
              @for (genre of m.genres; track genre.id) {
                <span class="genre-badge" role="listitem">{{ genre.name }}</span>
              }
            </div>
          }

          <!-- Overview -->
          @if (m.overview) {
            <section aria-label="Movie overview">
              <h2 class="section-title">Overview</h2>
              <p class="overview">{{ m.overview }}</p>
            </section>
          }

          <!-- Action buttons -->
          <div class="actions">
            @if (m.imdb_id) {
              <a
                [href]="getImdbUrl(m.imdb_id)"
                target="_blank"
                rel="noopener noreferrer"
                class="btn-imdb"
                aria-label="View {{ m.title }} on IMDB (opens in new tab)">
                View on IMDB ↗
              </a>
            }
          </div>
        </div>
      </div>

      <!-- Backdrop image (decorative) -->
      @if (m.backdrop_path) {
        <div
          class="backdrop"
          [style.background-image]="'url(' + (m.backdrop_path | tmdbImage:'w780') + ')'"
          aria-hidden="true">
        </div>
      }
    </article>
  }

  <!-- "You came from" section — shown when navigated from a track detail page -->
  @if (fromTrackId) {
    <section class="came-from" aria-label="Navigation context">
      <p class="came-from-label">You came from</p>
      <a
        [routerLink]="['/track', fromTrackId]"
        class="came-from-link"
        aria-label="Back to recommendations for this track">
        ← Back to recommendations
      </a>
    </section>
  }
</div>
```

### `movie-detail.component.css`

```css
.movie-detail-page {
  min-height: calc(100vh - var(--nav-height));
  position: relative;
}

.breadcrumb {
  padding: 16px 24px;
  border-bottom: 1px solid var(--color-border);
}

.btn-back {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: 0.9rem;
  padding: 8px 0;
  transition: color var(--transition-fast);
}
.btn-back:hover { color: var(--color-text-primary); }

.movie-layout {
  display: flex;
  gap: 48px;
  padding: 48px 24px;
  max-width: var(--max-content-width);
  margin: 0 auto;
}

.movie-poster {
  width: 300px;
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-card);
  flex-shrink: 0;
  object-fit: cover;
}

.movie-title {
  font-size: clamp(1.5rem, 4vw, 2.5rem);
  font-weight: 700;
  margin-bottom: 8px;
}

.movie-year {
  color: var(--color-text-secondary);
  font-weight: 400;
  font-size: 0.8em;
}

.tagline {
  color: var(--color-text-secondary);
  font-style: italic;
  margin-bottom: 16px;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 16px 0;
  flex-wrap: wrap;
}

.genres {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin: 12px 0 20px;
}

.genre-badge {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 100px;
  padding: 4px 12px;
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.overview {
  line-height: 1.7;
  color: var(--color-text-primary);
  max-width: 640px;
}

.actions {
  margin-top: 32px;
  display: flex;
  gap: 12px;
}

.btn-imdb {
  background: #f5c518; /* IMDB yellow */
  color: #000;
  padding: 10px 24px;
  border-radius: var(--border-radius-md);
  font-weight: 600;
  font-size: 0.9rem;
  transition: opacity var(--transition-fast);
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.btn-imdb:hover { opacity: 0.85; color: #000; }

.backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 400px;
  background-size: cover;
  background-position: center top;
  opacity: 0.08;
  z-index: -1;
  pointer-events: none;
}

.loading-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 50vh;
}

.came-from {
  padding: 24px;
  border-top: 1px solid var(--color-border);
  max-width: var(--max-content-width);
  margin: 0 auto;
}

.came-from-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
}

.came-from-link {
  color: var(--color-accent);
  font-size: 0.9rem;
  transition: opacity var(--transition-fast);
}
.came-from-link:hover { opacity: 0.8; }

@media (max-width: 768px) {
  .movie-layout {
    flex-direction: column;
    align-items: center;
    gap: 24px;
    padding: 24px 16px;
  }
  .movie-poster { width: 220px; }
  .info-column { width: 100%; }
}
```

---

## Acceptance Criteria

- [ ] `ng build` completes with zero errors after this task
- [ ] Movie detail loads at `/movie/:id` using TMDB `getMovie()`
- [ ] Shows poster, title, year, genres, vote_average, vote_count, runtime, overview, tagline
- [ ] `RatingBadgeComponent` used for vote_average display
- [ ] IMDB link opens in new tab with `rel="noopener noreferrer"`
- [ ] IMDB button only shown when `imdb_id` is present
- [ ] "Back to recommendations" button (breadcrumb) returns to `/track/:id` when `fromTrackId` is set
- [ ] "Back" returns to `/` when no `fromTrackId`
- [ ] "You came from" section visible at page bottom when `fromTrackId` is set, linking back to the track
- [ ] Loading spinner shown while fetching
- [ ] Error state shown when movie not found
- [ ] Backdrop image present as decorative background (aria-hidden)
- [ ] Poster has descriptive `alt` text
- [ ] Responsive layout at mobile widths
