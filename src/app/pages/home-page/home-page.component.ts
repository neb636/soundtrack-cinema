import { Component, ChangeDetectionStrategy, inject, resource } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TmdbApiService } from '../../common/services/tmdb-api/tmdb-api.service';
import { MovieCardComponent } from '../../common/components/movie-card/movie-card.component';

@Component({
  selector: 'home-page',
  styleUrls: ['./home-page.component.css'],
  imports: [CommonModule, MovieCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<section class="home-page">
    <h1 class="home-page__title">Popular Movies</h1>

    <!-- Loading State -->
    @if (moviesResource.isLoading()) {
      <div class="home-page__loading">
        <div class="home-page__spinner"></div>
        <p>Loading popular movies...</p>
      </div>
    }

    <!-- Movie Results -->
    @if (
      !moviesResource.isLoading() && moviesResource.value() && moviesResource.value()!.length > 0
    ) {
      <div class="home-page__movie-results">
        <div class="home-page__movie-grid">
          @for (movie of moviesResource.value()!; track movie.id) {
            <movie-card [movie]="movie"></movie-card>
          }
        </div>
      </div>
    }

    <!-- Error State -->
    @if (!moviesResource.isLoading() && moviesResource.error()) {
      <div class="home-page__error">
        <p>Failed to load popular movies. Please try again later.</p>
      </div>
    }
  </section>`,
})
export class HomePageComponent {
  tmdbService = inject(TmdbApiService);

  moviesResource = resource({
    loader: async ({ abortSignal }) => {
      return this.tmdbService.getPopularMovies();
    },
  });
}
