import { ApplicationConfig, importProvidersFrom, provideBrowserGlobalErrorListeners } from '@angular/core';
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
