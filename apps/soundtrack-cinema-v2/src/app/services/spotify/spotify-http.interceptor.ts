import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, switchMap } from 'rxjs/operators';
import { from, throwError } from 'rxjs';
import { SpotifyAuthService } from '../../core/auth/spotify-auth.service';

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
