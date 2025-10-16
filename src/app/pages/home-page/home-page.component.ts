import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'home-page',
  styleUrls: ['./home-page.component.css'],
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `

    @if (songSearchResource.value()?.length) {
    <section class="app-root__results-section">
    <h2 class="app-root__section-title">Select a Song</h2>
    <div class="app-root__song-grid">
    @for (song of songSearchResource.value(); track song.id) {
    <song-card
      [song]="song"
      (click)="applicationStateService.selectSong(song)"
    ></song-card>
    }
    </div>
    </section>
    }`,
})
export class HomePageComponent {}
