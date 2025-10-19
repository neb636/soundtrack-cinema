import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { AppHeaderComponent } from './common/components/app-header/app-header.component';
import { AppFooterComponent } from './common/components/app-footer/app-footer.component';
import { syncQueryParamsEffect } from './common/effects/sync-query-params.effect';
import { ApplicationStateService } from './common/services/application-state/application-state.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, AppHeaderComponent, AppFooterComponent, ReactiveFormsModule, FormsModule],
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
   @if (showHeaderAndSearch()) {
     <app-header></app-header>

     <section class="app-header__search-section">
        <div class="app-header__search-container">
          <input
            type="text"
            [ngModel]="searchQuery()"
            (ngModelChange)="applicationStateService.setSearchQuery($event)"
            placeholder="Search for a song..."
            class="app-header__search-input"
          />
        </div>
      </section>
   }

   <main class="app-root__main-content">
     <router-outlet></router-outlet>
   </main>

   @if (showHeaderAndSearch()) {
     <app-footer></app-footer>
   }
  `,
})
export class App {
  private readonly router = inject(Router);
  applicationStateService = inject(ApplicationStateService);

  searchQuery = this.applicationStateService.searchQuery.asReadonly();
  debouncedSearchQuery = this.applicationStateService.debouncedSearchQuery;

  showHeaderAndSearch = signal(false);

  constructor() {
    // Update visibility based on current route
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        const url = this.router.url;
        this.showHeaderAndSearch.set(!url.includes('/login') && !url.includes('/callback'));
      });

    // Check initial route
    const initialUrl = this.router.url;
    this.showHeaderAndSearch.set(!initialUrl.includes('/login') && !initialUrl.includes('/callback'));

    // Global effects
    syncQueryParamsEffect({
      queryParams: computed(() => ({
        searchQuery: this.debouncedSearchQuery()
      }))
    })
  }
}
