import { Injectable, inject } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import Anthropic from '@anthropic-ai/sdk';
import { LLMMovieSuggestion, LLMRecommendationRequest } from '../../../../spec/contracts/types';
import { ENVIRONMENT_TOKEN } from '../../core/tokens/environment.token';

@Injectable({ providedIn: 'root' })
export class LlmService {
  private env = inject(ENVIRONMENT_TOKEN);

  /**
   * Call Claude Haiku to get movie suggestions based on song sentiment.
   * Returns empty array if no API key is configured.
   */
  getMovieSuggestions(request: LLMRecommendationRequest): Observable<LLMMovieSuggestion[]> {
    if (!this.env.anthropic.apiKey) {
      return of([]);
    }

    const anthropic = new Anthropic({
      apiKey: this.env.anthropic.apiKey,
      dangerouslyAllowBrowser: true,
    });

    const genres = request.genres?.join(', ') || 'unknown';
    const prompt = `You are a movie recommendation engine. Given a song, recommend movies that share its emotional tone, themes, or musical style.

Song: "${request.trackName}" by ${request.artistName}
Genres: ${genres}

Respond with a JSON array of up to 5 movie recommendations. Each item must have:
- "title": exact movie title (string)
- "year": release year (number, optional)
- "reason": one sentence explaining why this movie matches (string)

Example response:
[{"title":"Almost Famous","year":2000,"reason":"Both capture the spirit of rock music and its emotional journey."}]

Respond with JSON only, no other text.`;

    return from(
      anthropic.messages.create({
        model: this.env.anthropic.model,
        max_tokens: 512,
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }],
      })
    ).pipe(
      map(response => {
        const content = response.content[0];
        if (content.type !== 'text') {
          return [];
        }
        try {
          const parsed = JSON.parse(content.text) as LLMMovieSuggestion[];
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      }),
      catchError(() => of([] as LLMMovieSuggestion[]))
    );
  }
}
