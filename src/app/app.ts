import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SpotifyService, SpotifyTrack } from './services/spotify.service';
import { TmdbService, Movie } from './services/tmdb.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  styleUrl: './app.css',
  template: `
    <div class="app-container">
      <!-- Header -->
      <header class="header">
        <div class="header-content">
          <h1 class="title">🎬 Soundtrack Cinema</h1>
          <p class="tagline">Discover movies featuring your favorite songs</p>
        </div>
      </header>

      <!-- Main Content -->
      <main class="main-content">
        <!-- Search Section -->
        <section class="search-section">
          <div class="search-container">
            <input
              type="text"
              [(ngModel)]="searchQuery"
              (input)="onSearchInput()"
              placeholder="Search for a song..."
              class="search-input"
            />
            <button
              (click)="searchSongs()"
              [disabled]="isSearching() || !searchQuery.trim()"
              class="search-button"
            >
              {{ isSearching() ? 'Searching...' : 'Search' }}
            </button>
          </div>

          <!-- Error Message -->
          @if (errorMessage()) {
            <div class="error-message">
              {{ errorMessage() }}
            </div>
          }
        </section>

        <!-- Song Results -->
        @if (songResults().length > 0 && !selectedSong()) {
          <section class="results-section">
            <h2 class="section-title">Select a Song</h2>
            <div class="song-grid">
              @for (song of songResults(); track song.id) {
                <div class="song-card" (click)="selectSong(song)">
                  @if (song.albumImage) {
                    <img [src]="song.albumImage" [alt]="song.name" class="song-image" />
                  }
                  <div class="song-info">
                    <h3 class="song-name">{{ song.name }}</h3>
                    <p class="song-artists">{{ song.artists.join(', ') }}</p>
                    <p class="song-album">{{ song.album }}</p>
                  </div>
                </div>
              }
            </div>
          </section>
        }

        <!-- Selected Song & Movie Results -->
        @if (selectedSong()) {
          <section class="results-section">
            <!-- Selected Song Display -->
            <div class="selected-song">
              <h2 class="section-title">Selected Song</h2>
              <div class="selected-song-card">
                @if (selectedSong()!.albumImage) {
                  <img
                    [src]="selectedSong()!.albumImage"
                    [alt]="selectedSong()!.name"
                    class="selected-song-image"
                  />
                }
                <div class="selected-song-info">
                  <h3 class="selected-song-name">{{ selectedSong()!.name }}</h3>
                  <p class="selected-song-artists">{{ selectedSong()!.artists.join(', ') }}</p>
                  <button (click)="clearSelection()" class="change-song-button">
                    Change Song
                  </button>
                </div>
              </div>
            </div>

            <!-- Loading State -->
            @if (isLoadingMovies()) {
              <div class="loading">
                <div class="spinner"></div>
                <p>Finding movies with this song...</p>
              </div>
            }

            <!-- Movie Results -->
            @if (!isLoadingMovies() && movieResults().length > 0) {
              <div class="movie-results">
                <h2 class="section-title">Recommended Movies</h2>
                <div class="movie-grid">
                  @for (movie of movieResults(); track movie.id) {
                    <div class="movie-card">
                      @if (movie.posterPath) {
                        <img
                          [src]="tmdbService.getImageUrl(movie.posterPath, 'w500')"
                          [alt]="movie.title"
                          class="movie-poster"
                        />
                      } @else {
                        <div class="movie-poster-placeholder">
                          <span>No Image</span>
                        </div>
                      }
                      <div class="movie-info">
                        <h3 class="movie-title">{{ movie.title }}</h3>
                        <div class="movie-meta">
                          <span class="movie-rating">⭐ {{ movie.rating.toFixed(1) }}</span>
                          @if (movie.releaseDate) {
                            <span class="movie-year">{{ movie.releaseDate.split('-')[0] }}</span>
                          }
                        </div>
                        @if (movie.overview) {
                          <p class="movie-overview">{{ movie.overview }}</p>
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- No Results -->
            @if (!isLoadingMovies() && movieResults().length === 0) {
              <div class="no-results">
                <p>No movies found featuring this song. Try another song!</p>
              </div>
            }
          </section>
        }
      </main>

      <!-- Footer -->
      <footer class="footer">
        <p>Powered by Spotify & TMDb APIs</p>
      </footer>
    </div>
  `,
})
export class App {
  protected readonly title = signal('Soundtrack Cinema');
  protected searchQuery = '';
  protected isSearching = signal(false);
  protected isLoadingMovies = signal(false);
  protected errorMessage = signal('');
  protected songResults = signal<SpotifyTrack[]>([]);
  protected selectedSong = signal<SpotifyTrack | null>(null);
  protected movieResults = signal<Movie[]>([]);

  constructor(
    private spotifyService: SpotifyService,
    protected tmdbService: TmdbService
  ) {}

  onSearchInput() {
    // Clear error when user starts typing
    if (this.errorMessage()) {
      this.errorMessage.set('');
    }
  }

  async searchSongs() {
    if (!this.searchQuery.trim()) {
      return;
    }

    this.isSearching.set(true);
    this.errorMessage.set('');
    this.songResults.set([]);

    try {
      const results = await this.spotifyService.searchTracks(this.searchQuery);
      this.songResults.set(results);

      if (results.length === 0) {
        this.errorMessage.set('No songs found. Try a different search term.');
      }
    } catch (error) {
      console.error('Error searching songs:', error);
      this.errorMessage.set(
        'Failed to search songs. Please check your Spotify API credentials.'
      );
    } finally {
      this.isSearching.set(false);
    }
  }

  async selectSong(song: SpotifyTrack) {
    this.selectedSong.set(song);
    this.isLoadingMovies.set(true);
    this.movieResults.set([]);

    try {
      // Search for movies using song name and artist
      const query = `${song.name} ${song.artists[0]}`;
      const results = await this.tmdbService.searchMovies(query);
      this.movieResults.set(results);
    } catch (error) {
      console.error('Error searching movies:', error);
      this.errorMessage.set('Failed to search movies. Please check your TMDb API key.');
    } finally {
      this.isLoadingMovies.set(false);
    }
  }

  clearSelection() {
    this.selectedSong.set(null);
    this.movieResults.set([]);
    this.searchQuery = '';
    this.songResults.set([]);
  }
}
