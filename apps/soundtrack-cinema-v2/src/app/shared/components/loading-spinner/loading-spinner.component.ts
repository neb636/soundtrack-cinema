import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading-spinner.component.html',
  styleUrl: './loading-spinner.component.css',
})
export class LoadingSpinnerComponent {
  size = input<'sm' | 'md' | 'lg'>('md');
  message = input('');

  get ariaLabel(): string {
    return this.message() || 'Loading';
  }

  get sizeClass(): string {
    return `spinner--${this.size()}`;
  }
}
