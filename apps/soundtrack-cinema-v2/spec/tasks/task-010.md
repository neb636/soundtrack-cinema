# Task-010 — Track Detail & Movie Recommendations Page

**Assigned Agent:** J  
**Wave:** 3 (depends on Task-002, Task-006, Task-007, Task-008)

---

## Goal

Build the track detail page: shows the selected Spotify track's info at the top and
a filtered/sorted grid of movie recommendations below. This is the core value-delivery
page of the application.

---

## Inputs

- Task-002 outputs: routing (route param `:id`), design tokens
- Task-004 outputs: `SpotifyService.getTrack()`
- Task-006 outputs: `RecommendationService`
- Task-007 outputs: `RecommendationsStateService`
- Task-008 outputs: `MovieCardComponent`, `LoadingSpinnerComponent`, `EmptyStateComponent`, `RatingBadgeComponent`, `TmdbImagePipe`, `DurationPipe`

---

## File Ownership

```
src/app/
  features/
    track-detail/
      track-detail.component.ts
      track-detail.component.html
      track-detail.component.css
```

---

## Implementation Details

### `track-detail.component.ts`

```typescript
@Component({
  selector: 'app-track-detail',
  standalone: true,
  imports: [MovieCardComponent, LoadingSpinnerComponent, EmptyStateComponent,
            RatingBadgeComponent, TmdbImagePipe, DurationPipe, RouterLink],
  templateUrl: './track-detail.component.html',
  styleUrl: './track-detail.component.css',
})
export class TrackDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private spotifyService = inject(SpotifyService);
  private recsState = inject(RecommendationsStateService);
  private liveAnnouncer = inject(LiveAnnouncer);  // from @angular/cdk/a11y

  readonly track = signal<SpotifyTrack | null>(null);
  readonly trackLoading = signal(true);
  readonly trackError = signal<string | null>(null);

  // From state service — use .asReadonly() on plain signals; computed() is already readonly
  readonly recsStatus = this.recsState.status.asReadonly();
  readonly recommendations = this.recsState.filteredRecommendations; // computed()
  readonly recsError = this.recsState.error.asReadonly();
  readonly minRating = this.recsState.minRating.asReadonly();

  readonly sortOrder = signal<'score' | 'rating' | 'year'>('score');

  readonly sortedRecommendations: Signal<MovieRecommendation[]> = computed(() => {
    const recs = this.recommendations();
    const sort = this.sortOrder();
    return [...recs].sort((a, b) => {
      if (sort === 'rating') return b.movie.vote_average - a.movie.vote_average;
      if (sort === 'year') {
        const yearA = parseInt(a.movie.release_date?.substring(0, 4) ?? '0');
        const yearB = parseInt(b.movie.release_date?.substring(0, 4) ?? '0');
        return yearB - yearA;
      }
      return b.score - a.score; // default: relevance/score
    });
  });

  readonly hasLlmResults: Signal<boolean> = computed(() =>
    this.recommendations().some(r => r.source === 'llm-suggestion' || r.source === 'both')
  );

  constructor() {
    // Announce to screen readers when recommendations finish loading.
    // Must be inside constructor (an injection context) — effect() is not valid
    // as a standalone statement outside the class body.
    effect(() => {
      const status = this.recsStatus();
      const count = this.recommendations().length;
      if (status === 'success') {
        this.liveAnnouncer.announce(`Found ${count} movie recommendations`);
      }
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.router.navigate(['/']); return; }
    this.loadTrack(id);
  }

  onMinRatingChange(rating: number): void {
    this.recsState.setMinRating(rating);
  }

  onSortChange(sort: 'score' | 'rating' | 'year'): void {
    this.sortOrder.set(sort);
  }

  onViewMovie(movieId: number): void {
    const trackId = this.route.snapshot.paramMap.get('id');
    this.router.navigate(['/movie', movieId], {
      queryParams: { from: trackId },
    });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  private async loadTrack(id: string): Promise<void> {
    this.spotifyService.getTrack(id).subscribe({
      next: (track) => {
        this.track.set(track);
        this.trackLoading.set(false);
        this.recsState.loadForTrack(track);
        // Announce to screen readers
        this.liveAnnouncer.announce(`Loading movie recommendations for ${track.name}`);
      },
      error: () => {
        this.trackError.set('Could not load track. Please go back and try again.');
        this.trackLoading.set(false);
      },
    });
  }
}
```

### `track-detail.component.html`

```html
<div class="track-detail-page">
  <!-- Back navigation -->
  <nav class="breadcrumb" aria-label="Breadcrumb">
    <button class="btn-back" (click)="goBack()" aria-label="Go back to search">
      ← Back
    </button>
  </nav>

  <!-- Track hero -->
  @if (trackLoading()) {
    <div class="track-hero skeleton">
      <div class="skeleton-art"></div>
      <div class="skeleton-info"></div>
    </div>
  } @else if (track(); as t) {
    <section class="track-hero" aria-label="Track information">
      <img
        class="album-art"
        [src]="t.album.images[0]?.url"
        [alt]="t.album.name + ' album art'"
        width="200" height="200" />
      <div class="track-info">
        <h1 class="track-name">{{ t.name }}</h1>
        <p class="track-artist">{{ t.artists[0]?.name }}</p>
        <p class="track-meta">
          {{ t.album.name }} · {{ t.album.release_date | slice:0:4 }}
        </p>
        <p class="track-duration">{{ t.duration_ms | duration }}</p>
      </div>
    </section>
  } @else if (trackError()) {
    <app-empty-state
      icon="⚠️"
      [title]="trackError()!"
      actionLabel="Go Back"
      (action)="goBack()" />
  }

  <!-- Recommendations section -->
  @if (track()) {
    <section class="recommendations" aria-labelledby="recs-title">
      <div class="recs-header">
        <h2 id="recs-title">Movies that match this vibe</h2>

        <!-- Filters -->
        <div class="filters" role="group" aria-label="Filter and sort options">
          <label>
            Min Rating:
            <select
              [value]="minRating()"
              (change)="onMinRatingChange(+$any($event.target).value)"
              aria-label="Minimum movie rating">
              <option value="5">5.0+</option>
              <option value="6" selected>6.0+</option>
              <option value="7">7.0+</option>
              <option value="8">8.0+</option>
            </select>
          </label>

          <label>
            Sort by:
            <select
              [value]="sortOrder()"
              (change)="onSortChange($any($event.target).value)"
              aria-label="Sort recommendations">
              <option value="score">Relevance</option>
              <option value="rating">Rating</option>
              <option value="year">Year (newest)</option>
            </select>
          </label>
        </div>
      </div>

      <!-- Loading state -->
      @if (recsStatus() === 'loading') {
        <div class="recs-loading" aria-live="polite" aria-busy="true">
          <app-loading-spinner message="Finding movies..." size="lg" />
        </div>
      }

      <!-- Error state -->
      @else if (recsStatus() === 'error') {
        <app-empty-state
          icon="⚠️"
          [title]="recsError() ?? 'Something went wrong'"
          message="We couldn't load recommendations right now."
          actionLabel="Try Again"
          (action)="recsState.loadForTrack(track()!)" />
      }

      <!-- Empty results -->
      @else if (recsStatus() === 'success' && sortedRecommendations().length === 0) {
        <app-empty-state
          icon="🎬"
          title="No movies found"
          message="Try lowering the minimum rating filter or searching for a different song." />
      }

      <!-- Results grid -->
      @else if (sortedRecommendations().length > 0) {
        <div class="movies-grid">
          @for (rec of sortedRecommendations(); track rec.movie.id) {
            <app-movie-card
              [recommendation]="rec"
              [showSource]="hasLlmResults()"
              (viewDetails)="onViewMovie($event)" />
          }
        </div>

        @if (hasLlmResults()) {
          <p class="ai-note" aria-label="AI enhancement notice">
            🤖 Results enhanced with emotional sentiment analysis
          </p>
        }
      }
    </section>
  }
</div>
```

### CSS Highlights

```css
.track-hero {
  display: flex;
  gap: 32px;
  align-items: center;
  padding: 32px 24px;
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
}

.album-art {
  width: 200px;
  height: 200px;
  border-radius: var(--border-radius-md);
  object-fit: cover;
  flex-shrink: 0;
  box-shadow: var(--shadow-card);
}

.track-name {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 8px;
}

.movies-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 20px;
  padding: 24px;
}

.recs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  flex-wrap: wrap;
  gap: 12px;
}

/* Skeleton loading */
.skeleton-art {
  width: 200px; height: 200px;
  background: var(--color-bg-card);
  border-radius: var(--border-radius-md);
  animation: shimmer 1.5s ease infinite;
}

@keyframes shimmer {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

@media (max-width: 640px) {
  .track-hero { flex-direction: column; text-align: center; }
  .album-art { width: 140px; height: 140px; }
}
```

---

## Acceptance Criteria

- [ ] `ng build` completes with zero errors after this task
- [ ] Page loads track data from Spotify using route param `:id`
- [ ] Track hero shows album art, name, artist, album, and duration
- [ ] Recommendations grid shows after loading completes
- [ ] Loading spinner shown while fetching (aria-busy)
- [ ] `LiveAnnouncer` announces when recommendations load
- [ ] Min rating filter updates visible recommendations
- [ ] Sort dropdown changes recommendation order
- [ ] "AI enhanced" note visible only when LLM results are present
- [ ] Empty state shown when no movies match current filters
- [ ] Error state shown when recommendation fetch fails
- [ ] "Back" button navigates to `/`
- [ ] Clicking a movie card navigates to `/movie/:id`
- [ ] Responsive at mobile widths
