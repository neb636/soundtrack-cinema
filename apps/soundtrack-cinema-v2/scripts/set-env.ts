import { writeFileSync } from 'fs';
import { resolve } from 'path';

const get = (key: string) => process.env[key] ?? '';

const environments: Record<string, string> = {
  'src/environments/environment.ts': `import { Environment } from '../../spec/contracts/types';

export const environment: Environment = {
  production: false,
  spotify: {
    clientId: '${get('SPOTIFY_CLIENT_ID')}',
    redirectUri: '${get('SPOTIFY_REDIRECT_URI') || 'http://localhost:4200/callback'}',
    scopes: [
      'user-read-private',
      'user-read-email',
      'user-top-read',
      'playlist-read-private',
      'playlist-read-collaborative',
    ],
  },
  tmdb: {
    apiKey: '${get('TMDB_BEARER_TOKEN')}',
    baseUrl: 'https://api.themoviedb.org/3',
    imageBaseUrl: 'https://image.tmdb.org/t/p',
  },
  anthropic: {
    apiKey: '${get('ANTHROPIC_API_KEY')}',
    model: 'claude-haiku-4-5-20251001',
  },
  minMovieRating: 6.0,
};
`,
  'src/environments/environment.prod.ts': `import { Environment } from '../../spec/contracts/types';

export const environment: Environment = {
  production: true,
  spotify: {
    clientId: '${get('SPOTIFY_CLIENT_ID')}',
    redirectUri: '${get('SPOTIFY_REDIRECT_URI') || 'http://localhost:4200/callback'}',
    scopes: [
      'user-read-private',
      'user-read-email',
      'user-top-read',
      'playlist-read-private',
      'playlist-read-collaborative',
    ],
  },
  tmdb: {
    apiKey: '${get('TMDB_BEARER_TOKEN')}',
    baseUrl: 'https://api.themoviedb.org/3',
    imageBaseUrl: 'https://image.tmdb.org/t/p',
  },
  anthropic: {
    apiKey: '${get('ANTHROPIC_API_KEY')}',
    model: 'claude-haiku-4-5-20251001',
  },
  minMovieRating: 6.0,
};
`,
};

for (const [relativePath, content] of Object.entries(environments)) {
  const filePath = resolve(process.cwd(), relativePath);
  writeFileSync(filePath, content, 'utf8');
  console.log(`Generated ${relativePath}`);
}
