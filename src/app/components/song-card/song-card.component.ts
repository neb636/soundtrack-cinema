import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MappedSpotifyTrack } from '../../services/spotify-api/types';

@Component({
  selector: 'song-card',
  styleUrls: ['./song-card.component.css'],
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="song-card">
    @if (song()?.albumImage) {
      <img [src]="song()?.albumImage" [alt]="song()?.name" class="song-image" />
    }
    <div class="song-info">
      <h3 class="song-name">{{ song()?.name }}</h3>
      <p class="song-artists">{{ song()?.artists?.join(', ') }}</p>
      <p class="song-album">{{ song()?.album }}</p>
    </div>
  </div>`,
})
export class SongCardComponent {
  song = input<MappedSpotifyTrack>();
}
