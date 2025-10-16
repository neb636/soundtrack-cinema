import { Component, ChangeDetectionStrategy, inject, resource } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApplicationStateService } from '../../services/application-state/application-state.service';
import { TmdbService } from '../../services/tmdb-api/tmdb-api.service';

@Component({
  selector: 'selected-song-page',
  styleUrls: ['./selected-song-page.component.css'],
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <section class="results-section">
    <!-- Selected Song Display -->
    <div class="selected-song">
      <h2 class="section-title">Selected Song</h2>
      <div class="selected-song-card">
        @if (selectedSong()!.albumImage) {
          <img
            [src]="selectedSong()!.albumImage"
            [alt]="selectedSong()!.name"
            class="selected-song-image"
          />
        }
        <div class="selected-song-info">
          <h3 class="selected-song-name">{{ selectedSong()!.name }}</h3>
          <p class="selected-song-artists">{{ selectedSong()!.artists.join(', ') }}</p>
          <button (click)="applicationStateService.clearSelection()" class="change-song-button">
            Change Song
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    @if (moviesResource.isLoading()) {
      <div class="loading">
        <div class="spinner"></div>
        <p>Finding movies with this song...</p>
      </div>
    }

    <!-- Movie Results -->
    @if (
      !moviesResource.isLoading() && moviesResource.value() && moviesResource.value()!.length > 0
    ) {
      <div class="movie-results">
        <h2 class="section-title">Recommended Movies</h2>
        <div class="movie-grid">
          @for (movie of moviesResource.value()!; track movie.id) {
            <div class="movie-card">
              @if (movie.posterPath) {
                <img
                  [src]="tmdbService.getImageUrl(movie.posterPath, 'w500')"
                  [alt]="movie.title"
                  class="movie-poster"
                />
              } @else {
                <div class="movie-poster-placeholder">
                  <span>No Image</span>
                </div>
              }
              <div class="movie-info">
                <h3 class="movie-title">{{ movie.title }}</h3>
                <div class="movie-meta">
                  <span class="movie-rating">⭐ {{ movie.rating.toFixed(1) }}</span>
                  @if (movie.releaseDate) {
                    <span class="movie-year">{{ movie.releaseDate.split('-')[0] }}</span>
                  }
                </div>
                @if (movie.overview) {
                  <p class="movie-overview">{{ movie.overview }}</p>
                }
              </div>
            </div>
          }
        </div>
      </div>
    }

    <!-- No Results -->
    @if (!moviesResource.isLoading() && moviesResource.value()?.length === 0) {
      <div class="no-results">
        <p>No movies found featuring this song. Try another song!</p>
      </div>
    }
  </section>`,
})
export class SelectedSongPageComponent {
  applicationStateService = inject(ApplicationStateService);
  tmdbService = inject(TmdbService);

  selectedSong = this.applicationStateService.selectedSong.asReadonly();

  moviesResource = resource({
    params: () => ({
      songName: this.selectedSong()?.name,
      artistName: this.selectedSong()?.artists[0],
    }),
    loader: async ({ params: { songName, artistName }, abortSignal }) => {
      return songName
        ? this.tmdbService.searchMovies(`${songName} ${artistName}`, abortSignal)
        : [];
    },
  });
}
