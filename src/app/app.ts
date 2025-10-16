import { ChangeDetectionStrategy, Component, effect, inject, resource } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SpotifyService } from './services/spotify-api/spotify-api.service';
import { TmdbService } from './services/tmdb-api/tmdb-api.service';
import { ApplicationStateService } from './services/application-state/application-state.service';
import { SongCardComponent } from './components/song-card/song-card.component';
import { SelectedSongPageComponent } from './components/selected-song-page/selected-song-page.component';
import { useDebouncedSignal } from './composition-functions/use-debounced-signal';

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule, SongCardComponent, SelectedSongPageComponent],
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app-root__container">
      <!-- Header -->
      <header class="app-root__header">
        <div class="app-root__header-content">
          <h1 class="app-root__title">🎬 Soundtrack Cinema</h1>
          <p class="app-root__tagline">Discover movies featuring your favorite songs</p>
        </div>
      </header>

      <!-- Main Content -->
      <main class="app-root__main-content">
        <!-- Search Section -->
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

        @if (selectedSong()) {
          <selected-song-page></selected-song-page>
        } @else if (songSearchResource.value()?.length) {
          <section class="app-root__results-section">
            <h2 class="app-root__section-title">Select a Song</h2>
            <div class="app-root__song-grid">
              @for (song of songSearchResource.value(); track song.id) {
                <song-card
                  [song]="song"
                  (click)="applicationStateService.selectSong(song)"
                ></song-card>
              }
            </div>
          </section>
        }
      </main>

      <!-- Footer -->
      <footer class="app-root__footer">
        <p>Powered by Spotify & TMDb APIs</p>
      </footer>
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
