import { Injectable, computed, signal } from '@angular/core';
import type { AuthStatus, SpotifyUser } from '../../../../spec/contracts/types';

@Injectable({ providedIn: 'root' })
export class AuthStateService {

  // State
  status = signal<AuthStatus>('unauthenticated');
  user = signal<SpotifyUser | null>(null);
  error = signal<string | null>(null);

  // Derived
  isAuthenticated = computed(() => this.status() === 'authenticated');

  // Actions — called by SpotifyAuthService
  setAuthenticating(): void {
    this.status.set('authenticating');
    this.error.set(null);
  }

  setAuthenticated(user: SpotifyUser): void {
    this.user.set(user);
    this.status.set('authenticated');
    this.error.set(null);
  }

  setUnauthenticated(): void {
    this.status.set('unauthenticated');
    this.user.set(null);
  }

  setError(message: string): void {
    this.error.set(message);
    this.status.set('error');
  }
}
