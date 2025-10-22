import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'song-card',
  styleUrls: ['./song-card.component.css'],
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="song-card">
    @if (song()?.albumImage) {
      <img [src]="song()?.albumImage" [alt]="song()?.name" class="song-card__image" />
    }
    <div class="song-card__info">
      <h3 class="song-card__name">{{ song()?.name }}</h3>
      <p class="song-card__artists">{{ song()?.artists?.join(', ') }}</p>
      <p class="song-card__album">{{ song()?.album }}</p>
    </div>
  </div>`,
})
export class SongCardComponent {
  song = input<any>();
}
