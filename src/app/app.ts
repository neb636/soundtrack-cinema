import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { AppHeaderComponent } from './common/components/app-header/app-header.component';
import { AppFooterComponent } from './common/components/app-footer/app-footer.component';
import { syncQueryParamsEffect } from './common/effects/sync-query-params.effect';
import { ApplicationStateService } from './common/services/application-state/application-state.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, AppHeaderComponent, AppFooterComponent],
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
   <app-header></app-header>

   <main class="app-root__main-content">
     <router-outlet></router-outlet>
   </main>

   <app-footer></app-footer>
  `,
})
export class App {
  applicationStateService = inject(ApplicationStateService);

  debouncedSearchQuery = this.applicationStateService.debouncedSearchQuery;

  constructor() {

    // Global effects
    syncQueryParamsEffect({
      queryParams: computed(() => ({
        searchQuery: this.debouncedSearchQuery()
      }))
    })
  }
}
