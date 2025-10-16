import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ApplicationStateService } from '../../services/application-state/application-state.service';

@Component({
  standalone: true,
  selector: 'app-header',
  styleUrls: ['./app-header.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: ` <header class="app-header">
      <div class="app-header__content">
        <h1 class="app-header__title">🎬 Soundtrack Cinema</h1>
        <p class="app-header__tagline">Discover movies featuring your favorite songs</p>
      </div>
    </header>

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
    </section>`,
})
export class AppHeaderComponent {
  applicationStateService = inject(ApplicationStateService);
  searchQuery = this.applicationStateService.searchQuery.asReadonly();
}
