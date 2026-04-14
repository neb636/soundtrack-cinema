import { Component, input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.css',
})
export class EmptyStateComponent {
  icon = input('🎬');
  title = input.required<string>();
  message = input('');
  actionLabel = input('');

  @Output() action = new EventEmitter<void>();

  onAction(): void {
    this.action.emit();
  }
}
