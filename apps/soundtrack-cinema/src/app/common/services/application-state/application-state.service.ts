import { Injectable, signal } from '@angular/core';
import { useDebouncedSignal } from '../../composables/use-debounced-signal.composable';

@Injectable({ providedIn: 'root' })
export class ApplicationStateService {
  searchQuery = signal('');
  debouncedSearchQuery = useDebouncedSignal(this.searchQuery, 600);
  selectedSong = signal<any | null>(null);

  setSearchQuery(query: string) {
    this.searchQuery.set(query);
    this.selectedSong.set(null);
  }

  selectSong(song: any) {
    this.selectedSong.set(song);
  }

  clearSelection() {
    this.selectedSong.set(null);
    this.searchQuery.set('');
  }
}
