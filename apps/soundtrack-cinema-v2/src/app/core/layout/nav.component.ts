import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { AuthStatus, SpotifyUser } from '../../../../spec/contracts/types';

/** Minimal local auth state placeholder — replaced when AuthStateService is wired in Task-013 */
interface LocalAuthState {
  status: AuthStatus;
  user: SpotifyUser | null;
}

@Component({
  selector: 'app-nav',
  imports: [RouterLink],
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.css',
})
export class NavComponent {
  /** Placeholder until AuthStateService is injected in Task-013 */
  readonly authState = signal<LocalAuthState>({
    status: 'unauthenticated',
    user: null,
  });

  readonly isAuthenticated = computed(
    () => this.authState().status === 'authenticated'
  );

  readonly user = computed(() => this.authState().user);
}
