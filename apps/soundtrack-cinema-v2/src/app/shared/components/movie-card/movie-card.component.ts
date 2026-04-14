import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MovieRecommendation } from '../../../../../spec/contracts/types';
import { TmdbImagePipe } from '../../../services/tmdb/tmdb-image.pipe';
import { RatingBadgeComponent } from '../rating-badge/rating-badge.component';

@Component({
  selector: 'app-movie-card',
  standalone: true,
  imports: [CommonModule, TmdbImagePipe, RatingBadgeComponent],
  templateUrl: './movie-card.component.html',
  styleUrl: './movie-card.component.css',
})
export class MovieCardComponent {
  @Input({ required: true }) recommendation!: MovieRecommendation;
  @Input() showSource = true;

  @Output() viewDetails = new EventEmitter<number>();

  get movie() {
    return this.recommendation.movie;
  }

  get releaseYear(): string {
    if (!this.movie.release_date) return '';
    return this.movie.release_date.substring(0, 4);
  }

  get isAiEnhanced(): boolean {
    return (
      this.showSource &&
      (this.recommendation.source === 'llm-suggestion' ||
        this.recommendation.source === 'both')
    );
  }

  onViewDetails(): void {
    this.viewDetails.emit(this.movie.id);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.onViewDetails();
    }
  }
}
