import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { Movie } from './types';

@Injectable({ providedIn: 'root' })
export class TmdbApiService {
  private readonly baseUrl = 'https://api.themoviedb.org/3';
  private readonly imageBaseUrl = 'https://image.tmdb.org/t/p';

  /**
   * Get full image URL
   */
  getImageUrl(path: string, size: 'w200' | 'w500' | 'original' = 'w500'): string {
    if (!path) return '';
    return `${this.imageBaseUrl}/${size}${path}`;
  }

  /**
   * Search for movies by keyword (song name, artist, etc.)
   */
  async searchMovies(query: string, abortSignal?: AbortSignal): Promise<Movie[]> {
    if (!query.trim()) {
      return [];
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/search/movie?query=${encodeURIComponent(query)}&include_adult=false`,
        {
          headers: {
            'Authorization': `Bearer ${environment.tmdb.apiKey}`,
            'Content-Type': 'application/json',
          },
          signal: abortSignal,
        },
      );

      if (!response.ok) {
        throw new Error('Failed to search movies');
      }

      const data = await response.json();

      return data.results.slice(0, 10).map((movie: any) => ({
        id: movie.id,
        title: movie.title,
        overview: movie.overview,
        releaseDate: movie.release_date,
        rating: movie.vote_average,
        voteCount: movie.vote_count,
        posterPath: movie.poster_path,
        backdropPath: movie.backdrop_path,
        genres: [],
      }));
    } catch (error) {
      console.error('Error searching movies:', error);
      throw error;
    }
  }

  /**
   * Get movie details including genres
   */
  async getMovieDetails(movieId: number): Promise<Movie | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/movie/${movieId}`,
        {
          headers: {
            'Authorization': `Bearer ${environment.tmdb.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error('Failed to get movie details');
      }

      const movie = await response.json();

      return {
        id: movie.id,
        title: movie.title,
        overview: movie.overview,
        releaseDate: movie.release_date,
        rating: movie.vote_average,
        voteCount: movie.vote_count,
        posterPath: movie.poster_path,
        backdropPath: movie.backdrop_path,
        genres: movie.genres.map((genre: any) => genre.name),
      };
    } catch (error) {
      console.error('Error getting movie details:', error);
      return null;
    }
  }

  /**
   * Get popular movies (fallback when no search results)
   */
  async getPopularMovies(): Promise<Movie[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/movie/popular?page=1`,
        {
          headers: {
            'Authorization': `Bearer ${environment.tmdb.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error('Failed to get popular movies');
      }

      const data = await response.json();

      return data.results.slice(0, 10).map((movie: any) => ({
        id: movie.id,
        title: movie.title,
        overview: movie.overview,
        releaseDate: movie.release_date,
        rating: movie.vote_average,
        voteCount: movie.vote_count,
        posterPath: movie.poster_path,
        backdropPath: movie.backdrop_path,
        genres: [],
      }));
    } catch (error) {
      console.error('Error getting popular movies:', error);
      throw error;
    }
  }
}
