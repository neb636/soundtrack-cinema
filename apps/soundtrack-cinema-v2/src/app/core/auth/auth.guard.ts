import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { SpotifyAuthService } from './spotify-auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const authService = inject(SpotifyAuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Store intended URL in sessionStorage for post-login redirect
  sessionStorage.setItem('sc_redirect_after_login', state.url);
  router.navigate(['/']);
  return false;
};
