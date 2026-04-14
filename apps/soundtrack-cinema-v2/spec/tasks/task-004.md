# Task-004 — Spotify API Service

**Assigned Agent:** D  
**Wave:** 1 (no dependencies)

---

## Goal

Implement a typed HTTP client service for the Spotify Web API. Covers all endpoints
documented in `spec/contracts/api.yaml`. The service does not handle auth directly —
it receives an access token via injection and the interceptor adds it to requests.

---

## Inputs

- `spec/contracts/types.ts` — all Spotify types
- `spec/contracts/api.yaml` — all Spotify endpoint shapes

---

## File Ownership

```
src/app/
  services/
    spotify/
      spotify.service.ts           ← typed HTTP client for Spotify Web API
      spotify-http.interceptor.ts  ← adds Authorization: Bearer header
      index.ts                     ← re-exports
```

---

## Implementation Details

### `spotify.service.ts`

Injectable service (`providedIn: 'root'`). Uses Angular `HttpClient`.

Base URL: `https://api.spotify.com/v1`

```typescript
@Injectable({ providedIn: 'root' })
export class SpotifyService {
  private http = inject(HttpClient);
  private readonly BASE = 'https://api.spotify.com/v1';

  /** GET /me — current user profile */
  getMe(): Observable<SpotifyUser>

  /** GET /search?q=...&type=track — search tracks */
  searchTracks(query: string, limit = 20, offset = 0): Observable<SpotifySearchResult>

  /** GET /tracks/{id} */
  getTrack(id: string): Observable<SpotifyTrack>

  /** GET /artists/{id} — includes genres */
  getArtist(id: string): Observable<SpotifyArtist>

  /** GET /albums/{id} */
  getAlbum(id: string): Observable<SpotifyAlbum>

  /** GET /me/playlists */
  getMyPlaylists(limit = 20, offset = 0): Observable<SpotifyPaginatedPlaylists>

  /** GET /playlists/{id}?fields=id,name,images,tracks.items(track(id,name,artists,album,duration_ms)) */
  getPlaylist(id: string): Observable<SpotifyPlaylist>

  /** GET /me/top/tracks?time_range=medium_term */
  getTopTracks(timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term', limit = 20): Observable<SpotifyTopTracksResult>

  /** GET /me/top/artists */
  getTopArtists(timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term', limit = 20): Observable<SpotifyTopArtistsResult>
}
```

All methods return `Observable<T>` from `rxjs`. Use `this.http.get<T>(url, { params })`.
Add params via Angular `HttpParams`.

### `spotify-http.interceptor.ts`

Functional HTTP interceptor that attaches the Spotify Bearer token and handles 401
responses by refreshing the token and retrying the request once:

```typescript
export const spotifyAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(SpotifyAuthService);
  const token = authService.accessToken();

  // Only intercept requests to api.spotify.com
  if (!req.url.includes('api.spotify.com') || !token) {
    return next(req);
  }

  const authedReq = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });

  return next(authedReq).pipe(
    catchError((err: HttpErrorResponse) => {
      // On 401, the token has expired — refresh and retry once
      if (err.status === 401) {
        return from(authService.getValidToken()).pipe(
          switchMap(newToken => {
            if (!newToken) return throwError(() => err);
            return next(req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } }));
          })
        );
      }
      return throwError(() => err);
    })
  );
};
```

Imports needed: `catchError`, `switchMap`, `from`, `throwError` from `rxjs`; `HttpErrorResponse` from `@angular/common/http`.

**Important:** Do NOT intercept requests to `accounts.spotify.com` — that's the token
endpoint and must not have an Authorization header (PKCE doesn't use client secret).

### `index.ts`

```typescript
export { SpotifyService } from './spotify.service';
export { spotifyAuthInterceptor } from './spotify-http.interceptor';
```

---

## Key Decisions

- **Typed responses** — All methods are fully typed using interfaces from `spec/contracts/types.ts`.
  Never use `any`.
- **No caching** — Keep it simple; caching can be added later. Feature components
  will manage loading state themselves.
- **Error handling** — Do not add global error handling in the service. Let errors
  propagate as RxJS errors; state services (Task-007) will catch them.
- **Playlist fields optimization** — When fetching a playlist, use the `fields` query
  param to reduce payload size: request only `id,name,images,tracks.items(track(id,name,artists,album,duration_ms,preview_url,external_urls))`.

---

## Acceptance Criteria

- [ ] `ng build` completes with zero errors after this task
- [ ] All Spotify endpoint methods exist with correct return types from `spec/contracts/types.ts`
- [ ] `spotifyAuthInterceptor` only modifies requests to `api.spotify.com`
- [ ] No `any` types used
- [ ] `HttpClient` is used for all HTTP calls (no `fetch`)
- [ ] Methods use `HttpParams` for query parameters (not string interpolation)
- [ ] `index.ts` re-exports all public symbols
