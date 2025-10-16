import { Component, ChangeDetectionStrategy, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Movie, TmdbService } from '../../services/tmdb-api/tmdb-api.service';

@Component({
  selector: 'movie-card',
  styleUrls: ['./movie-card.component.css'],
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="movie-card">
  @if (movie().posterPath) {
    <img
      [src]="tmdbService.getImageUrl(movie().posterPath, 'w500')"
      [alt]="movie().title"
      class="movie-card__poster"
    />
  } @else {
    <div class="movie-card__poster-placeholder">
      <span>No Image</span>
    </div>
  }
  <div class="movie-card__info">
    <h3 class="movie-card__title">{{ movie().title }}</h3>
    <div class="movie-card__meta">
      <span class="movie-card__rating">⭐ {{ movie().rating.toFixed(1) }}</span>
      @if (movie().releaseDate) {
        <span class="movie-card__year">{{ movie().releaseDate.split('-')[0] }}</span>
      }
    </div>
    @if (movie().overview) {
      <p class="movie-card__overview">{{ movie().overview }}</p>
    }
  </div>
</div>`,
})
export class MovieCardComponent {
  tmdbService = inject(TmdbService);

  movie = input.required<Movie>();

}
