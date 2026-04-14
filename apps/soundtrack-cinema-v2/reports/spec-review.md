# Spec Review — Soundtrack Cinema v2

> Reviewer: Claude Sonnet 4.6  
> Date: 2026-04-13  
> Scope: `PROJECT_SPEC.md` + all files in `spec/`

---

## Executive Summary

The spec is well-structured with a clear wave-based parallelization strategy, solid type contracts, and good coverage of accessibility requirements. The app concept is compelling. However, there are **5 critical blocking bugs** in the spec itself that would prevent the built app from working correctly, several **contradictions between tasks**, and meaningful gaps in the UI design. These must be resolved before running the orchestrator.

---

## 1. Critical Bugs (Blocking)

### 1.1 `@angular/cdk` and `@anthropic-ai/sdk` not in `package.json`

**Where:** Orchestrator Instructions (Section 8) vs. `package.json`  
The orchestrator's setup command is:
```
npm install @angular/cdk@^21.0.0 @anthropic-ai/sdk
```
`@signality/core` is already in `package.json` (`^0.2.0`) and will be installed by a standard `npm install`. However, `@angular/cdk` and `@anthropic-ai/sdk` are **not** in `package.json`. The orchestrator command covers them, but only if that command is run before any agent tries to build. If a subagent runs `ng build` before the orchestrator's setup step completes, the build fails.

**Fix:** Add `@angular/cdk` and `@anthropic-ai/sdk` to `package.json` directly so they're always installed with `npm install`, independent of orchestrator sequencing.

---

### 1.2 `readonly` field mutated in `ngOnInit` — TypeScript error

**Where:** `task-011.md` — `MovieDetailComponent`

The spec declares:
```typescript
readonly fromTrackId: string | null = null;
```
Then in `ngOnInit`:
```typescript
this.fromTrackId = this.route.snapshot.queryParamMap.get('from');
```
TypeScript will reject this assignment to a `readonly` class field outside the constructor. **This is a compile error.**

**Fix:** Remove `readonly`, or initialize it inside the constructor using `inject(ActivatedRoute)` instead of ngOnInit.

---

### 1.3 Auth guard vs. "Connect Spotify" prompt contradiction

**Where:** `task-012.md` Acceptance Criteria vs. `task-013.md`

Task-012 explicitly states:
> "Unauthenticated users see 'Connect Spotify' prompt (not a redirect)"

Task-013 adds `canActivate: [authGuard]` to the `/playlist` route, which navigates unauthenticated users to `/`. These two requirements are mutually exclusive. Whichever agents implement them, the result will fail one of the two acceptance criteria.

**Fix:** Either remove the `authGuard` from the playlist route and rely on the in-component check, or remove the in-component "Connect Spotify" prompt and accept that the guard redirects. The in-component approach is better UX. Given Task-012 explicitly says "not a redirect," the guard should be dropped from the playlist route.

---

### 1.4 `from` query param never passed — "Back to recommendations" dead on arrival

**Where:** `task-011.md` (MovieDetailComponent) vs. `task-010.md` (TrackDetailComponent) and `task-012.md` (PlaylistComponent)

`MovieDetailComponent` reads `fromTrackId` from `?from=` query param to enable "Back to recommendations." But in Track Detail (`task-010.md`):
```typescript
onViewMovie(movieId: number): void {
  this.router.navigate(['/movie', movieId]);
}
```
The `from` param is never passed. Same issue in Playlist (`task-012.md`). The back button in movie detail will always fall back to `/` instead of the track it came from.

**Fix:** Add `queryParams: { from: this.route.snapshot.paramMap.get('id') }` when navigating from track detail to movie detail. For playlist, pass a different `from` value or handle the back navigation differently.

---

### 1.5 `effect()` block placed outside the class body in spec code

**Where:** `task-010.md` — `TrackDetailComponent`

The code sample shows an `effect()` call after the `private async loadTrack()` method as a standalone block:
```typescript
// Add to constructor effect:
effect(() => {
  const status = this.recsStatus();
  ...
});
```
This is not valid TypeScript — `effect()` must be called inside an injection context (constructor or field initializer). As written, a subagent may place this outside the class definition, producing a compile error.

**Fix:** Move this `effect()` into the constructor body and make it explicit in the code sample.

---

## 2. Architectural Issues

### 2.1 Duplicate auth state — two sources of truth

`SpotifyAuthService` (Task-003) exposes its own `isAuthenticated`, `accessToken`, and `user` signals directly on the service. `AuthStateService` (Task-007) independently maintains `status`, `user`, and `isAuthenticated`. Both are `providedIn: 'root'` singletons.

This creates two separate reactive auth state trees that must stay in sync. If the auth service updates its internal state but doesn't propagate to `AuthStateService` (or vice versa), components reading from different services will show inconsistent UI. The Nav component (Task-002) is told to inject `AuthState` service from Task-007, but `SpotifyAuthService` (Task-003) manages the actual tokens.

**Fix:** Define clear ownership. Either:
- `SpotifyAuthService` holds only OAuth mechanics (login/callback/refresh/logout) and always delegates state to `AuthStateService`, OR
- Collapse both into a single service. 

The second option is cleaner and avoids the synchronization problem entirely.

---

### 2.2 `SearchStateService` doesn't cancel in-flight requests

**Where:** `task-007.md` — `SearchStateService.executeSearch()`

The `executeSearch` method uses `.subscribe()` directly without cancelling previous in-flight requests. If the user types quickly and multiple Spotify searches are in-flight, whichever response arrives last "wins" — even if it corresponds to an older query. This is a classic race condition.

**Fix:** Switch from manual subscription to `switchMap` on the debounced signal. Alternatively, store the active subscription and `unsubscribe()` before starting a new one. The cleanest solution is to refactor `executeSearch` to use `switchMap` via `toObservable` on the debounced signal.

---

### 2.3 TMDB auth is inconsistent with Spotify auth pattern

Task-004 uses a functional HTTP interceptor (`spotifyAuthInterceptor`) to inject the Spotify bearer token. Task-005 opts for per-request `HttpHeaders` construction for TMDB auth — explicitly avoiding an interceptor to "avoid conflicting with the Spotify interceptor."

These two different auth patterns add cognitive overhead. The Spotify interceptor already guards against intercepting non-Spotify URLs (`if (!req.url.includes('api.spotify.com'))`). A similar TMDB interceptor would be symmetrical and equally safe.

**Fix:** Create a `tmdb-http.interceptor.ts` (owned by Agent E) that mirrors the Spotify interceptor pattern, gating on `api.themoviedb.org`. This keeps auth injection uniform and eliminates the per-request header boilerplate in `TmdbService`.

---

### 2.4 Nav component (Wave 1) depends on `AuthStateService` (Wave 2)

**Where:** `task-002.md` notes

The nav component needs to show auth state (user avatar, "Connect Spotify" button) but `AuthStateService` is built in Wave 2 (Task-007). The spec acknowledges this and suggests "inject with `@Optional()` or use a simple `signal(null)` placeholder." However, Agent M (Task-013) can only modify `app.config.ts`, `app.routes.ts`, and `app.spec.ts` — not the nav component. So Agent B must implement a self-contained auth placeholder that "just works" after Task-007 ships.

The simplest resolution is for Agent B to import `AuthStateService` by its future path `../../core/state/auth.state` and let the Wave 1 build fail gracefully on that import — since lazy routes mean the shell is loaded but the state service doesn't need to exist yet. Angular's DI will resolve at runtime.

**Better Fix:** Make the dependency explicit — Agent B's nav should import `AuthStateService` at the expected path even in Wave 1. As long as `ng build` doesn't fail (and it won't since Angular compiles lazily), this is fine. Document this clearly in the orchestrator instructions: "Wave 1 build will succeed even though the AuthStateService file doesn't exist yet, because it's only referenced within a standalone component loaded lazily."

---

### 2.5 `ENVIRONMENT_TOKEN` ownership ambiguity

Task-005 creates `src/app/core/tokens/environment.token.ts` and owns it. But `src/app/core/tokens/` is not listed in any agent's file ownership section in `PROJECT_SPEC.md` Section 5 — only in the task-005 body text. If another Wave 1 agent (B or C) tries to create the same file for their own use, there's a conflict.

**Fix:** Add `src/app/core/tokens/environment.token.ts` explicitly to Agent E's file ownership block in Section 5 of `PROJECT_SPEC.md`.

---

### 2.6 `PlaylistStateService` and `PlaylistComponent` duplicate computed signals

`PlaylistStateService` (Task-007) defines:
```typescript
selectedPlaylist = computed(...)
canGenerateRecommendations = computed(...)
```
`PlaylistComponent` (Task-012) re-derives identical computed signals locally. Agents would implement both, creating unnecessary state. Components should read from the state service's computeds directly, following the Zustand-style pattern the spec defines.

**Fix:** Remove the local re-derivations from `PlaylistComponent` and have it consume the state service's computeds directly.

---

### 2.7 Anthropic SDK browser compatibility not addressed

`@anthropic-ai/sdk` is the Node.js SDK. Browser usage requires either the browser-compatible build or a polyfill setup. The spec notes the security concern about exposing API keys but doesn't address the runtime issue. The SDK uses Node.js stream APIs and `process.env` in some builds.

**Fix:** Add a note in Task-006 about using `fetch`-based transport or verify `@anthropic-ai/sdk` works in Angular's browser build (it does have a browser export in recent versions, but this should be validated). Alternatively, use a raw `fetch` POST to the Anthropic API directly, which avoids the SDK dependency entirely for what is a single API call.

---

## 3. UI/UX Design Flaws

### 3.1 "Watch on Spotify" button in wireframe is not real

**Where:** `PROJECT_SPEC.md` — `/movie/:id` wireframe

The movie detail wireframe shows:
```
[View on IMDB ↗]  [Watch on Spotify ↗]
```
But the `MovieDetailComponent` code only implements the IMDB button. Spotify does not offer movies — this button has no valid destination. The wireframe should either be updated to remove it, or replaced with something meaningful (e.g., "Find Similar Movies" which navigates back to search).

---

### 3.2 "You came from" section is in the wireframe but not implemented

**Where:** `PROJECT_SPEC.md` — `/movie/:id` wireframe

The wireframe shows a "You came from" section at the bottom of the movie detail page, displaying the originating track with a "Find more movies like this" link. The `MovieDetailComponent` code has no such section. Given how central the music→movie concept is to the app, this cross-linking is a valuable UX touch that should be implemented or explicitly cut.

---

### 3.3 Search bar click does nothing for unauthenticated users

The home page disables the search bar for unauthenticated users. But the "Connect Spotify" call-to-action is a separate paragraph below the bar. A natural user behavior is to click the disabled search bar and expect to be prompted to connect. The spec has no click/focus handler on the disabled search bar that would prompt the user to authenticate.

**Fix:** Add an `(click)` handler on the disabled search bar (or wrap it in a button) that calls `connectSpotify()`.

---

### 3.4 No error/empty state for popular movies on home page

The home page calls `TmdbService.getPopularMovies()` but shows no error state if the call fails and no empty state if results are empty. A TMDB API failure would silently render a blank section below the hero.

---

### 3.5 Playlist auth guard breaks back-navigation from movie detail

When a user goes: `/playlist` → selects movie → `/movie/:id` → clicks Back, they return to `/` (home), not `/playlist`. This is because:
1. `MovieDetailComponent` only reads a `from` query param for track IDs, not playlist context
2. Even if it did, the guard redirects unauthenticated users away from `/playlist`

The playlist experience has no "session continuity" — once you navigate away, you lose your position.

---

### 3.6 Horizontal top-tracks scroll has no keyboard discoverability

The top tracks section on the home page uses `overflow-x: auto` in a flex row. Keyboard users can tab through items, but there's no visual indication that more items exist off-screen, and no scroll-to-focus behavior. On narrow screens, users may never discover that more tracks are available.

**Fix:** Add a visual "→" scroll indicator or convert to an explicit "See more" pagination. At minimum, ensure `tabindex` items are reachable via Tab and the scroll container responds to Arrow keys.

---

### 3.7 Popular movies shown to unauthenticated users aren't filtered by `minMovieRating`

The home page injects popular movies directly into `MovieCardComponent` without applying the `minMovieRating` filter. A popular movie could have a rating below 6.0, inconsistent with the app's stated quality threshold.

---

### 3.8 No pagination for movie recommendations

The track detail page shows all recommendations in a single grid. After deduplication, this could be 25–40 items. No pagination, virtualization, or "show more" button is specified. On mobile, this results in a very long scroll.

---

## 4. Orchestrator Plan Issues

### 4.1 Agent A (Task-001) is a no-op in this plan

The contracts are already created as part of spec generation. Task-001 is a verification pass by a subagent — valuable for correctness checking, but spending a full subagent (with a context cold-start and token budget) on what amounts to a checklist review is wasteful.

**Suggestion:** Either eliminate Agent A entirely and fold the verification into the orchestrator's pre-wave setup, or make Task-001 a synchronous orchestrator check before launching Wave 1 rather than a dedicated subagent.

---

### 4.2 Wave 1 `ng build` check can pass with broken components

Lazy-loaded routes are not type-checked at build time in Angular. After Wave 1, `ng build` will succeed even if the feature component stubs would fail compilation — they aren't compiled until they're imported. The build check only catches eagerly-loaded code. This means wave-level build gates give false confidence.

**Suggestion:** After Wave 2, run a more thorough check: `ng build --configuration=development` and specifically route to each page in a headless browser (e.g., a quick Playwright smoke run), or at minimum verify all lazy-loaded component files exist and have no obvious syntax errors.

---

### 4.3 No partial-wave failure recovery strategy

If Agent G (state services) produces broken code in Wave 2, Agents I–L in Wave 3 have broken state service imports and will all fail. The orchestrator instructions have no fallback: "if wave N has failures, halt and report" or "retry the failed agent before proceeding."

**Suggestion:** After each wave, have the orchestrator explicitly check which agents succeeded/failed. If any Wave N agent fails, halt Wave N+1 and report the failures before proceeding.

---

### 4.4 Agent M (Task-013) touches files partly owned by Agent B

Agent B creates stub versions of `app.config.ts` and `app.routes.ts`. Agent M then makes significant changes to both in Wave 4. If Agent B's stubs have imports or patterns Agent M doesn't expect, Agent M may produce invalid code without realizing it. The spec's instruction for Agent M is to produce a "final version" — but that implies rewriting what Agent B created.

**Suggestion:** In the orchestrator instructions, explicitly tell Agent M: "Read the current contents of `app.config.ts` and `app.routes.ts` before writing the final version. Preserve anything Agent B added that isn't already in the spec's final template."

---

### 4.5 No handling of 401 token expiry in the Spotify interceptor

The `spotifyAuthInterceptor` adds the current access token but has no logic for handling 401 responses (expired token → refresh → retry). If a user's session token expires mid-use, all Spotify API calls will silently fail with 401s that propagate as errors in the state services. The spec's auth service has a `refreshToken()` method, but nothing wires up the interceptor to call it on 401.

**Suggestion:** Add a note in Task-004 (or Task-013) to extend the interceptor with a `catchError` that detects 401s, calls `authService.getValidToken()` (which internally refreshes), and retries the request.

---

## 5. Contract Issues

### 5.1 `SpotifyTopTracksResult` naming inconsistency

The `SpotifyTopTracksResult` type (defined in `types.ts`) is used for the `/me/top/tracks` endpoint response. But `SpotifyService.getTopArtists()` (Task-004) returns `Observable<SpotifyArtist[]>` even though the API returns a paginated response. There's no `SpotifyTopArtistsResult` type in `types.ts`. Agent D would need to either invent a type or reuse `SpotifyTopTracksResult` with a different generic — neither is clean.

**Fix:** Add `SpotifyTopArtistsResult` to `types.ts` mirroring `SpotifyTopTracksResult` but with `SpotifyArtist[]`.

---

### 5.2 `RecommendationsState.minRating` described as "IMDB rating" but it's TMDB

In `types.ts`:
```typescript
/** Minimum IMDB/TMDB vote_average to include in recommendations */
minRating: number;
```
The spec uses TMDB `vote_average` throughout (0–10 scale). IMDB ratings are separate data not fetched by the app. The comment should say "TMDB `vote_average`" only.

---

### 5.3 `api.yaml` uses `$ref` to `.ts` file

The OpenAPI spec at `spec/contracts/api.yaml` references:
```yaml
$ref: "./types.ts#/SpotifyTrack"
```
This is not valid JSON Schema / OpenAPI `$ref` syntax. OpenAPI `$ref` targets JSON Schema files (`.json`) or other `.yaml` files. A `.ts` file reference won't be resolved by any standard OpenAPI tooling. While this doesn't affect the Angular app directly, it makes the contract file invalid as a proper API spec.

**Fix:** Either define inline schemas in the YAML, or replace the `$ref`s with documentation comments like `# see types.ts SpotifyTrack`.

---

## 6. Recommendation Quality Concerns

### 6.1 `scoreMovie` doesn't use track metadata at all

The scoring function in `recommendation.utils.ts` computes:
- Base score from TMDB popularity
- Rating bonus from `vote_average`
- Title match: how many words from `"{trackName} {artistName}"` appear in the movie title
- Vote count confidence

The title match will produce garbage results. For example, searching for "Queen" movies would score "The Queen" highly simply for the title word, regardless of any musical/mood connection. The entire "matching" is based on whether the song name appears in a movie title — not on genre, mood, or sentiment.

This is the core differentiating feature of the app ("bridges music and film based on emotional DNA"). The TMDB-only path is essentially a movie title search, not recommendation. The LLM path is where actual value comes from, making the LLM API key a de facto requirement for a useful product.

**Suggestion:** 
- Be explicit in the spec that TMDB results are "soundtrack matches" (movie has same name as song) and LLM results are "mood matches"
- Consider using TMDB's keyword search or discover endpoint with genre filters derived from Spotify genres
- Lower the `minMovieRating` threshold for the TMDB path since fewer results are expected

---

### 6.2 20-track limit for playlists may frustrate users with large playlists

Playlists with 50–100+ tracks are common. Silently truncating to 20 tracks for recommendation generation could produce skewed results for diverse playlists. There's no user communication about this limit.

**Fix:** Show the user "Analyzing top 20 tracks from this playlist" so they understand the limitation.

---

## 7. Summary of Recommended Changes

### Must Fix (blocks correctness)
1. Add `@angular/cdk` and `@anthropic-ai/sdk` to `package.json` (not just the orchestrator command)
2. Fix `readonly fromTrackId` mutation bug in Task-011
3. Resolve auth guard vs. in-component prompt contradiction (Tasks 012/013) — recommend removing the guard from `/playlist`
4. Pass `?from=trackId` query param when navigating to `/movie/:id` from track detail (Task-010)
5. Move the orphaned `effect()` into the constructor in Task-010

### Should Fix (significant UX/architecture issues)
6. Consolidate `SpotifyAuthService` signals and `AuthStateService` to a single auth state source
7. Add `switchMap`-based cancellation to `SearchStateService.executeSearch()`
8. Add `SpotifyTopArtistsResult` type to `types.ts`
9. Remove "Watch on Spotify" button from movie detail wireframe (not feasible)
10. Implement or explicitly drop the "You came from" section in the movie detail wireframe
11. Add a click handler on disabled search bar to prompt auth
12. Add explicit `src/app/core/tokens/environment.token.ts` to Agent E's file ownership in Section 5
13. Add 401 retry logic note to the Spotify interceptor task

### Nice to Have
14. Fold Task-001 into orchestrator pre-checks (no dedicated subagent)
15. Add `from` query param when navigating from playlist to movie detail
16. Surface the 20-track playlist limit in the UI
17. Add error/empty states for popular movies on home page
18. Filter popular movies on home page by `minMovieRating`
19. Fix invalid `$ref` syntax in `api.yaml`
20. Fix "IMDB/TMDB" comment inaccuracy in `types.ts`
21. Add partial-wave failure recovery to orchestrator instructions
