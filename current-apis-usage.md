# Current API usage (soundtrack-cinema)

This document summarizes HTTP endpoints and authentication used by the services under `apps/soundtrack-cinema/src/app/common/services/spotify` and `apps/soundtrack-cinema/src/app/common/services/tmdb-api`.

---

## Spotify (`SpotifyService` + `@spotify/web-api-ts-sdk`)

### Authentication

| Aspect | Detail |
|--------|--------|
| **Mechanism** | OAuth 2.0 **Authorization Code with PKCE** via `SpotifyApi.withUserAuthorization` (see `@spotify/web-api-ts-sdk`). |
| **User-facing flow** | Redirect to Spotify Accounts, callback at `{origin}/callback` (`SpotifyService` builds `redirectUri` from `window.location.origin`). |
| **API requests** | After login, the SDK attaches a **Bearer access token** to calls to `https://api.spotify.com/v1/...`. |
| **Configuration** | `environment.spotify.clientId` is required. `environment.spotify.clientSecret` exists in the environment template but **is not used** by `SpotifyService` (PKCE in the browser does not use the client secret). |
| **Scopes requested** | `playlist-read-private`, `playlist-read-collaborative`, `user-read-private`, `user-read-email`, `user-top-read`, `user-library-read`. |
| **Session** | Token handling and persistence are managed inside the SDK (including `getAccessToken()`, `logOut()`). |

### REST endpoints (via SDK)

Base URL for resource calls: **`https://api.spotify.com/v1/`** (all methods below are **GET** unless noted).

| `SpotifyService` API | Underlying Spotify Web API endpoint |
|----------------------|-------------------------------------|
| `paginatedSearch` → `sdk.search(...)` | `/search` — query params include `q`, `type` (album, artist, playlist, track), `limit`, `offset`. |
| `getAlbum` | `/albums/{id}` |
| `getArtist` | `/artists/{id}` |
| `getPlaylist` | `/playlists/{id}` |
| `getTrack` | `/tracks/{id}` |
| `getPaginatedUserPlaylists` / `getAllUserPlaylists` | `/me/playlists` (paginated; `getAllUserPlaylists` loops until all pages are fetched). |
| `getCurrentUserProfile` | `/me` |
| `getTopArtists` | `/me/top/artists` (optional `time_range`) |
| `getTopTracks` | `/me/top/tracks` (optional `time_range`) |

### Related code

- Service: `apps/soundtrack-cinema/src/app/common/services/spotify/spotify.service.ts`
- Mapping helpers (no HTTP): `apps/soundtrack-cinema/src/app/common/services/spotify/mapper.ts`

### Current in-app usage (call sites)

- **`paginatedSearch`** is used from the explore flow (`explore-page.component.ts`).
- Login/callback components call **`authenticate()`** (OAuth), and **`isAuthenticated()`** is used by the auth guard.
- Other `SpotifyService` methods above are **exposed** on the service but **not referenced** from other `src/` components at the time of this report (available for future features).

---

## TMDB (`TmdbApiService`)

### Authentication

| Aspect | Detail |
|--------|--------|
| **Mechanism** | **Bearer token** in the `Authorization` header on JSON API requests. |
| **Credential** | `environment.tmdb.apiKey` — this should be the **TMDB API Read Access Token** (v4-style token TMDB shows in the dashboard), which is sent as `Authorization: Bearer <token>`. |
| **Public image URLs** | Poster/backdrop URLs built with `getImageUrl` use the **image CDN** below and do **not** send the API key in the URL. |

### REST endpoints

Base URL for API: **`https://api.themoviedb.org/3`**

| Method on `TmdbApiService` | HTTP | Path / query |
|----------------------------|------|----------------|
| `searchMovies` | GET | `/search/movie?query=...&include_adult=false` |
| `getMovieDetails` | GET | `/movie/{movieId}` |
| `getPopularMovies` | GET | `/movie/popular?page=1` |

### Image CDN (not the JSON API)

| Method | Base | Usage |
|--------|------|--------|
| `getImageUrl` | `https://image.tmdb.org/t/p` | Appends size (e.g. `w500`) and the poster/backdrop path. |

### Related code

- Service: `apps/soundtrack-cinema/src/app/common/services/tmdb-api/tmdb-api.service.ts`
- Types: `apps/soundtrack-cinema/src/app/common/services/tmdb-api/types.ts`

### Current in-app usage (call sites)

- **`searchMovies`** — `selected-song-page.component.ts`
- **`getImageUrl`** — `movie-card.component.ts` (poster `src`)
- **`getMovieDetails`** and **`getPopularMovies`** are implemented on the service but **not called** elsewhere under `src/` at the time of this report.

---

## Environment variables (reference)

Defined in `apps/soundtrack-cinema/src/environments/environment.ts` (from templates):

- **Spotify:** `spotify.clientId` (and template includes `clientSecret`, unused by `SpotifyService` as above).
- **TMDB:** `tmdb.apiKey` (used as Bearer token for `api.themoviedb.org/3`).
