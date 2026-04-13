# Proposed APIs 

Feel free to add in any other proposed apis like llm based if think can add to experience

### Spotify

Auth: OAuth 2.0 Authorization Code with PKCE.

| Underlying Spotify Web API endpoint |
|-------------------------------------|
| `/search` |
| `/albums/{id}` |
| `/artists/{id}` |
| `/playlists/{id}` |
| `/tracks/{id}` |
| `/me/playlists` |
| `/me` |
| `/me/top/artists` |
| `/me/top/tracks` |

---

### TMDB

Auth: Bearer token (`environment.tmdb.apiKey`) sent in the `Authorization` header.

Base URL: `https://api.themoviedb.org/3`

| Path / query |
|----------------|
| `/search/movie?query=...&include_adult=false` |
| `/movie/{movieId}` |
| `/movie/popular?page=1` |

Image CDN base: `https://image.tmdb.org/t/p` — appends size + path (e.g. `w500/...`).
