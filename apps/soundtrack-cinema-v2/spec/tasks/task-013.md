# Task-013 — Integration Wiring & Final Configuration

**Assigned Agent:** M  
**Wave:** 4 (depends on ALL prior tasks)

---

## Goal

Wire together all modules produced by previous tasks: register HTTP providers and
interceptors, provide the environment injection token, register Angular CDK providers,
and finalize the app routes. This is the integration task that makes the app boot
and work end-to-end.

---

## Inputs

All prior task outputs:
- Task-002: `ShellComponent`, `app.routes.ts` (update routes)
- Task-003: `spotifyAuthInterceptor`, `SpotifyAuthService`, `authGuard`
- Task-004: `spotifyAuthInterceptor`
- Task-005: `ENVIRONMENT_TOKEN`
- Task-007: `AuthStateService` (wire into nav via shell)
- All feature components exist at their expected lazy-load paths

---

## File Ownership

Agent M may ONLY modify these files:
```
src/app/app.config.ts          ← add all providers
src/app/app.routes.ts          ← final route guards
src/app/app.spec.ts            ← smoke test
```

Agent M must NOT create new files or modify files owned by other agents.

---

## Implementation Details

### `src/app/app.config.ts` (final version)

```typescript
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { A11yModule } from '@angular/cdk/a11y';

import { routes } from './app.routes';
import { spotifyAuthInterceptor } from './services/spotify/spotify-http.interceptor';
import { ENVIRONMENT_TOKEN } from './core/tokens/environment.token';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),

    // Router: enable component input binding so route params can use @Input()
    provideRouter(routes, withComponentInputBinding()),

    // HTTP client with functional interceptors
    provideHttpClient(
      withFetch(),
      withInterceptors([spotifyAuthInterceptor])
    ),

    // Environment injection token
    { provide: ENVIRONMENT_TOKEN, useValue: environment },

    // Angular CDK providers (needed for LiveAnnouncer, FocusTrap)
    importProvidersFrom(A11yModule),
  ],
};
```

Note: `importProvidersFrom` must be imported from `@angular/core`.

### `src/app/app.routes.ts` (final version)

The `/playlist` route does NOT use `authGuard`. `PlaylistComponent` handles unauthenticated
users in-component by showing a "Connect Spotify" prompt (see Task-012 acceptance criteria:
"Unauthenticated users see 'Connect Spotify' prompt (not a redirect)"). A guard would redirect
to `/` which contradicts that requirement.

```typescript
import { Routes } from '@angular/router';
import { ShellComponent } from './core/layout/shell.component';

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

### `src/app/app.spec.ts` (smoke test)

```typescript
import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { appConfig } from './app.config';
import { provideRouter } from '@angular/router';

describe('App (smoke test)', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render router-outlet', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });
});
```

---

## Post-Integration Smoke Test Checklist

After completing this task, run the following manual checks:

1. **Build:** `ng build` — zero errors, zero warnings about missing providers
2. **Serve:** `ng serve` — app starts at `http://localhost:4200`
3. **Home page loads:** Dark background, nav bar visible, search bar visible
4. **Popular movies:** Unauthenticated home shows movie grid (TMDB popular)
5. **Connect Spotify:** Button visible and clickable (redirects to Spotify)
6. **Routing:** Navigate directly to `/track/3n3Ppam7vgaVa1iaRUIOKE` — track detail page loads (skeleton if no Spotify auth)
7. **Movie detail:** Navigate to `/movie/550` — loads Fight Club movie page
8. **Playlist unauthenticated:** `/playlist` shows "Connect Spotify" prompt (not a redirect)
9. **Callback route:** `/callback` renders (shows spinner or auth page)
10. **No console errors** in browser devtools

---

## Acceptance Criteria

- [ ] `ng build` completes with zero errors after this task
- [ ] `provideHttpClient(withFetch(), withInterceptors([spotifyAuthInterceptor]))` registered
- [ ] `ENVIRONMENT_TOKEN` provided with `environment` value
- [ ] `importProvidersFrom(A11yModule)` registered (enables `LiveAnnouncer` injection)
- [ ] `/playlist` route is accessible without auth guard (in-component prompt handles unauthenticated state)
- [ ] `withComponentInputBinding()` enabled on router
- [ ] `app.spec.ts` smoke test passes (`ng test`)
- [ ] `ng serve` starts without runtime errors
- [ ] App loads at `http://localhost:4200` with dark theme
- [ ] All 5 routes resolve without "cannot match any routes" errors
