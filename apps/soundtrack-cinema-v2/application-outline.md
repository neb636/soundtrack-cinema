# Overview

Soundtrack Cinema is a modern web application that bridges the gap between music and cinema. Search for your favorite songs on Spotify and discover movies that feature them in their soundtracks.

# Thoughts behind
- Movies can often be tied to songs. Great soundtracks make movies more memoriable. Often times when I hear a song it will remind of a scene in a movie.

# Geneal app behavior/ideas
- User could search for a specific song or artist through spotify, click the song, then see a list of possiable movie recomendations based off of that song. They can be ordered by highest score to lowest. When user clicks on movie they can see a movie overview page with basic info and a link to the imdb page.
- We could generate a list of movie recomendations based off of a spotify playlist
- secondary idea is we could augment the results of recommended movies by extracting ques from song and then find a cheap llm to ask "Recommend a list of movies based off of this song with the same emotional sentiment" or something like that. example is the llm may recommend sad romance moview if the song it was provided was a sad love song.

# Filtering logic

Generally a 6.0 imdb rating is the cut off of what we want to recommend for movies

## Tech

Angular
Angular Aria - with our own custom CSS
lodash-es
singularity

# Proposed APIs 

Feel free to add in any other proposed apis like llm based if think can add to experience. also feel free to use sdk libraies or custom rest implementations. i have no preference.

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
