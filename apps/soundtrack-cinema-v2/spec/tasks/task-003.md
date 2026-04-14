# Task-003 — Spotify OAuth PKCE Auth Service & Callback

**Assigned Agent:** C  
**Wave:** 1 (no dependencies)

---

## Goal

Implement Spotify OAuth 2.0 Authorization Code with PKCE flow entirely client-side.
Produces the auth service, PKCE utilities, auth guard, and the OAuth callback component.

---

## Inputs

- `spec/contracts/types.ts` — `PKCEState`, `SpotifyUser`, `AuthState`, `AuthStatus`
- `spec/contracts/api.yaml` — `/api/token` endpoint shape
- `spec/contracts/env.md` — `environment.spotify` config

---

## File Ownership

```
src/app/
  core/
    auth/
      spotify-auth.service.ts      ← main auth service
      auth.guard.ts                ← route guard for protected routes
      pkce.util.ts                 ← PKCE crypto utilities
      index.ts                     ← re-exports
  features/
    callback/
      callback.component.ts        ← OAuth redirect handler
      callback.component.html
      callback.component.css
```

---

## Implementation Details

### `pkce.util.ts`

Pure functions, no Angular injection. Uses the Web Crypto API (available in all modern browsers):

```typescript
/** Generates a cryptographically random PKCE code verifier (43-128 chars) */
export async function generateCodeVerifier(): Promise<string>

/** Derives the S256 code challenge from a verifier */
export async function generateCodeChallenge(verifier: string): Promise<string>

/** Generates a random state string for CSRF protection */
export function generateState(): string

/** Stores PKCEState in sessionStorage under key 'sc_pkce' */
export function storePKCEState(state: PKCEState): void

/** Retrieves and removes PKCEState from sessionStorage */
export function consumePKCEState(): PKCEState | null
```

Implementation notes:
- `generateCodeVerifier`: `crypto.getRandomValues(new Uint8Array(32))` → base64url
- `generateCodeChallenge`: `crypto.subtle.digest('SHA-256', encoder.encode(verifier))` → base64url
- Base64url = base64 with `+`→`-`, `/`→`_`, `=` removed
- Store in `sessionStorage` (not `localStorage`) — cleared on tab close

### `spotify-auth.service.ts`

Injectable service (`providedIn: 'root'`). Wraps PKCE flow and token management.
**This service owns OAuth mechanics only. Auth state (user, status, isAuthenticated)
is owned by `AuthStateService` (Task-007). `SpotifyAuthService` injects `AuthStateService`
and calls its action methods when auth state changes — this avoids two separate sources
of truth for the same data.**

```typescript
@Injectable({ providedIn: 'root' })
export class SpotifyAuthService {
  private authState = inject(AuthStateService);  // single source of truth for auth state

  // Token storage only — NOT public signals. Consumers read user/isAuthenticated from AuthStateService.
  // accessToken is exposed here because the HTTP interceptor needs it directly.
  readonly accessToken: Signal<string | null>

  /** Initiates PKCE login: generates verifier+challenge, redirects to Spotify */
  async login(): Promise<void>

  /** Called by CallbackComponent: exchanges code for tokens, then calls authState.setAuthenticated(user) */
  async handleCallback(code: string, state: string): Promise<void>

  /** Refreshes the access token using refresh_token */
  async refreshToken(): Promise<void>

  /** Clears all tokens, calls authState.setUnauthenticated(), navigates to home */
  logout(): void

  /** Returns the current access token, refreshing if expired */
  async getValidToken(): Promise<string | null>
}
```

**State delegation pattern:**
- `handleCallback` success → call `this.authState.setAuthenticated(user)`
- `handleCallback` failure → call `this.authState.setError(message)`
- `login()` start → call `this.authState.setAuthenticating()`
- `logout()` → call `this.authState.setUnauthenticated()`
- On construction, restore token from sessionStorage and call `setAuthenticated(user)` if valid token exists

**Consumers:** Components and other services that need auth state should inject `AuthStateService`
and read `authState.isAuthenticated`, `authState.user`, etc. The `SpotifyAuthService` is only
needed for OAuth actions (`login()`, `logout()`, `getValidToken()`).

Token storage: `sessionStorage` keys:
- `sc_access_token`
- `sc_refresh_token`
- `sc_expires_at` (Unix ms timestamp)

Authorization URL construction:
```
https://accounts.spotify.com/authorize
  ?client_id={clientId}
  &response_type=code
  &redirect_uri={redirectUri}
  &scope={scopes joined by space}
  &state={randomState}
  &code_challenge_method=S256
  &code_challenge={challenge}
```

Token exchange — POST to `https://accounts.spotify.com/api/token`:
```
grant_type=authorization_code
code={code}
redirect_uri={redirectUri}
client_id={clientId}
code_verifier={verifier}
```
Content-Type: `application/x-www-form-urlencoded`
**No Authorization header needed for PKCE** (no client secret).

### `auth.guard.ts`

Reads `isAuthenticated` from `AuthStateService` — the single source of truth for auth state.

```typescript
export const authGuard: CanActivateFn = (route, state) => {
  const authState = inject(AuthStateService);
  const router = inject(Router);
  if (authState.isAuthenticated()) return true;
  // Store intended URL in sessionStorage for post-login redirect
  sessionStorage.setItem('sc_redirect_after_login', state.url);
  router.navigate(['/']);
  return false;
};
```

### `callback.component.ts`

Standalone component at `/callback` route:

1. On `ngOnInit`, read `code` and `state` from `ActivatedRoute.queryParams`
2. Call `SpotifyAuthService.handleCallback(code, state)`
3. On success: navigate to `sessionStorage.getItem('sc_redirect_after_login') ?? '/'`
4. On error: navigate to `/` with error in query params (e.g. `?error=auth_failed`)
5. Template: centered loading spinner with "Connecting to Spotify..." text
6. Use `AriaLiveAnnouncer` from `@angular/cdk/a11y` to announce status changes

---

## Key Decisions

- **No refresh token rotation in browser** — Spotify's PKCE tokens last 1 hour.
  Implement refresh logic but keep it simple (POST with `grant_type=refresh_token`).
- **CSRF protection** — state param is verified in `handleCallback`; if it doesn't
  match what's in sessionStorage, throw an error.
- **HttpClient** — Use Angular's `HttpClient` for the token exchange POST (not `fetch`).
  Inject `HttpClient` directly in the service (not via an interceptor — interceptors
  add the auth header which we don't want on the token endpoint).

---

## Acceptance Criteria

- [ ] `ng build` completes with zero errors after this task
- [ ] `SpotifyAuthService.login()` constructs a valid Spotify authorize URL and navigates to it
- [ ] PKCE verifier and challenge are generated using Web Crypto API (no external libs)
- [ ] `handleCallback` exchanges code for tokens and stores them in `sessionStorage`
- [ ] State mismatch throws an error (CSRF protection)
- [ ] `authGuard` redirects unauthenticated users to `/`
- [ ] `CallbackComponent` shows loading spinner and announces status via ARIA live region
- [ ] Tokens are stored in `sessionStorage` (not `localStorage`)
- [ ] No TypeScript errors
