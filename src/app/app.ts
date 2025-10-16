import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet],
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
