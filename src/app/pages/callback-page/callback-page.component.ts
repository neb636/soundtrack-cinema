import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SpotifyService } from '../../common/services/spotify/spotify.service';

@Component({
  selector: 'callback-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="callback-page">
    <div class="callback-page__spinner"></div>
    <p class="callback-page__message">Completing login...</p>
  </div>`,
  styles: [`
    .callback-page {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .callback-page__spinner {
      width: 3rem;
      height: 3rem;
      border: 4px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .callback-page__message {
      margin-top: 1.5rem;
      color: white;
      font-size: 1.125rem;
      font-weight: 500;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `],
})
export class CallbackPageComponent implements OnInit {
  private readonly spotifyService = inject(SpotifyService);
  private readonly router = inject(Router);

  ngOnInit() {
    this.handleCallback();
  }

  private async handleCallback() {
    try {
      // Initialize the SDK - it will handle the OAuth callback automatically
      const sdk = await this.spotifyService.authenticate();
      
      // Verify authentication by fetching user profile
      await sdk.currentUser.profile();
      
      // Redirect to explore page after successful authentication
      this.router.navigate(['/explore']);
    } catch (error) {
      console.error('Authentication callback failed:', error);
      this.router.navigate(['/login']);
    }
  }
}
