# Task-008 — Shared UI Components & CSS Utilities

**Assigned Agent:** H  
**Wave:** 2 (depends on Task-001)

---

## Goal

Build the reusable UI component library used by all feature pages: movie cards, track
cards, loading spinners, rating badges, search bar, empty state, and a duration pipe.
All components use custom CSS only (no component libraries).

---

## Inputs

- `spec/contracts/types.ts` — `TMDBMovie`, `SpotifyTrack`, `MovieRecommendation`, `ImageSize`

---

## File Ownership

```
src/app/
  shared/
    components/
      movie-card/
        movie-card.component.ts/.html/.css
      track-card/
        track-card.component.ts/.html/.css
      loading-spinner/
        loading-spinner.component.ts/.html/.css
      rating-badge/
        rating-badge.component.ts/.html/.css
      search-bar/
        search-bar.component.ts/.html/.css
      empty-state/
        empty-state.component.ts/.html/.css
    pipes/
      duration.pipe.ts
    index.ts
```

---

## Component Specifications

### `MovieCardComponent`

Displays a movie recommendation as a card.

**Inputs:**
```typescript
@Input({ required: true }) recommendation!: MovieRecommendation;
@Input() showSource = true;  // show "AI enhanced" badge if source includes llm
```

**Output:**
```typescript
@Output() viewDetails = new EventEmitter<number>(); // emits movie.id
```

**Visual structure:**
```
┌────────────────────┐
│  [Poster image]    │  ← 100% width, aspect-ratio: 2/3, object-fit: cover
│                    │     fallback to no-poster.svg
├────────────────────┤
│ ⭐ 7.8  [AI badge] │  ← RatingBadge + optional source badge
│ Movie Title        │  ← font-size: 0.9rem, font-weight: 600, 2-line clamp
│ 2001               │  ← release year, text-secondary color
│ [View Movie →]     │  ← button, accent color
└────────────────────┘
```

- `role="article"` on root element
- Poster `alt` = `"{movie.title} movie poster"`
- "View Movie" button triggers `viewDetails.emit(movie.id)`
- Card hover: lift effect (`transform: translateY(-4px)`, box-shadow increase)
- Keyboard accessible: entire card focusable, Enter/Space triggers viewDetails

### `TrackCardComponent`

Displays a Spotify track in search results.

**Inputs:**
```typescript
@Input({ required: true }) track!: SpotifyTrack;
```

**Output:**
```typescript
@Output() selected = new EventEmitter<SpotifyTrack>();
```

**Visual structure:**
```
┌─────────────────────────────────────┐
│ [Album Art]  Track Name             │
│   48x48      Artist Name · Duration │
└─────────────────────────────────────┘
```

- `role="button"`, `tabindex="0"`, keyboard: Enter/Space triggers `selected`
- Album art: 48×48px, border-radius: 4px
- Duration shown via `DurationPipe`
- Hover background: `var(--color-bg-secondary)`

### `LoadingSpinnerComponent`

**Inputs:**
```typescript
@Input() size: 'sm' | 'md' | 'lg' = 'md';  // 24px / 40px / 64px
@Input() message = '';  // optional text below spinner
```

- CSS-only spinner (no SVG animation libraries)
- `role="status"` with `aria-label="Loading"` (or custom message)
- Center-aligned by default

```css
.spinner {
  border: 3px solid var(--color-border);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
```

### `RatingBadgeComponent`

**Inputs:**
```typescript
@Input({ required: true }) rating!: number;  // 0-10 TMDB rating
```

Visual: `⭐ 7.8` — color-coded:
- ≥ 8.0: `var(--color-success)` (green)
- ≥ 6.0: `var(--color-accent)` (amber)  
- < 6.0: `var(--color-text-secondary)` (grey)

### `SearchBarComponent`

**Inputs:**
```typescript
@Input() placeholder = 'Search songs or artists...';
@Input() value = '';
@Input() disabled = false;
```

**Outputs:**
```typescript
@Output() queryChange = new EventEmitter<string>();
@Output() cleared = new EventEmitter<void>();
@Output() disabledClick = new EventEmitter<void>(); // emits when user clicks a disabled search bar
```

- Full-width input with search icon (🔍) on left
- Clear (✕) button appears when input has value
- `role="search"`, `aria-label="Search songs"`
- Emits `queryChange` on every `input` event (debouncing is handled by SearchStateService)
- When `disabled` is true, a transparent overlay `<button>` covers the input and emits
  `disabledClick` on click/Enter — this lets unauthenticated users click the bar and be
  prompted to connect Spotify rather than receiving no feedback
- Focus styles visible (outline: 2px solid var(--color-accent))
- Keyboard: Escape clears the input

### `EmptyStateComponent`

**Inputs:**
```typescript
@Input() icon = '🎬';
@Input({ required: true }) title!: string;
@Input() message = '';
@Input() actionLabel = '';
```

**Outputs:**
```typescript
@Output() action = new EventEmitter<void>();
```

Used for: "No results found", "Connect Spotify to search", "No recommendations".

### `DurationPipe`

```typescript
@Pipe({ name: 'duration', standalone: true })
export class DurationPipe implements PipeTransform {
  /** Converts milliseconds to "m:ss" format */
  transform(ms: number): string
}
```

Example: `224000` → `"3:44"`

---

## Accessibility Requirements (All Components)

- All interactive elements have visible focus indicators
- Colors pass 4.5:1 contrast ratio
- Poster images have descriptive `alt` text
- Loading states announced via ARIA
- No click-only interactions — all clickable items keyboard accessible

---

## Acceptance Criteria

- [ ] `ng build` completes with zero errors after this task
- [ ] All 6 components are standalone Angular components
- [ ] `MovieCardComponent` emits `viewDetails` on button click and Enter/Space key
- [ ] `TrackCardComponent` emits `selected` on click and Enter/Space key
- [ ] `LoadingSpinnerComponent` has CSS-only animation, `role="status"`
- [ ] `RatingBadgeComponent` color-codes based on rating value
- [ ] `SearchBarComponent` emits `queryChange` on input, `cleared` on ✕ click/Escape
- [ ] `EmptyStateComponent` renders icon, title, message, and optional action button
- [ ] `DurationPipe` converts 224000ms → "3:44"
- [ ] All components use CSS custom properties from `styles.css` design tokens
- [ ] No hardcoded colors — all colors reference `var(--color-*)` tokens
- [ ] `index.ts` re-exports all components and the pipe
