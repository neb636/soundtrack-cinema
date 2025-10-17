import { ChangeDetectionStrategy, Component, inject, resource } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpotifyApiService } from '../../common/services/spotify-api/spotify-api.service';
import { ApplicationStateService } from '../../common/services/application-state/application-state.service';
import { SongCardComponent } from '../../common/components/song-card/song-card.component';

@Component({
  selector: 'search-results-page',
  styleUrls: ['./search-results-page.component.css'],
  imports: [CommonModule, SongCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (songSearchResource.isLoading()) {
      <div class="search-results-page__search-loading">Searching...</div>
    }

    <section class="search-results-page__results-section">
      <h2 class="search-results-page__section-title">Select a Song</h2>
      <div class="search-results-page__song-grid">
        @for (song of songSearchResource.value(); track song.id) {
          <song-card [song]="song" (click)="applicationStateService.selectSong(song)"></song-card>
        }
      </div>
    </section>`,
})
export class SearchResultsPageComponent {
  spotifyService = inject(SpotifyApiService);
  applicationStateService = inject(ApplicationStateService);

  debouncedSearchQuery = this.applicationStateService.debouncedSearchQuery;

  songSearchResource = resource({
    params: () => ({ query: this.debouncedSearchQuery() }),
    loader: async ({ params: { query }, abortSignal }) => {
      return query.trim() ? this.spotifyService.searchTracks(query, abortSignal) : [];
    },
  });
}
