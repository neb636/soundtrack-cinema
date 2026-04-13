import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppHeaderComponent } from '../../components/app-header/app-header.component';
import { AppFooterComponent } from '../../components/app-footer/app-footer.component';
import { ApplicationStateService } from '../../services/application-state/application-state.service';
import { syncQueryParamsEffect } from '../../effects/sync-query-params.effect';

@Component({
  selector: 'app-authenticated-layout',
  imports: [CommonModule, RouterOutlet, AppHeaderComponent, AppFooterComponent, ReactiveFormsModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-header></app-header>

    <section class="authenticated-layout__search-section">
      <div class="authenticated-layout__search-container">
        <input
          type="text"
          [ngModel]="searchQuery()"
          (ngModelChange)="applicationStateService.setSearchQuery($event)"
          placeholder="Search for a song..."
          class="authenticated-layout__search-input"
        />
      </div>
    </section>

    <main class="authenticated-layout__main-content">
      <router-outlet></router-outlet>
    </main>

    <app-footer></app-footer>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    .authenticated-layout__search-section {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem 1rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .authenticated-layout__search-container {
      max-width: 800px;
      margin: 0 auto;
    }

    .authenticated-layout__search-input {
      width: 100%;
      padding: 1rem 1.5rem;
      font-size: 1.1rem;
      border: none;
      border-radius: 50px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
    }

    .authenticated-layout__search-input:focus {
      outline: none;
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
      transform: translateY(-2px);
    }

    .authenticated-layout__main-content {
      flex: 1;
      width: 100%;
    }
  `]
})
export class AuthenticatedLayoutComponent {
  applicationStateService = inject(ApplicationStateService);

  searchQuery = this.applicationStateService.searchQuery.asReadonly();
  debouncedSearchQuery = this.applicationStateService.debouncedSearchQuery;

  constructor() {
    // Sync query params effect
    syncQueryParamsEffect({
      queryParams: computed(() => ({
        searchQuery: this.debouncedSearchQuery()
      }))
    });
  }
}
