import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { take } from 'lodash-es';
import {
  SpotifyTrack,
  SpotifyPlaylist,
  MovieRecommendation,
  RecommendationResult,
  PlaylistRecommendationResult,
  PlaylistMovieRecommendation,
  LLMMovieSuggestion,
} from '../../../../spec/contracts/types';
import { ENVIRONMENT_TOKEN } from '../../core/tokens/environment.token';
import { TmdbService } from '../tmdb/tmdb.service';
import { LlmService } from './llm.service';
import {
  scoreMovie,
  mergeRecommendations,
  deduplicateRecommendations,
} from './recommendation.utils';

@Injectable({ providedIn: 'root' })
export class RecommendationService {
  private tmdb = inject(TmdbService);
  private llm = inject(LlmService);
  private env = inject(ENVIRONMENT_TOKEN);

  /**
   * Main entry point: get movie recommendations for a single track.
   * Returns an Observable that emits one RecommendationResult when done.
   */
  getRecommendationsForTrack(track: SpotifyTrack): Observable<RecommendationResult> {
    const primaryArtist = track.artists[0]?.name ?? '';
    const primaryQuery = `${track.name} ${primaryArtist}`;
    const minRating = this.env.minMovieRating;

    const tmdbResults$: Observable<MovieRecommendation[]> = this.tmdb
      .searchMovies(primaryQuery, 1)
      .pipe(
        map(result =>
          result.results
            .filter(movie => movie.vote_average >= minRating)
            .map(
              (movie): MovieRecommendation => ({
                movie,
                score: scoreMovie(movie, primaryQuery),
                source: 'tmdb-search',
              })
            )
        ),
        catchError(() => of([] as MovieRecommendation[]))
      );

    const llmResults$: Observable<MovieRecommendation[]> = this.env.anthropic.apiKey
      ? this.llm
          .getMovieSuggestions({
            trackName: track.name,
            artistName: primaryArtist,
            genres: track.artists[0]?.genres,
          })
          .pipe(
            switchMap(suggestions =>
              this.resolveLlmSuggestions(suggestions, minRating)
            ),
            catchError(() => of([] as MovieRecommendation[]))
          )
      : of([]);

    return forkJoin([tmdbResults$, llmResults$]).pipe(
      map(([tmdbRecs, llmRecs]) => {
        const merged = mergeRecommendations(tmdbRecs, llmRecs);
        const deduplicated = deduplicateRecommendations(merged);
        const sorted = [...deduplicated].sort((a, b) => b.score - a.score);

        const result: RecommendationResult = {
          trackId: track.id,
          track,
          recommendations: sorted,
          generatedAt: new Date().toISOString(),
        };
        return result;
      })
    );
  }

  /**
   * Resolve LLM movie suggestions by searching TMDB for each one,
   * with a concurrency limit of 3 (via sliced forkJoin batches).
   */
  private resolveLlmSuggestions(
    suggestions: LLMMovieSuggestion[],
    minRating: number
  ): Observable<MovieRecommendation[]> {
    if (suggestions.length === 0) {
      return of([]);
    }

    const suggestionObservables = suggestions.map(suggestion =>
      this.tmdb
        .searchMovies(
          suggestion.year
            ? `${suggestion.title} ${suggestion.year}`
            : suggestion.title,
          1
        )
        .pipe(
          map(result => {
            const match = result.results
              .filter(movie => movie.vote_average >= minRating)
              .at(0);

            if (!match) {
              return null;
            }

            const rec: MovieRecommendation = {
              movie: match,
              score: scoreMovie(match, suggestion.title),
              source: 'llm-suggestion',
              reason: suggestion.reason,
            };
            return rec;
          }),
          catchError(() => of(null))
        )
    );

    return forkJoin(suggestionObservables).pipe(
      map(results => results.filter((r): r is MovieRecommendation => r !== null))
    );
  }

  /**
   * Get aggregated movie recommendations for a list of tracks (playlist mode).
   * Runs track recommendations in parallel (max 5 concurrent), then merges.
   */
  getRecommendationsForPlaylist(
    playlist: SpotifyPlaylist,
    tracks: SpotifyTrack[]
  ): Observable<PlaylistRecommendationResult> {
    const limitedTracks = take(tracks, 20);

    if (limitedTracks.length === 0) {
      return of({
        playlistId: playlist.id,
        playlist,
        recommendations: [],
        generatedAt: new Date().toISOString(),
      });
    }

    type TrackResult = { trackId: string; recommendations: MovieRecommendation[] };

    const trackObservables: Observable<TrackResult>[] = limitedTracks.map(
      (track: SpotifyTrack) =>
        this.getRecommendationsForTrack(track).pipe(
          map(
            (result): TrackResult => ({
              trackId: track.id,
              recommendations: result.recommendations,
            })
          ),
          catchError(() =>
            of<TrackResult>({
              trackId: track.id,
              recommendations: [],
            })
          )
        )
    );

    return forkJoin(trackObservables).pipe(
      map((allResults: TrackResult[]) => {
        const movieMap = new Map<
          number,
          { rec: MovieRecommendation; trackIds: string[] }
        >();

        for (const { trackId, recommendations } of allResults) {
          for (const rec of recommendations) {
            const existing = movieMap.get(rec.movie.id);
            if (existing) {
              existing.trackIds.push(trackId);
              if (rec.score > existing.rec.score) {
                existing.rec = { ...rec };
              }
            } else {
              movieMap.set(rec.movie.id, { rec, trackIds: [trackId] });
            }
          }
        }

        const recommendations: PlaylistMovieRecommendation[] = Array.from(
          movieMap.values()
        ).map(
          ({ rec, trackIds }): PlaylistMovieRecommendation => ({
            ...rec,
            contributingTrackIds: trackIds,
            matchCount: trackIds.length,
          })
        );

        recommendations.sort((a, b) => {
          if (b.matchCount !== a.matchCount) {
            return b.matchCount - a.matchCount;
          }
          return b.score - a.score;
        });

        const result: PlaylistRecommendationResult = {
          playlistId: playlist.id,
          playlist,
          recommendations,
          generatedAt: new Date().toISOString(),
        };
        return result;
      })
    );
  }
}
