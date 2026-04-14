# Task-001 — Contracts & Shared Types

**Assigned Agent:** A  
**Wave:** 1 (no dependencies)

---

## Goal

Produce the three contract files that all other agents depend on. These are the source
of truth for all TypeScript types, API shapes, and environment configuration across
the entire project.

> ⚠️ Note: These files have already been created as part of spec generation.
> Agent A's job is to **verify** they are complete and correct, then confirm
> they are ready for use by downstream agents. If any type is missing or
> ambiguous, Agent A may add it — but may not change existing type shapes
> without orchestrator approval.

---

## Inputs

None (this is the foundation task).

---

## Outputs

| File | Status |
|---|---|
| `spec/contracts/types.ts` | Created — verify completeness |
| `spec/contracts/api.yaml` | Created — verify completeness |
| `spec/contracts/env.md` | Created — verify completeness |

---

## File Ownership

- `spec/contracts/types.ts`
- `spec/contracts/api.yaml`
- `spec/contracts/env.md`

No other agent owns these files.

---

## Verification Checklist

Walk through each section and confirm:

### types.ts
- [ ] All Spotify response shapes are defined (SpotifyTrack, SpotifyArtist, SpotifyAlbum, SpotifyPlaylist, SpotifyUser, SpotifySearchResult, SpotifyPaginatedPlaylists, SpotifyTopTracksResult)
- [ ] All TMDB response shapes are defined (TMDBMovie, TMDBGenre, TMDBSearchResult)
- [ ] Recommendation types complete (MovieRecommendation, RecommendationResult, PlaylistRecommendationResult, PlaylistMovieRecommendation)
- [ ] LLM types complete (LLMMovieSuggestion, LLMRecommendationRequest, LLMRecommendationResponse)
- [ ] State types complete (AuthState, SearchState, RecommendationsState, PlaylistState)
- [ ] Environment config types complete (Environment, SpotifyConfig, TMDBConfig, AnthropicConfig)
- [ ] Utility types present (ImageSize, PKCEState)

### api.yaml
- [ ] All Spotify endpoints documented (search, track, artist, album, me, me/playlists, playlists/{id}, me/top/tracks, me/top/artists, token exchange)
- [ ] TMDB endpoints documented (search/movie, movie/{id}, movie/popular)
- [ ] Auth schemes defined (SpotifyOAuth, TMDBBearer)
- [ ] Request/response schemas present

### env.md
- [ ] Spotify vars documented (clientId, redirectUri, scopes)
- [ ] TMDB vars documented (apiKey, baseUrl, imageBaseUrl)
- [ ] Anthropic vars documented (apiKey, model)
- [ ] App settings documented (production, minMovieRating)
- [ ] Environment file template included

---

## Acceptance Criteria

- [ ] `spec/contracts/types.ts` compiles without TypeScript errors (run `tsc --noEmit` in spec/contracts)
- [ ] All types referenced in PROJECT_SPEC.md exist in types.ts
- [ ] api.yaml is valid YAML
- [ ] env.md contains a copy-pasteable template
- [ ] No circular dependencies in types.ts
