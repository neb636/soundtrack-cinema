import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { TmdbService } from '../../services/tmdb/tmdb.service';
import { TmdbImagePipe } from '../../services/tmdb/tmdb-image.pipe';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { RatingBadgeComponent } from '../../shared/components/rating-badge/rating-badge.component';
import { TMDBMovie } from '../../../../spec/contracts/types';

@Component({
  selector: 'app-movie-detail',
  standalone: true,
  imports: [
    LoadingSpinnerComponent,
    EmptyStateComponent,
    RatingBadgeComponent,
    TmdbImagePipe,
    RouterLink,
    DecimalPipe,
  ],
  templateUrl: './movie-detail.component.html',
  styleUrl: './movie-detail.component.css',
})
export class MovieDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private tmdbService = inject(TmdbService);

  readonly movie = signal<TMDBMovie | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  /** Track ID from query param (set when navigating from track detail) */
  readonly fromTrackId = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.fromTrackId.set(this.route.snapshot.queryParamMap.get('from'));
    if (!id || isNaN(+id)) {
      this.router.navigate(['/']);
      return;
    }
    this.tmdbService.getMovie(+id).subscribe({
      next: (movie) => {
        this.movie.set(movie);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Movie not found.');
        this.loading.set(false);
      },
    });
  }

  /** Construct the IMDB URL from imdb_id */
  getImdbUrl(imdbId: string): string {
    return `https://www.imdb.com/title/${imdbId}/`;
  }

  /** Get release year from release_date string */
  getReleaseYear(releaseDate: string | undefined): string {
    return releaseDate?.substring(0, 4) ?? '';
  }

  /** Format runtime in minutes to "Xh Ym" format */
  formatRuntime(minutes: number | null | undefined): string {
    if (!minutes) return '';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  goBack(): void {
    const fromId = this.fromTrackId();
    if (fromId) {
      this.router.navigate(['/track', fromId]);
    } else {
      this.router.navigate(['/']);
    }
  }
}
