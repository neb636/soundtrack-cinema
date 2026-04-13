


## Tech

Angular
Angular Aria
lodash-es
singularity

# External apis

1. **Spotify API**:
   - Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - Create a new app
   - Copy your Client ID

2. **TMDb API**:
   - Go to [TMDb Settings](https://www.themoviedb.org/settings/api)
   - Request an API key
   - Copy your API key

# Overview

Soundtrack Cinema is a modern web application that bridges the gap between music and cinema. Search for your favorite songs on Spotify and discover movies that feature them in their soundtracks.

# General

- use spotify client side to drive
-



  private readonly baseUrl = 'https://api.themoviedb.org/3';
  private readonly imageBaseUrl = 'https://image.tmdb.org/t/p';

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

