import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'movie-detail-page',
  styleUrls: ['./movie-detail-page.component.css'],
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div></div>`,
})
export class MovieDetailPageComponent {}
