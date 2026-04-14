import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SlicePipe } from '@angular/common';
import { LiveAnnouncer } from '@angular/cdk/a11y';

import type { SpotifyTrack } from '../../../../spec/contracts/types';
import { SpotifyService } from '../../services/spotify/spotify.service';
import { RecommendationsStateService } from '../../core/state/recommendations.state';
import {
  MovieCardComponent,
  LoadingSpinnerComponent,
  EmptyStateComponent,
  DurationPipe,
} from '../../shared/index';

@Component({
  selector: 'app-track-detail',
  standalone: true,
  imports: [
    MovieCardComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    DurationPipe,
    SlicePipe,
  ],
  templateUrl: './track-detail.component.html',
  styleUrl: './track-detail.component.css',
})
export class TrackDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private spotifyService = inject(SpotifyService);
  private recsState = inject(RecommendationsStateService);
  private liveAnnouncer = inject(LiveAnnouncer);

  readonly track = signal<SpotifyTrack | null>(null);
  readonly trackLoading = signal(true);
  readonly trackError = signal<string | null>(null);

  // From state service — use .asReadonly() on plain signals; computed() is already readonly
  readonly recsStatus = this.recsState.status.asReadonly();
  readonly recommendations = this.recsState.filteredRecommendations; // computed()
  readonly recsError = this.recsState.error.asReadonly();
  readonly minRating = this.recsState.minRating.asReadonly();

  readonly sortOrder = signal<'score' | 'rating' | 'year'>('score');

  readonly sortedRecommendations = computed(() => {
    const recs = this.recommendations();
    const sort = this.sortOrder();
    return [...recs].sort((a, b) => {
      if (sort === 'rating') return b.movie.vote_average - a.movie.vote_average;
      if (sort === 'year') {
        const yearA = parseInt(a.movie.release_date?.substring(0, 4) ?? '0');
        const yearB = parseInt(b.movie.release_date?.substring(0, 4) ?? '0');
        return yearB - yearA;
      }
      return b.score - a.score; // default: relevance/score
    });
  });

  readonly hasLlmResults = computed(() =>
    this.recommendations().some(r => r.source === 'llm-suggestion' || r.source === 'both')
  );

  constructor() {
    // Announce to screen readers when recommendations finish loading.
    // Must be inside constructor (an injection context) — effect() is not valid
    // as a standalone statement outside the class body.
    effect(() => {
      const status = this.recsStatus();
      const count = this.recommendations().length;
      if (status === 'success') {
        this.liveAnnouncer.announce(`Found ${count} movie recommendations`);
      }
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.router.navigate(['/']); return; }
    this.loadTrack(id);
  }

  retryRecommendations(): void {
    const track = this.track();
    if (track) this.recsState.loadForTrack(track);
  }

  onMinRatingChange(rating: number): void {
    this.recsState.setMinRating(rating);
  }

  onSortChange(sort: 'score' | 'rating' | 'year'): void {
    this.sortOrder.set(sort);
  }

  onViewMovie(movieId: number): void {
    const trackId = this.route.snapshot.paramMap.get('id');
    this.router.navigate(['/movie', movieId], {
      queryParams: { from: trackId },
    });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  private loadTrack(id: string): void {
    this.spotifyService.getTrack(id).subscribe({
      next: (track) => {
        this.track.set(track);
        this.trackLoading.set(false);
        this.recsState.loadForTrack(track);
        // Announce to screen readers
        this.liveAnnouncer.announce(`Loading movie recommendations for ${track.name}`);
      },
      error: () => {
        this.trackError.set('Could not load track. Please go back and try again.');
        this.trackLoading.set(false);
      },
    });
  }
}
