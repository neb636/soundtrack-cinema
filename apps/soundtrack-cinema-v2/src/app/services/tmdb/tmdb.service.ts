import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { TMDBMovie, TMDBSearchResult } from '../../../../spec/contracts/types';
import { ENVIRONMENT_TOKEN } from '../../core/tokens/environment.token';

@Injectable({ providedIn: 'root' })
export class TmdbService {
  private readonly http = inject(HttpClient);
  private readonly env = inject(ENVIRONMENT_TOKEN);

  private get headers(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.env.tmdb.apiKey}`,
    });
  }

  private get baseUrl(): string {
    return this.env.tmdb.baseUrl;
  }

  /** GET /search/movie?query=...&include_adult=false */
  searchMovies(query: string, page = 1): Promise<TMDBSearchResult> {
    const params = new HttpParams()
      .set('query', query)
      .set('include_adult', 'false')
      .set('language', 'en-US')
      .set('page', page.toString());

    return firstValueFrom(this.http.get<TMDBSearchResult>(`${this.baseUrl}/search/movie`, {
      headers: this.headers,
      params,
    }));
  }

  /** GET /movie/{id} — full movie detail including imdb_id, runtime, genres */
  getMovie(id: number): Promise<TMDBMovie> {
    const params = new HttpParams().set('language', 'en-US');

    return firstValueFrom(this.http.get<TMDBMovie>(`${this.baseUrl}/movie/${id}`, {
      headers: this.headers,
      params,
    }));
  }

  /** GET /movie/popular?page=1 */
  getPopularMovies(page = 1): Promise<TMDBSearchResult> {
    const params = new HttpParams()
      .set('language', 'en-US')
      .set('page', page.toString());

    return firstValueFrom(this.http.get<TMDBSearchResult>(`${this.baseUrl}/movie/popular`, {
      headers: this.headers,
      params,
    }));
  }
}
