import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

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

  `,
})
export class AppHeaderComponent { }
