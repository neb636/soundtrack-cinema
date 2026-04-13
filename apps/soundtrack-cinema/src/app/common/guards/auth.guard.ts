import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { SpotifyService } from '../services/spotify/spotify.service';

export const authGuard: CanActivateFn = () => {
  const spotifyService = inject(SpotifyService);
  const router = inject(Router);

  if (spotifyService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
