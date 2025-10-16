import { ChangeDetectionStrategy, Component, inject, resource } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SpotifyService } from './services/spotify-api/spotify-api.service';
import { TmdbService } from './services/tmdb-api/tmdb-api.service';
import { ApplicationStateService } from './services/application-state/application-state.service';
import { useDebouncedSignal } from './common/composition-functions/use-debounced-signal';
import { AppHeaderComponent } from './common/components/app-header/app-header.component';
import { AppFooterComponent } from './common/components/app-footer/app-footer.component';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, FormsModule, AppHeaderComponent, AppFooterComponent],
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app-root__container">
      <app-header></app-header>

      <!-- Main Content -->
      <main class="app-root__main-content">
        <section class="app-root__search-section">
          <div class="app-root__search-container">
            <input
              type="text"
              [ngModel]="searchQuery()"
              (ngModelChange)="applicationStateService.setSearchQuery($event)"
              placeholder="Search for a song..."
              class="app-root__search-input"
            />
            @if (songSearchResource.isLoading()) {
              <div class="app-root__search-loading">Searching...</div>
            }
          </div>

          <!-- Error Message -->
          <!-- @if (errorMessage()) {
            <div class="error-message">
              {{ errorMessage() }}
            </div>
          } -->
        </section>

        <section class="app-root__route-wrapper">
          <router-outlet></router-outlet>
        </section>
      </main>

      <app-footer></app-footer>
    </div>
  `,
})
export class App {
  spotifyService = inject(SpotifyService);
  tmdbService = inject(TmdbService);
  applicationStateService = inject(ApplicationStateService);

  searchQuery = this.applicationStateService.searchQuery.asReadonly();
  selectedSong = this.applicationStateService.selectedSong.asReadonly();
  debouncedSearchQuery = useDebouncedSignal(this.searchQuery, 600);

  songSearchResource = resource({
    params: () => ({ query: this.debouncedSearchQuery() }),
    loader: async ({ params: { query }, abortSignal }) => {
      return query.trim() ? this.spotifyService.searchTracks(query, abortSignal) : [];
    },
  });
}
