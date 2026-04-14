/**
 * Soundtrack Cinema v2 — Shared Type Contracts
 *
 * READ-ONLY during development. No subagent may modify this file
 * without orchestrator approval.
 */

// ─────────────────────────────────────────────────────────────────────────────
// SPOTIFY TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface SpotifyImage {
  url: string;
  height: number | null;
  width: number | null;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  uri: string;
  /** Only present when fetched from /artists/{id} */
  images?: SpotifyImage[];
  genres?: string[];
  popularity?: number;
  followers?: { total: number };
  external_urls: { spotify: string };
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  album_type: 'album' | 'single' | 'compilation';
  release_date: string;
  images: SpotifyImage[];
  artists: SpotifyArtist[];
  total_tracks: number;
  uri: string;
  external_urls: { spotify: string };
}

export interface SpotifyTrack {
  id: string;
  name: string;
  uri: string;
  duration_ms: number;
  explicit: boolean;
  popularity: number;
  preview_url: string | null;
  track_number: number;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  external_urls: { spotify: string };
  external_ids?: { isrc?: string };
}

export interface SpotifyPlaylistTrack {
  added_at: string;
  track: SpotifyTrack | null;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string | null;
  images: SpotifyImage[];
  owner: { display_name: string; id: string };
  tracks: {
    total: number;
    items?: SpotifyPlaylistTrack[];
    href: string;
  };
  uri: string;
  external_urls: { spotify: string };
  public: boolean | null;
}

export interface SpotifySearchResult {
  tracks: {
    items: SpotifyTrack[];
    total: number;
    limit: number;
    offset: number;
    next: string | null;
    previous: string | null;
  };
}

export interface SpotifyUser {
  id: string;
  display_name: string | null;
  email?: string;
  images: SpotifyImage[];
  country: string;
  product: 'premium' | 'free' | 'open';
  external_urls: { spotify: string };
}

export interface SpotifyPaginatedPlaylists {
  items: SpotifyPlaylist[];
  total: number;
  limit: number;
  offset: number;
  next: string | null;
}

export interface SpotifyTopTracksResult {
  items: SpotifyTrack[];
  total: number;
  limit: number;
  offset: number;
  next: string | null;
}

export interface SpotifyTopArtistsResult {
  items: SpotifyArtist[];
  total: number;
  limit: number;
  offset: number;
  next: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// TMDB TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface TMDBMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  release_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  genre_ids?: number[];
  genres?: TMDBGenre[];
  vote_average: number;
  vote_count: number;
  popularity: number;
  adult: boolean;
  original_language: string;
  video: boolean;
  /** Only present when fetched from /movie/{id} */
  imdb_id?: string | null;
  runtime?: number | null;
  status?: string;
  tagline?: string | null;
  budget?: number;
  revenue?: number;
  homepage?: string | null;
  production_companies?: TMDBProductionCompany[];
}

export interface TMDBGenre {
  id: number;
  name: string;
}

export interface TMDBProductionCompany {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
}

export interface TMDBSearchResult {
  results: TMDBMovie[];
  total_results: number;
  total_pages: number;
  page: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// RECOMMENDATION TYPES
// ─────────────────────────────────────────────────────────────────────────────

/** How a movie recommendation was sourced */
export type RecommendationSource = 'tmdb-search' | 'llm-suggestion' | 'both';

export interface MovieRecommendation {
  movie: TMDBMovie;
  /** 0–100 relevance score (higher = better match) */
  score: number;
  source: RecommendationSource;
  /** Human-readable reason for the recommendation */
  reason?: string;
}

export interface RecommendationResult {
  trackId: string;
  track: SpotifyTrack;
  recommendations: MovieRecommendation[];
  /** ISO timestamp of when this result was generated */
  generatedAt: string;
}

export interface PlaylistRecommendationResult {
  playlistId: string;
  playlist: SpotifyPlaylist;
  recommendations: PlaylistMovieRecommendation[];
  generatedAt: string;
}

export interface PlaylistMovieRecommendation extends MovieRecommendation {
  /** IDs of tracks in the playlist that contributed to this recommendation */
  contributingTrackIds: string[];
  /** Number of tracks that contributed */
  matchCount: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// LLM TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface LLMMovieSuggestion {
  title: string;
  year?: number;
  reason: string;
}

export interface LLMRecommendationRequest {
  trackName: string;
  artistName: string;
  /** Optional: genres from Spotify artist */
  genres?: string[];
}

export interface LLMRecommendationResponse {
  suggestions: LLMMovieSuggestion[];
}

// ─────────────────────────────────────────────────────────────────────────────
// APPLICATION STATE TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type AuthStatus = 'unauthenticated' | 'authenticating' | 'authenticated' | 'error';

export interface AuthState {
  status: AuthStatus;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null; // Unix timestamp ms
  user: SpotifyUser | null;
  error: string | null;
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface SearchState {
  query: string;
  status: LoadingState;
  results: SpotifyTrack[];
  error: string | null;
}

export interface RecommendationsState {
  trackId: string | null;
  status: LoadingState;
  result: RecommendationResult | null;
  error: string | null;
  /** Minimum TMDB vote_average filter, default 6.0 (0–10 scale) */
  minRating: number;
}

export interface PlaylistState {
  status: LoadingState;
  playlists: SpotifyPlaylist[];
  selectedPlaylistId: string | null;
  tracksStatus: LoadingState;
  tracks: SpotifyTrack[];
  recommendationsStatus: LoadingState;
  recommendations: PlaylistRecommendationResult | null;
  error: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// ENVIRONMENT CONFIG TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface SpotifyConfig {
  clientId: string;
  redirectUri: string;
  scopes: string[];
}

export interface TMDBConfig {
  apiKey: string;
  baseUrl: string;
  imageBaseUrl: string;
}

export interface AnthropicConfig {
  apiKey: string;
  model: string;
}

export interface Environment {
  production: boolean;
  spotify: SpotifyConfig;
  tmdb: TMDBConfig;
  anthropic: AnthropicConfig;
  /** Minimum TMDB vote_average to include in recommendations (0–10 scale) */
  minMovieRating: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type ImageSize =
  | 'w92'
  | 'w154'
  | 'w185'
  | 'w342'
  | 'w500'
  | 'w780'
  | 'original';

/** PKCE OAuth state stored during auth flow */
export interface PKCEState {
  codeVerifier: string;
  state: string;
}
