import { Component, ChangeDetectionStrategy, inject, resource } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpotifyService } from '../../common/services/spotify/spotify.service';
import { mapSpotifyTrackFromSDK } from '../../common/services/spotify/mapper';
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

    @if (songSearchResource.error()) {
      <div class="explore-page__error">
        Error loading tracks. Please try again.
      </div>
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
  spotifyService = inject(SpotifyService);
  applicationStateService = inject(ApplicationStateService);

  debouncedSearchQuery = this.applicationStateService.debouncedSearchQuery;

  songSearchResource = resource({
    params: () => ({ query: this.debouncedSearchQuery() }),
    loader: async ({ params: { query } }) => {
      if (!query.trim()) {
        return [];
      }

      try {
        // Ensure SDK is initialized
        await this.spotifyService.authenticate();
        
        const result = await this.spotifyService.paginatedSearch({
          query,
          types: ['track'],
          offset: 0,
          limit: 10,
        });

        return result.tracks?.items.map(mapSpotifyTrackFromSDK) ?? [];
      } catch (error) {
        console.error('Error searching tracks:', error);
        return [];
      }
    },
  });
}
