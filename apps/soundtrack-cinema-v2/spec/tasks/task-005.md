# Task-005 — TMDB API Service

**Assigned Agent:** E  
**Wave:** 1 (no dependencies)

---

## Goal

Implement a typed HTTP client service for The Movie Database (TMDB) API, plus an
Angular pipe for constructing image URLs. Covers all endpoints documented in
`spec/contracts/api.yaml`.

---

## Inputs

- `spec/contracts/types.ts` — `TMDBMovie`, `TMDBSearchResult`, `ImageSize`
- `spec/contracts/api.yaml` — TMDB endpoint shapes
- `spec/contracts/env.md` — `environment.tmdb` config

---

## File Ownership

```
src/app/
  services/
    tmdb/
      tmdb.service.ts              ← typed HTTP client for TMDB
      tmdb-image.pipe.ts           ← pipe: poster_path + size → full URL
      index.ts                     ← re-exports
```

---

## Implementation Details

### `tmdb.service.ts`

Injectable service (`providedIn: 'root'`). Uses Angular `HttpClient`.

```typescript
@Injectable({ providedIn: 'root' })
export class TmdbService {
  private http = inject(HttpClient);
  private env = inject(ENVIRONMENT_TOKEN); // InjectionToken for Environment

  /** GET /search/movie?query=...&include_adult=false */
  searchMovies(query: string, page = 1): Observable<TMDBSearchResult>

  /** GET /movie/{id} — full movie detail including imdb_id, runtime, genres */
  getMovie(id: number): Observable<TMDBMovie>

  /** GET /movie/popular?page=1 */
  getPopularMovies(page = 1): Observable<TMDBSearchResult>
}
```

**Auth:** Include `Authorization: Bearer {environment.tmdb.apiKey}` header on every request.
Add this via `HttpHeaders` in each call (not via interceptor — avoid conflicting with
the Spotify interceptor). Or create a separate TMDB interceptor that only applies to
`api.themoviedb.org` requests.

**Base URL:** `https://api.themoviedb.org/3`

**All requests include:**
- `include_adult: false` for search
- Language defaults to `en-US`

### `tmdb-image.pipe.ts`

Angular standalone pipe for constructing TMDB image URLs:

```typescript
@Pipe({ name: 'tmdbImage', standalone: true })
export class TmdbImagePipe implements PipeTransform {
  transform(path: string | null | undefined, size: ImageSize = 'w500'): string {
    if (!path) return '/assets/no-poster.svg'; // fallback
    return `https://image.tmdb.org/t/p/${size}${path}`;
  }
}
```

Usage in templates: `{{ movie.poster_path | tmdbImage:'w342' }}`

Also create `/public/assets/no-poster.svg` — a simple grey placeholder with a film
reel icon (inline SVG, ~200 bytes).

### TMDB Auth Implementation

Option A (recommended): Add Bearer token in each method call:
```typescript
private get headers() {
  return new HttpHeaders({
    Authorization: `Bearer ${this.env.tmdb.apiKey}`,
  });
}

searchMovies(query: string, page = 1): Observable<TMDBSearchResult> {
  return this.http.get<TMDBSearchResult>(`${this.BASE}/search/movie`, {
    headers: this.headers,
    params: new HttpParams()
      .set('query', query)
      .set('include_adult', 'false')
      .set('language', 'en-US')
      .set('page', page.toString()),
  });
}
```

### `ENVIRONMENT_TOKEN`

Define an Angular `InjectionToken<Environment>` here (since tmdb.service.ts needs it
and this is Wave 1):

```typescript
// src/app/core/tokens/environment.token.ts
export const ENVIRONMENT_TOKEN = new InjectionToken<Environment>('ENVIRONMENT');
```

⚠️ Agent E owns this file too: `src/app/core/tokens/environment.token.ts`

This token is provided in `app.config.ts` (by Task-013):
```typescript
{ provide: ENVIRONMENT_TOKEN, useValue: environment }
```

---

## Acceptance Criteria

- [ ] `ng build` completes with zero errors after this task
- [ ] `TmdbService.searchMovies()` returns `Observable<TMDBSearchResult>`
- [ ] `TmdbService.getMovie()` returns `Observable<TMDBMovie>` with `imdb_id` field
- [ ] `TmdbService.getPopularMovies()` returns `Observable<TMDBSearchResult>`
- [ ] All requests use Bearer token auth from environment
- [ ] `TmdbImagePipe` correctly builds URLs: `https://image.tmdb.org/t/p/w500/path.jpg`
- [ ] `TmdbImagePipe` returns fallback for null/undefined paths
- [ ] `ENVIRONMENT_TOKEN` injection token is defined and exported
- [ ] No `any` types used
- [ ] `adult` content is excluded (`include_adult=false`)
- [ ] `index.ts` re-exports all public symbols
