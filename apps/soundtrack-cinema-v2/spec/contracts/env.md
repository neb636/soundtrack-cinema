# Environment Variables — Soundtrack Cinema v2

> READ-ONLY contract. No subagent may modify without orchestrator approval.

All environment variables are defined in `src/environments/environment.ts` (development)
and `src/environments/environment.prod.ts` (production). These files are **not committed
to git** — developers copy the template and fill in their own values.

---

## Spotify

| Variable | Type | Description | Example |
|---|---|---|---|
| `environment.spotify.clientId` | `string` | Spotify OAuth app Client ID from developer.spotify.com | `"abc123..."` |
| `environment.spotify.redirectUri` | `string` | Must match the URI registered in Spotify Developer Dashboard | `"http://localhost:4200/callback"` |
| `environment.spotify.scopes` | `string[]` | OAuth scopes to request | See below |

**Required Spotify OAuth Scopes:**
```
user-read-private
user-read-email
user-top-read
playlist-read-private
playlist-read-collaborative
```

---

## TMDB (The Movie Database)

| Variable | Type | Description | Example |
|---|---|---|---|
| `environment.tmdb.apiKey` | `string` | TMDB API v4 read access bearer token from themoviedb.org | `"eyJhbGc..."` |
| `environment.tmdb.baseUrl` | `string` | TMDB API base URL (hardcoded, no change needed) | `"https://api.themoviedb.org/3"` |
| `environment.tmdb.imageBaseUrl` | `string` | TMDB image CDN base (hardcoded) | `"https://image.tmdb.org/t/p"` |

---

## Anthropic (LLM — Optional)

| Variable | Type | Description | Example |
|---|---|---|---|
| `environment.anthropic.apiKey` | `string` | Anthropic API key from console.anthropic.com. **Leave empty string to disable LLM features.** | `"sk-ant-..."` |
| `environment.anthropic.model` | `string` | Claude model ID to use for recommendations | `"claude-haiku-4-5-20251001"` |

> ⚠️ **Security Note:** Calling the Anthropic API directly from the browser exposes the API key
> in network traffic. This is acceptable for personal/demo use only. Do not deploy publicly
> with a real API key without adding a backend proxy.

---

## App Settings

| Variable | Type | Description | Default |
|---|---|---|---|
| `environment.production` | `boolean` | Whether running in production mode | `false` |
| `environment.minMovieRating` | `number` | Minimum TMDB `vote_average` to include in recommendations | `6.0` |

---

## Environment File Template

```typescript
// src/environments/environment.ts  (DO NOT COMMIT)
import { Environment } from '../../spec/contracts/types';

export const environment: Environment = {
  production: false,
  spotify: {
    clientId: 'YOUR_SPOTIFY_CLIENT_ID',
    redirectUri: 'http://localhost:4200/callback',
    scopes: [
      'user-read-private',
      'user-read-email',
      'user-top-read',
      'playlist-read-private',
      'playlist-read-collaborative',
    ],
  },
  tmdb: {
    apiKey: 'YOUR_TMDB_BEARER_TOKEN',
    baseUrl: 'https://api.themoviedb.org/3',
    imageBaseUrl: 'https://image.tmdb.org/t/p',
  },
  anthropic: {
    apiKey: '', // Leave empty to disable LLM features
    model: 'claude-haiku-4-5-20251001',
  },
  minMovieRating: 6.0,
};
```
