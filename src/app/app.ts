import { ChangeDetectionStrategy, Component} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { AppHeaderComponent } from './common/components/app-header/app-header.component';
import { AppFooterComponent } from './common/components/app-footer/app-footer.component';
import { useUpdateNavigationOnSearchQueryChange } from './common/effects/use-update-navigation-on-search-query-change';

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

  constructor() {
    // Global routing effects
    useUpdateNavigationOnSearchQueryChange()
  }
}
