import { Component, ChangeDetectionStrategy, inject, resource } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApplicationStateService } from '../../common/services/application-state/application-state.service';
import { TmdbService } from '../../common/services/tmdb-api/tmdb-api.service';
import { MovieCardComponent } from '../../common/components/movie-card/movie-card.component';
import { useParameter } from '../../common/composition-functions/use-activated-route';

@Component({
  selector: 'selected-song-page',
  styleUrls: ['./selected-song-page.component.css'],
  imports: [CommonModule, MovieCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<section class="selected-song-page">
    <!-- Selected Song Display -->
    <div class="selected-song-page__selected-song">
      <h2 class="selected-song-page__title">Selected Song</h2>
      <div class="selected-song-page__selected-song-card">
        @if (selectedSong()!.albumImage) {
          <img
            [src]="selectedSong()!.albumImage"
            [alt]="selectedSong()!.name"
            class="selected-song-page__selected-song-image"
          />
        }
        <div class="selected-song-page__selected-song-info">
          <h3 class="selected-song-page__selected-song-name">{{ selectedSong()!.name }}</h3>
          <p class="selected-song-page__selected-song-artists">{{ selectedSong()!.artists.join(', ') }}</p>
          <button (click)="applicationStateService.clearSelection()" class="selected-song-page__change-song-button">
            Change Song
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    @if (moviesResource.isLoading()) {
      <div class="selected-song-page__loading">
        <div class="selected-song-page__spinner"></div>
        <p>Finding movies with this song...</p>
      </div>
    }

    <!-- Movie Results -->
    @if (
      !moviesResource.isLoading() && moviesResource.value() && moviesResource.value()!.length > 0
    ) {
      <div class="selected-song-page__movie-results">
        <h2 class="selected-song-page__title">Recommended Movies</h2>
        <div class="selected-song-page__movie-grid">
          @for (movie of moviesResource.value()!; track movie.id) {
            <movie-card [movie]="movie"></movie-card>
          }
        </div>
      </div>
    }

    <!-- No Results -->
    @if (!moviesResource.isLoading() && moviesResource.value()?.length === 0) {
      <div class="selected-song-page__no-results">
        <p>No movies found featuring this song. Try another song!</p>
      </div>
    }
  </section>`,
})
export class SelectedSongPageComponent {
  applicationStateService = inject(ApplicationStateService);
  tmdbService = inject(TmdbService);

  selectedSong = this.applicationStateService.selectedSong.asReadonly();

  selectedSongName = useParameter('songName')

  moviesResource = resource({
    params: () => ({
      songName: this.selectedSong()?.name,
      artistName: this.selectedSong()?.artists[0],
    }),
    loader: async ({ params: { songName }, abortSignal }) => {
      return songName
        ? this.tmdbService.searchMovies(songName, abortSignal)
        : [];
    },
  });
}
