import { Injectable, signal } from '@angular/core';
import { MappedSpotifyTrack } from '../legacy-spotify-api/types';
import { useDebouncedSignal } from '../../composables/use-debounced-signal.composable';

@Injectable({ providedIn: 'root' })
export class ApplicationStateService {
  searchQuery = signal('');
  debouncedSearchQuery = useDebouncedSignal(this.searchQuery, 600);
  selectedSong = signal<MappedSpotifyTrack | null>(null);

  setSearchQuery(query: string) {
    this.searchQuery.set(query);
    this.selectedSong.set(null);
  }

  selectSong(song: MappedSpotifyTrack) {
    this.selectedSong.set(song);
  }

  clearSelection() {
    this.selectedSong.set(null);
    this.searchQuery.set('');
  }
}
