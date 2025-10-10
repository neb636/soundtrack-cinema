import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface Movie {
  id: number;
  title: string;
  overview: string;
  releaseDate: string;
  rating: number;
  voteCount: number;
  posterPath: string;
  backdropPath: string;
  genres: string[];
}

@Injectable({
  providedIn: 'root',
})
export class TmdbService {
  private readonly baseUrl = 'https://api.themoviedb.org/3';
  private readonly imageBaseUrl = 'https://image.tmdb.org/t/p';

  constructor() {}

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
  async searchMovies(query: string): Promise<Movie[]> {
    if (!query.trim()) {
      return [];
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/search/movie?api_key=${environment.tmdb.apiKey}&query=${encodeURIComponent(query)}&include_adult=false`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
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
        `${this.baseUrl}/movie/${movieId}?api_key=${environment.tmdb.apiKey}`,
        {
          headers: {
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
   * Search for movies by multiple keywords (song name + artist)
   * This provides better results by combining song and artist information
   */
  async searchMoviesBySongAndArtist(songName: string, artistName: string): Promise<Movie[]> {
    const query = `${songName} ${artistName}`;
    return this.searchMovies(query);
  }

  /**
   * Get popular movies (fallback when no search results)
   */
  async getPopularMovies(): Promise<Movie[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/movie/popular?api_key=${environment.tmdb.apiKey}&page=1`,
        {
          headers: {
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
