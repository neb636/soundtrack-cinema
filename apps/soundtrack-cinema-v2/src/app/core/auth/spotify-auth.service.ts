import { Injectable, Signal, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { SpotifyUser } from '../../../../spec/contracts/types';
import { environment } from '../../../environments/environment';
import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  storePKCEState,
  consumePKCEState,
} from './pkce.util';

const SPOTIFY_AUTHORIZE_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_ME_URL = 'https://api.spotify.com/v1/me';

const TOKEN_KEY = 'sc_access_token';
const REFRESH_TOKEN_KEY = 'sc_refresh_token';
const EXPIRES_AT_KEY = 'sc_expires_at';

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

@Injectable({ providedIn: 'root' })
export class SpotifyAuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  // Internal state signals — written only by action methods
  private readonly _accessToken = signal<string | null>(
    sessionStorage.getItem(TOKEN_KEY)
  );
  private readonly _refreshToken = signal<string | null>(
    sessionStorage.getItem(REFRESH_TOKEN_KEY)
  );
  private readonly _expiresAt = signal<number | null>(
    this.readExpiresAt()
  );
  private readonly _user = signal<SpotifyUser | null>(null);
  private readonly _isAuthenticated = signal<boolean>(false);

  // Exposed signals
  /** Access token signal — consumed by the HTTP interceptor */
  readonly accessToken: Signal<string | null> = this._accessToken.asReadonly();
  readonly isAuthenticated: Signal<boolean> = this._isAuthenticated.asReadonly();
  readonly user: Signal<SpotifyUser | null> = this._user.asReadonly();

  constructor() {
    this.restoreSession();
  }

  /** Initiates PKCE login: generates verifier+challenge, redirects to Spotify */
  async login(): Promise<void> {
    const verifier = await generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);
    const state = generateState();

    storePKCEState({ codeVerifier: verifier, state });

    const params = new URLSearchParams({
      client_id: environment.spotify.clientId,
      response_type: 'code',
      redirect_uri: environment.spotify.redirectUri,
      scope: environment.spotify.scopes.join(' '),
      state,
      code_challenge_method: 'S256',
      code_challenge: challenge,
    });

    window.location.href = `${SPOTIFY_AUTHORIZE_URL}?${params.toString()}`;
  }

  /**
   * Called by CallbackComponent: exchanges code for tokens,
   * fetches user profile, and updates auth state.
   */
  async handleCallback(code: string, state: string): Promise<void> {
    const pkceState = consumePKCEState();

    if (!pkceState) {
      throw new Error('No PKCE state found in sessionStorage. Possible CSRF attack.');
    }

    if (pkceState.state !== state) {
      throw new Error('State mismatch. Possible CSRF attack.');
    }

    const body = new HttpParams()
      .set('grant_type', 'authorization_code')
      .set('code', code)
      .set('redirect_uri', environment.spotify.redirectUri)
      .set('client_id', environment.spotify.clientId)
      .set('code_verifier', pkceState.codeVerifier);

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
    });

    const tokenResponse = await firstValueFrom(
      this.http.post<TokenResponse>(SPOTIFY_TOKEN_URL, body.toString(), { headers })
    );

    this.storeTokens(tokenResponse);

    const userProfile = await this.fetchUserProfile(tokenResponse.access_token);
    this._user.set(userProfile);
    this._isAuthenticated.set(true);
  }

  /** Refreshes the access token using the stored refresh_token */
  async refreshToken(): Promise<void> {
    const refreshToken = this._refreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available.');
    }

    const body = new HttpParams()
      .set('grant_type', 'refresh_token')
      .set('refresh_token', refreshToken)
      .set('client_id', environment.spotify.clientId);

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
    });

    const tokenResponse = await firstValueFrom(
      this.http.post<TokenResponse>(SPOTIFY_TOKEN_URL, body.toString(), { headers })
    );

    this.storeTokens(tokenResponse);
  }

  /** Clears all tokens and navigates to home */
  logout(): void {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(EXPIRES_AT_KEY);

    this._accessToken.set(null);
    this._refreshToken.set(null);
    this._expiresAt.set(null);
    this._user.set(null);
    this._isAuthenticated.set(false);

    this.router.navigate(['/']);
  }

  /** Returns the current access token, refreshing if expired */
  async getValidToken(): Promise<string | null> {
    const expiresAt = this._expiresAt();
    const token = this._accessToken();

    if (!token) return null;

    const isExpired = expiresAt !== null && Date.now() >= expiresAt;
    if (isExpired) {
      await this.refreshToken();
      return this._accessToken();
    }

    return token;
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private storeTokens(response: TokenResponse): void {
    const expiresAt = Date.now() + response.expires_in * 1000;

    sessionStorage.setItem(TOKEN_KEY, response.access_token);
    sessionStorage.setItem(EXPIRES_AT_KEY, String(expiresAt));

    this._accessToken.set(response.access_token);
    this._expiresAt.set(expiresAt);

    if (response.refresh_token) {
      sessionStorage.setItem(REFRESH_TOKEN_KEY, response.refresh_token);
      this._refreshToken.set(response.refresh_token);
    }
  }

  private async fetchUserProfile(accessToken: string): Promise<SpotifyUser> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
    });
    return firstValueFrom(
      this.http.get<SpotifyUser>(SPOTIFY_ME_URL, { headers })
    );
  }

  private readExpiresAt(): number | null {
    const raw = sessionStorage.getItem(EXPIRES_AT_KEY);
    if (!raw) return null;
    const parsed = Number(raw);
    return isNaN(parsed) ? null : parsed;
  }

  /**
   * On construction, restore session if a non-expired token exists.
   * We cannot re-fetch the user profile without making an HTTP call here
   * (no token exchange happened), so isAuthenticated remains false until
   * the next action. The HTTP interceptor reads accessToken directly.
   */
  private restoreSession(): void {
    const token = this._accessToken();
    const expiresAt = this._expiresAt();

    if (token && expiresAt && Date.now() < expiresAt) {
      this._isAuthenticated.set(true);
    } else if (token && expiresAt && Date.now() >= expiresAt) {
      // Token expired — clear it so consumers don't use a stale token
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(EXPIRES_AT_KEY);
      this._accessToken.set(null);
      this._expiresAt.set(null);
    }
  }
}
