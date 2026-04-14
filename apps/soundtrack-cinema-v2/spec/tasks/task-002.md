# Task-002 — App Shell, Routing, Layout & Environment

**Assigned Agent:** B  
**Wave:** 1 (no dependencies)

---

## Goal

Set up the Angular app shell: global routing configuration, the top-level layout
(shell component with nav bar), global CSS design tokens, and environment files.
This produces the scaffolding that all feature pages plug into.

---

## Inputs

- `spec/contracts/types.ts` — for `Environment` interface
- `spec/contracts/env.md` — for environment variable template

---

## Outputs

All files listed under **File Ownership** below.

---

## File Ownership

```
src/
  styles.css                              ← global design tokens + resets
  environments/
    environment.ts                        ← dev environment (DO NOT COMMIT secrets)
    environment.prod.ts                   ← prod environment skeleton
  app/
    app.ts                                ← update: add RouterOutlet import
    app.html                              ← update: <app-shell> wrapper
    app.css                               ← minimal (shell handles layout)
    app.config.ts                         ← STUB only: leave providers array minimal;
                                            Task-013 will wire full providers
    app.routes.ts                         ← define all route paths (lazy-loaded stubs)
    core/
      layout/
        shell.component.ts/.html/.css     ← top-level layout with <router-outlet>
        nav.component.ts/.html/.css       ← navigation bar
        index.ts                          ← re-exports
```

---

## Implementation Details

### `src/styles.css`

Define all CSS custom properties (design tokens) plus global resets:

```css
/* Design tokens */
:root {
  --color-bg-primary: #0d1117;
  --color-bg-secondary: #161b22;
  --color-bg-card: #1c2128;
  --color-accent: #f5a623;
  --color-accent-hover: #fbbf24;
  --color-text-primary: #e6edf3;
  --color-text-secondary: #8b949e;
  --color-border: #30363d;
  --color-success: #3fb950;
  --color-error: #f85149;
  --color-spotify: #1db954;
  --border-radius-sm: 4px;
  --border-radius-md: 8px;
  --border-radius-lg: 16px;
  --shadow-card: 0 4px 24px rgba(0, 0, 0, 0.4);
  --font-family: 'Inter', system-ui, sans-serif;
  --transition-fast: 150ms ease;
  --transition-base: 250ms ease;
  --nav-height: 64px;
  --max-content-width: 1280px;
}

/* Global reset */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; }
body {
  font-family: var(--font-family);
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  line-height: 1.6;
}
a { color: var(--color-accent); text-decoration: none; }
a:hover { color: var(--color-accent-hover); }
img { display: block; max-width: 100%; }

/* Skip-to-content link */
.skip-link {
  position: absolute;
  top: -100%;
  left: 0;
  background: var(--color-accent);
  color: #000;
  padding: 8px 16px;
  z-index: 9999;
  border-radius: var(--border-radius-md);
}
.skip-link:focus { top: 8px; left: 8px; }
```

### `src/environments/environment.ts`

Use the `Environment` type from `spec/contracts/types.ts`:

```typescript
import type { Environment } from '../../spec/contracts/types';

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
    apiKey: '',
    model: 'claude-haiku-4-5-20251001',
  },
  minMovieRating: 6.0,
};
```

### `src/app/app.routes.ts`

Define all routes using lazy loading. Feature components don't exist yet in Wave 1,
so use placeholder `loadComponent` paths that match where Task-009–012 will put them:

```typescript
export const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/home/home.component').then(m => m.HomeComponent),
      },
      {
        path: 'track/:id',
        loadComponent: () =>
          import('./features/track-detail/track-detail.component')
            .then(m => m.TrackDetailComponent),
      },
      {
        path: 'movie/:id',
        loadComponent: () =>
          import('./features/movie-detail/movie-detail.component')
            .then(m => m.MovieDetailComponent),
      },
      {
        path: 'playlist',
        loadComponent: () =>
          import('./features/playlist/playlist.component')
            .then(m => m.PlaylistComponent),
      },
    ],
  },
  {
    path: 'callback',
    loadComponent: () =>
      import('./features/callback/callback.component')
        .then(m => m.CallbackComponent),
  },
  { path: '**', redirectTo: '' },
];
```

### `src/app/core/layout/shell.component`

- Full-height layout: nav at top, `<main>` with `<router-outlet>` below
- Includes skip-to-main-content link for accessibility
- `<main id="main-content">` as ARIA landmark

```html
<a class="skip-link" href="#main-content">Skip to main content</a>
<app-nav />
<main id="main-content" role="main">
  <router-outlet />
</main>
```

### `src/app/core/layout/nav.component`

- Logo/brand on left: "🎬 Soundtrack Cinema" (links to `/`)
- Right side: "Connect Spotify" button (unauthenticated) OR user avatar + nav links
- Read auth state via `AuthState` service injection (injected but null-safe — service created in Task-007)
- Links: Home, Playlists, Logout

**UX:** Nav height is `--nav-height: 64px`. Sticky positioning.
**Accessibility:** `role="navigation"`, `aria-label="Main navigation"`

---

## Acceptance Criteria

- [ ] `ng build` completes with zero errors after this task
- [ ] `src/styles.css` contains all design tokens listed in PROJECT_SPEC.md Section 2
- [ ] `src/environments/environment.ts` and `environment.prod.ts` exist and export `environment`
- [ ] Routes are defined for `/`, `/track/:id`, `/movie/:id`, `/playlist`, `/callback`
- [ ] Shell component renders nav + router-outlet
- [ ] Nav renders correctly with "Connect Spotify" placeholder (auth state not wired yet)
- [ ] Skip-to-content link present and works with keyboard
- [ ] No TypeScript errors

---

## Notes

- `app.config.ts`: Add only `provideRouter(routes)` and `provideBrowserGlobalErrorListeners()` for now.
  Task-013 will add `provideHttpClient()`, interceptors, and CDK providers.
- If `AuthState` service doesn't exist yet (Task-007 runs in Wave 2), inject it with
  `@Optional()` or use a simple `signal(null)` placeholder that Task-013 replaces.
  Better approach: define a minimal `AuthState` interface locally in nav and update in Task-013.
