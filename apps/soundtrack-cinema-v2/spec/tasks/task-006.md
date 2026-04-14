# Task-006 — Recommendation Engine + LLM Service

**Assigned Agent:** F  
**Wave:** 2 (depends on Task-004, Task-005)

---

## Goal

Implement the core intelligence layer: given a Spotify track, produce a ranked, deduplicated,
filtered list of movie recommendations by combining TMDB search results with optional
Claude AI sentiment-based suggestions.

---

## Inputs

- `spec/contracts/types.ts` — `SpotifyTrack`, `TMDBMovie`, `MovieRecommendation`, `RecommendationResult`, `PlaylistRecommendationResult`, `PlaylistMovieRecommendation`, `LLMRecommendationRequest`, `LLMRecommendationResponse`, `LLMMovieSuggestion`
- `spec/contracts/env.md` — `environment.anthropic` config
- Output from Task-004: `SpotifyService` (reads artist genres)
- Output from Task-005: `TmdbService` (search movies)

---

## File Ownership

```
src/app/
  services/
    recommendation/
      recommendation.service.ts    ← orchestrates TMDB + LLM, scores, filters
      llm.service.ts               ← Anthropic API client
      recommendation.utils.ts      ← pure scoring/dedup/merge functions
      index.ts                     ← re-exports
```

---

## Implementation Details

### `recommendation.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class RecommendationService {
  private tmdb = inject(TmdbService);
  private llm = inject(LlmService);
  private env = inject(ENVIRONMENT_TOKEN);

  /**
   * Main entry point: get movie recommendations for a single track.
   * Returns an Observable that emits one RecommendationResult when done.
   */
  getRecommendationsForTrack(track: SpotifyTrack): Observable<RecommendationResult>

  /**
   * Get aggregated movie recommendations for a list of tracks (playlist mode).
   * Runs track recommendations in parallel (max 5 concurrent), then merges.
   */
  getRecommendationsForPlaylist(
    playlist: SpotifyPlaylist,
    tracks: SpotifyTrack[]
  ): Observable<PlaylistRecommendationResult>
}
```

#### Algorithm for `getRecommendationsForTrack`

```
1. Build search query: "{trackName} {primaryArtistName}"
   Also try: "{primaryArtistName}" as a secondary query
2. Call TmdbService.searchMovies() with the primary query
   (limit to page 1 = up to 20 results)
3. Filter results: vote_average >= environment.minMovieRating (6.0)
4. Score TMDB results using scoreMovie() from recommendation.utils.ts
5. If environment.anthropic.apiKey is set:
   a. Call LlmService.getMovieSuggestions({ trackName, artistName, genres })
   b. For each LLM suggestion: search TMDB by title+year to get full movie object
   c. Filter those results by vote_average too
   d. Score and merge with TMDB results
6. Deduplicate by TMDB movie ID
7. Sort by score descending
8. Return RecommendationResult
```

#### Algorithm for `getRecommendationsForPlaylist`

```
1. Take up to 20 tracks from the playlist (to stay within API rate limits)
2. Run getRecommendationsForTrack for each track using forkJoin with concurrency
   (use rxjs mergeMap with concurrent: 5)
3. Collect all MovieRecommendation arrays
4. For each unique movie ID: find all contributing track IDs, sum scores
5. Create PlaylistMovieRecommendation with matchCount and contributingTrackIds
6. Sort by matchCount desc, then score desc
7. Return PlaylistRecommendationResult
```

### `recommendation.utils.ts`

Pure functions (no Angular injection):

```typescript
/**
 * Score a TMDB movie's relevance to a track.
 * Returns 0–100.
 */
export function scoreMovie(movie: TMDBMovie, query: string): number {
  let score = 0;
  // Base score from TMDB popularity (0-20 pts)
  score += Math.min(movie.popularity / 5, 20);
  // Rating bonus (0-30 pts)  vote_average is 0-10
  score += (movie.vote_average / 10) * 30;
  // Title match bonus (0-30 pts) — fuzzy match of query words in title
  const titleWords = movie.title.toLowerCase().split(/\s+/);
  const queryWords = query.toLowerCase().split(/\s+/);
  const matches = queryWords.filter(w => titleWords.some(t => t.includes(w)));
  score += (matches.length / queryWords.length) * 30;
  // Vote count confidence (0-20 pts) — more votes = more reliable
  score += Math.min(Math.log10(movie.vote_count + 1) * 5, 20);
  return Math.round(Math.min(score, 100));
}

/**
 * Merge two arrays of MovieRecommendation, preferring higher scores.
 * Source 'both' is assigned when a movie appears in both arrays.
 */
export function mergeRecommendations(
  tmdbResults: MovieRecommendation[],
  llmResults: MovieRecommendation[]
): MovieRecommendation[]

/**
 * Deduplicate recommendations by movie ID, keeping highest score.
 */
export function deduplicateRecommendations(
  recs: MovieRecommendation[]
): MovieRecommendation[]
```

### `llm.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class LlmService {
  private env = inject(ENVIRONMENT_TOKEN);

  /**
   * Call Claude Haiku to get movie suggestions based on song sentiment.
   * Returns empty array if no API key is configured.
   */
  getMovieSuggestions(request: LLMRecommendationRequest): Observable<LLMMovieSuggestion[]>
}
```

**Implementation:**

Use the Anthropic SDK (`@anthropic-ai/sdk`). Import `Anthropic` from `'@anthropic-ai/sdk'`.

The prompt to Claude:
```
You are a movie recommendation engine. Given a song, recommend movies that share
its emotional tone, themes, or musical style.

Song: "{trackName}" by {artistName}
Genres: {genres.join(', ') || 'unknown'}

Respond with a JSON array of up to 5 movie recommendations. Each item must have:
- "title": exact movie title (string)
- "year": release year (number, optional)  
- "reason": one sentence explaining why this movie matches (string)

Example response:
[{"title":"Almost Famous","year":2000,"reason":"Both capture the spirit of rock music and its emotional journey."}]

Respond with JSON only, no other text.
```

Request params:
- Model: `environment.anthropic.model` (`claude-haiku-4-5-20251001`)
- Max tokens: 512
- Temperature: 0.7

Parse the JSON response. If parsing fails, return empty array (fail gracefully).

Use `from(anthropic.messages.create({...}))` to convert the Promise to Observable.

**Graceful degradation:** If `environment.anthropic.apiKey` is empty string, immediately
return `of([])` without making any API call.

---

## Key Decisions

- **RxJS-first** — All async operations use Observables, not Promises. Use `from()` to
  wrap Promise-based SDK calls.
- **Fail gracefully** — LLM errors should not break the overall recommendation flow.
  Use `catchError(() => of([]))` on the LLM stream.
- **Rate limiting** — When fetching TMDB results for each LLM suggestion, use
  `mergeMap` with `concurrent: 3` to avoid hammering the API.
- **Playlist concurrency** — Limit to 5 concurrent track recommendations for playlists.
- **20-track limit for playlists** — Use `lodash-es/take` to limit playlist tracks.

---

## Acceptance Criteria

- [ ] `ng build` completes with zero errors after this task
- [ ] `getRecommendationsForTrack` returns `Observable<RecommendationResult>` with sorted, filtered recommendations
- [ ] All recommendations have `vote_average >= environment.minMovieRating`
- [ ] Results are deduplicated by TMDB movie ID
- [ ] Results are sorted by `score` descending
- [ ] `LlmService` returns `Observable<LLMMovieSuggestion[]>` (empty array if no API key)
- [ ] LLM errors are caught and return empty array (no thrown exceptions)
- [ ] `scoreMovie` returns a value between 0 and 100
- [ ] Playlist recommendations include `matchCount` and `contributingTrackIds`
- [ ] No `any` types used
- [ ] `index.ts` re-exports all public symbols
