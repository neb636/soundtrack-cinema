import { Environment } from '../../spec/contracts/types';

export const environment: Environment = {
  production: false,
  spotify: {
    clientId: 'YOUR_SPOTIFY_CLIENT_ID',
    redirectUri: 'http://localhost:4200/callback',
    scopes: [
      'user-read-private',
      'user-read-email',
      'user-top-read',
      'playlist-read-private',
      'playlist-read-collaborative',
    ],
  },
  tmdb: {
    apiKey: 'YOUR_TMDB_BEARER_TOKEN',
    baseUrl: 'https://api.themoviedb.org/3',
    imageBaseUrl: 'https://image.tmdb.org/t/p',
  },
  anthropic: {
    apiKey: '', // Leave empty to disable LLM features
    model: 'claude-haiku-4-5-20251001',
  },
  minMovieRating: 6.0,
};
