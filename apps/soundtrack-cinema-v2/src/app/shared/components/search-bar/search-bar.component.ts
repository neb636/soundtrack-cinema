import { Component, input, linkedSignal, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
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
  placeholder = input('Search songs or artists...');
  value = input('');
  disabled = input(false);

  protected _value = linkedSignal(() => this.value());

  @Output() queryChange = new EventEmitter<string>();
  @Output() cleared = new EventEmitter<void>();
  @Output() disabledClick = new EventEmitter<void>();

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  get hasValue(): boolean {
    return this._value().length > 0;
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this._value.set(target.value);
    this.queryChange.emit(this._value());
  }

  onClear(): void {
    this._value.set('');
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
