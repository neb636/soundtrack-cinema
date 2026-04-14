import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LiveAnnouncer } from '@angular/cdk/a11y';

import { SpotifyAuthService } from '../../core/auth/spotify-auth.service';

@Component({
  selector: 'app-callback',
  standalone: true,
  templateUrl: './callback.component.html',
  styleUrl: './callback.component.css',
})
export class CallbackComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(SpotifyAuthService);
  private readonly liveAnnouncer = inject(LiveAnnouncer);

  readonly statusMessage = signal('Connecting to Spotify...');
  readonly hasError = signal(false);

  async ngOnInit(): Promise<void> {
    await this.liveAnnouncer.announce('Connecting to Spotify...', 'polite');

    const params = this.route.snapshot.queryParamMap;
    const code = params.get('code');
    const state = params.get('state');
    const error = params.get('error');

    if (error) {
      await this.handleError(`Spotify authorization denied: ${error}`);
      return;
    }

    if (!code || !state) {
      await this.handleError('Missing required OAuth parameters.');
      return;
    }

    try {
      await this.authService.handleCallback(code, state);

      this.statusMessage.set('Successfully connected to Spotify!');
      await this.liveAnnouncer.announce('Successfully connected to Spotify!', 'polite');

      const redirectUrl = sessionStorage.getItem('sc_redirect_after_login') ?? '/';
      sessionStorage.removeItem('sc_redirect_after_login');

      await this.router.navigateByUrl(redirectUrl);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Authentication failed.';
      await this.handleError(message);
    }
  }

  private async handleError(message: string): Promise<void> {
    this.hasError.set(true);
    this.statusMessage.set(message);
    await this.liveAnnouncer.announce(message, 'assertive');
    await this.router.navigate(['/'], { queryParams: { error: 'auth_failed' } });
  }
}
