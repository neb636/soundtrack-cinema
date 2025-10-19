import { Component, ChangeDetectionStrategy, inject, resource } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LegacySpotifyApiService } from '../../common/services/legacy-spotify-api/legacy-spotify-api.service';
import { ApplicationStateService } from '../../common/services/application-state/application-state.service';
import { SongCardComponent } from '../../common/components/song-card/song-card.component';

@Component({
  selector: 'explore-page',
  styleUrls: ['./explore-page.component.css'],
  imports: [CommonModule, SongCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<section class="explore-page">
    
    @if (songSearchResource.isLoading()) {
      <div class="explore-page__search-loading">Searching...</div>
    }

    @if (songSearchResource.value()?.length) {
      <section class="explore-page__results-section">
        <h2 class="explore-page__section-title">Select a Song</h2>
        <div class="explore-page__song-grid">
          @for (song of songSearchResource.value(); track song.id) {
            <song-card [song]="song" (click)="applicationStateService.selectSong(song)"></song-card>
          }
        </div>
      </section>
    }
  </section>`,
})
export class ExplorePageComponent {
  spotifyService = inject(LegacySpotifyApiService);
  applicationStateService = inject(ApplicationStateService);

  debouncedSearchQuery = this.applicationStateService.debouncedSearchQuery;

  songSearchResource = resource({
    params: () => ({ query: this.debouncedSearchQuery() }),
    loader: async ({ params: { query }, abortSignal }) => {
      return query.trim() ? this.spotifyService.searchTracks(query, abortSignal) : [];
    },
  });
}
