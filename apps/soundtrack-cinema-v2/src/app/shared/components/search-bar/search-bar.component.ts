import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.css',
})
export class SearchBarComponent {
  @Input() placeholder = 'Search songs or artists...';
  @Input() value = '';
  @Input() disabled = false;

  @Output() queryChange = new EventEmitter<string>();
  @Output() cleared = new EventEmitter<void>();
  @Output() disabledClick = new EventEmitter<void>();

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  get hasValue(): boolean {
    return this.value.length > 0;
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.queryChange.emit(this.value);
  }

  onClear(): void {
    this.value = '';
    this.queryChange.emit('');
    this.cleared.emit();
    this.searchInput?.nativeElement.focus();
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.onClear();
    }
  }

  onDisabledClick(): void {
    this.disabledClick.emit();
  }

  onDisabledKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.disabledClick.emit();
    }
  }
}
