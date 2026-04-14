import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.css',
})
export class EmptyStateComponent {
  @Input() icon = '🎬';
  @Input({ required: true }) title!: string;
  @Input() message = '';
  @Input() actionLabel = '';

  @Output() action = new EventEmitter<void>();

  onAction(): void {
    this.action.emit();
  }
}
