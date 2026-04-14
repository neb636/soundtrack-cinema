import { Component, input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpotifyTrack } from '../../../../../spec/contracts/types';
import { DurationPipe } from '../../pipes/duration.pipe';

@Component({
  selector: 'app-track-card',
  standalone: true,
  imports: [CommonModule, DurationPipe],
  templateUrl: './track-card.component.html',
  styleUrl: './track-card.component.css',
})
export class TrackCardComponent {
  track = input.required<SpotifyTrack>();

  @Output() selected = new EventEmitter<SpotifyTrack>();

  get albumArtUrl(): string {
    const images = this.track().album.images;
    if (!images || images.length === 0) return '/assets/no-album.svg';
    // Prefer a mid-size image (index 1 is typically 300x300), fallback to first
    return images[1]?.url ?? images[0].url;
  }

  get artistNames(): string {
    return this.track().artists.map((a) => a.name).join(', ');
  }

  onSelect(): void {
    this.selected.emit(this.track());
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.onSelect();
    }
  }
}
