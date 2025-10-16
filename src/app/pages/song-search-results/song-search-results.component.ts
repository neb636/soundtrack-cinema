import { ChangeDetectionStrategy, Component, inject, resource } from '@angular/core';
import { CommonModule } from '@angular/common';
import { useDebouncedSignal } from '../../common/composition-functions/use-debounced-signal';
import { SpotifyService } from '../../common/services/spotify-api/spotify-api.service';
import { TmdbService } from '../../common/services/tmdb-api/tmdb-api.service';
import { ApplicationStateService } from '../../common/services/application-state/application-state.service';
import { SongCardComponent } from '../../common/components/song-card/song-card.component';

@Component({
  selector: 'song-search-results',
  styleUrls: ['./song-search-results.component.css'],
  imports: [CommonModule, SongCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (songSearchResource.isLoading()) {
      <div class="song-search-results__search-loading">Searching...</div>
    }

    <section class="song-search-results__results-section">
      <h2 class="song-search-results__section-title">Select a Song</h2>
      <div class="song-search-results__song-grid">
        @for (song of songSearchResource.value(); track song.id) {
          <song-card [song]="song" (click)="applicationStateService.selectSong(song)"></song-card>
        }
      </div>
    </section>`,
})
export class SongSearchResultsComponent {
  spotifyService = inject(SpotifyService);
  tmdbService = inject(TmdbService);
  applicationStateService = inject(ApplicationStateService);

  searchQuery = this.applicationStateService.searchQuery.asReadonly();

  debouncedSearchQuery = useDebouncedSignal(this.searchQuery, 600);

  songSearchResource = resource({
    params: () => ({ query: this.debouncedSearchQuery() }),
    loader: async ({ params: { query }, abortSignal }) => {
      return query.trim() ? this.spotifyService.searchTracks(query, abortSignal) : [];
    },
  });
}
