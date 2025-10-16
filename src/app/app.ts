import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApplicationStateService } from './common/services/application-state/application-state.service';
import { AppHeaderComponent } from './common/components/app-header/app-header.component';
import { AppFooterComponent } from './common/components/app-footer/app-footer.component';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, FormsModule, AppHeaderComponent, AppFooterComponent],
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app-root__container">
      <app-header></app-header>

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

          </div>

          <!-- Error Message -->
          <!-- @if (errorMessage()) {
            <div class="error-message">
              {{ errorMessage() }}
            </div>
          } -->
        </section>

        <section class="app-root__route-wrapper">
          <router-outlet></router-outlet>
        </section>
      </main>

      <app-footer></app-footer>
    </div>
  `,
})
export class App {
  applicationStateService = inject(ApplicationStateService);
  searchQuery = this.applicationStateService.searchQuery.asReadonly();
}
