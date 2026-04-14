import { Injectable, computed, inject, signal } from '@angular/core';
import type {
  LoadingState,
  MovieRecommendation,
  RecommendationResult,
  SpotifyTrack,
} from '../../../../spec/contracts/types';
import { RecommendationService } from '../../services/recommendation/recommendation.service';

@Injectable({ providedIn: 'root' })
export class RecommendationsStateService {
  private recService = inject(RecommendationService);

  // State
  trackId = signal<string | null>(null);
  status = signal<LoadingState>('idle');
  result = signal<RecommendationResult | null>(null);
  error = signal<string | null>(null);
  minRating = signal<number>(6.0);

  // Derived
  isLoading = computed(() => this.status() === 'loading');

  filteredRecommendations = computed<MovieRecommendation[]>(() => {
    const result = this.result();
    if (!result) return [];
    return result.recommendations
      .filter(r => r.movie.vote_average >= this.minRating())
      .sort((a, b) => b.score - a.score);
  });

  // Actions
  loadForTrack(track: SpotifyTrack): void {
    // Skip if same track already successfully loaded
    if (this.trackId() === track.id && this.status() === 'success') return;

    this.trackId.set(track.id);
    this.status.set('loading');
    this.result.set(null);
    this.error.set(null);

    this.recService.getRecommendationsForTrack(track).subscribe({
      next: (result) => {
        this.result.set(result);
        this.status.set('success');
      },
      error: () => {
        this.error.set('Failed to load recommendations. Please try again.');
        this.status.set('error');
      },
    });
  }

  setMinRating(rating: number): void {
    this.minRating.set(rating);
  }

  reset(): void {
    this.trackId.set(null);
    this.status.set('idle');
    this.result.set(null);
    this.error.set(null);
  }
}
