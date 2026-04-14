import { Injectable, inject } from '@angular/core';
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
   */
  async getRecommendationsForTrack(track: SpotifyTrack): Promise<RecommendationResult> {
    const primaryArtist = track.artists[0]?.name ?? '';
    const primaryQuery = `${track.name} ${primaryArtist}`;
    const minRating = this.env.minMovieRating;

    const [tmdbRecs, llmRecs] = await Promise.all([
      this.fetchTmdbRecs(primaryQuery, minRating),
      this.env.anthropic.apiKey
        ? this.fetchLlmRecs(track, primaryArtist, minRating)
        : Promise.resolve([] as MovieRecommendation[]),
    ]);

    const merged = mergeRecommendations(tmdbRecs, llmRecs);
    const deduplicated = deduplicateRecommendations(merged);
    const sorted = [...deduplicated].sort((a, b) => b.score - a.score);

    return {
      trackId: track.id,
      track,
      recommendations: sorted,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get aggregated movie recommendations for a list of tracks (playlist mode).
   * Runs all track recommendations in parallel, then merges.
   */
  async getRecommendationsForPlaylist(
    playlist: SpotifyPlaylist,
    tracks: SpotifyTrack[]
  ): Promise<PlaylistRecommendationResult> {
    const limitedTracks = take(tracks, 20);

    if (limitedTracks.length === 0) {
      return {
        playlistId: playlist.id,
        playlist,
        recommendations: [],
        generatedAt: new Date().toISOString(),
      };
    }

    const allResults = await Promise.all(
      limitedTracks.map(async (track) => {
        try {
          const result = await this.getRecommendationsForTrack(track);
          return { trackId: track.id, recommendations: result.recommendations };
        } catch {
          return { trackId: track.id, recommendations: [] as MovieRecommendation[] };
        }
      })
    );

    const movieMap = new Map<number, { rec: MovieRecommendation; trackIds: string[] }>();

    for (const { trackId, recommendations } of allResults) {
      for (const rec of recommendations) {
        const existing = movieMap.get(rec.movie.id);
        if (existing) {
          existing.trackIds.push(trackId);
          if (rec.score > existing.rec.score) existing.rec = { ...rec };
        } else {
          movieMap.set(rec.movie.id, { rec, trackIds: [trackId] });
        }
      }
    }

    const recommendations: PlaylistMovieRecommendation[] = Array.from(movieMap.values()).map(
      ({ rec, trackIds }): PlaylistMovieRecommendation => ({
        ...rec,
        contributingTrackIds: trackIds,
        matchCount: trackIds.length,
      })
    );

    recommendations.sort((a, b) =>
      b.matchCount !== a.matchCount ? b.matchCount - a.matchCount : b.score - a.score
    );

    return {
      playlistId: playlist.id,
      playlist,
      recommendations,
      generatedAt: new Date().toISOString(),
    };
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private async fetchTmdbRecs(query: string, minRating: number): Promise<MovieRecommendation[]> {
    try {
      const result = await this.tmdb.searchMovies(query, 1);
      return result.results
        .filter(movie => movie.vote_average >= minRating)
        .map((movie): MovieRecommendation => ({
          movie,
          score: scoreMovie(movie, query),
          source: 'tmdb-search',
        }));
    } catch {
      return [];
    }
  }

  private async fetchLlmRecs(
    track: SpotifyTrack,
    primaryArtist: string,
    minRating: number
  ): Promise<MovieRecommendation[]> {
    try {
      const suggestions = await this.llm.getMovieSuggestions({
        trackName: track.name,
        artistName: primaryArtist,
        genres: track.artists[0]?.genres,
      });
      return this.resolveLlmSuggestions(suggestions, minRating);
    } catch {
      return [];
    }
  }

  private async resolveLlmSuggestions(
    suggestions: LLMMovieSuggestion[],
    minRating: number
  ): Promise<MovieRecommendation[]> {
    if (suggestions.length === 0) return [];

    const results = await Promise.all(
      suggestions.map(async (suggestion): Promise<MovieRecommendation | null> => {
        try {
          const query = suggestion.year
            ? `${suggestion.title} ${suggestion.year}`
            : suggestion.title;
          const result = await this.tmdb.searchMovies(query, 1);
          const match = result.results.filter(movie => movie.vote_average >= minRating).at(0);
          if (!match) return null;
          return {
            movie: match,
            score: scoreMovie(match, suggestion.title),
            source: 'llm-suggestion',
            reason: suggestion.reason,
          };
        } catch {
          return null;
        }
      })
    );

    return results.filter((r): r is MovieRecommendation => r !== null);
  }
}
