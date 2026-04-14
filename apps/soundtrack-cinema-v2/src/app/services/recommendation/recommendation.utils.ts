import { MovieRecommendation, TMDBMovie } from '../../../../spec/contracts/types';

/**
 * Score a TMDB movie's relevance to a track.
 * Returns 0–100.
 */
export function scoreMovie(movie: TMDBMovie, query: string): number {
  let score = 0;
  // Base score from TMDB popularity (0-20 pts)
  score += Math.min(movie.popularity / 5, 20);
  // Rating bonus (0-30 pts)  vote_average is 0-10
  score += (movie.vote_average / 10) * 30;
  // Title match bonus (0-30 pts) — fuzzy match of query words in title
  const titleWords = movie.title.toLowerCase().split(/\s+/);
  const queryWords = query.toLowerCase().split(/\s+/);
  const matches = queryWords.filter(w => titleWords.some(t => t.includes(w)));
  score += (matches.length / queryWords.length) * 30;
  // Vote count confidence (0-20 pts) — more votes = more reliable
  score += Math.min(Math.log10(movie.vote_count + 1) * 5, 20);
  return Math.round(Math.min(score, 100));
}

/**
 * Merge two arrays of MovieRecommendation, preferring higher scores.
 * Source 'both' is assigned when a movie appears in both arrays.
 */
export function mergeRecommendations(
  tmdbResults: MovieRecommendation[],
  llmResults: MovieRecommendation[]
): MovieRecommendation[] {
  const tmdbMap = new Map<number, MovieRecommendation>(
    tmdbResults.map(r => [r.movie.id, r])
  );
  const llmMap = new Map<number, MovieRecommendation>(
    llmResults.map(r => [r.movie.id, r])
  );

  const merged: MovieRecommendation[] = [];

  for (const [id, tmdbRec] of tmdbMap) {
    if (llmMap.has(id)) {
      const llmRec = llmMap.get(id)!;
      merged.push({
        movie: tmdbRec.movie,
        score: Math.max(tmdbRec.score, llmRec.score),
        source: 'both',
        reason: llmRec.reason ?? tmdbRec.reason,
      });
    } else {
      merged.push(tmdbRec);
    }
  }

  for (const [id, llmRec] of llmMap) {
    if (!tmdbMap.has(id)) {
      merged.push(llmRec);
    }
  }

  return merged;
}

/**
 * Deduplicate recommendations by movie ID, keeping highest score.
 */
export function deduplicateRecommendations(
  recs: MovieRecommendation[]
): MovieRecommendation[] {
  const seen = new Map<number, MovieRecommendation>();
  for (const rec of recs) {
    const existing = seen.get(rec.movie.id);
    if (!existing || rec.score > existing.score) {
      seen.set(rec.movie.id, rec);
    }
  }
  return Array.from(seen.values());
}
