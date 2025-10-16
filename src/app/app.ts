import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, FormsModule],
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app-root__container">
      <!-- Header -->
      <header class="app-root__header">
        <div class="app-root__header-content">
          <h1 class="app-root__title">🎬 Soundtrack Cinema</h1>
          <p class="app-root__tagline">Discover movies featuring your favorite songs</p>
        </div>
      </header>

      <!-- Main Content -->
      <main class="app-root__main-content">
        <section class="app-root__search-section">
          <div class="app-root__search-container">
            <input
              type="text"
              [ngModel]="searchQuery()"
              (ngModelChange)="applicationStateService.setSearchQuery($event)"
              placeholder="Search for a song..."
              class="app-root__search-input"
            />
            @if (songSearchResource.isLoading()) {
              <div class="app-root__search-loading">Searching...</div>
            }
          </div>

          <!-- Error Message -->
          <!-- @if (errorMessage()) {
            <div class="error-message">
              {{ errorMessage() }}
            </div>
          } -->
        </section>

        <router-outlet></router-outlet>
      </main>

      <!-- Footer -->
      <footer class="app-root__footer">
        <p>Powered by Spotify & TMDb APIs</p>
      </footer>
    </div>
  `,
})
export class App {}
