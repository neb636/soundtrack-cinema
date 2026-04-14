import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-rating-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rating-badge.component.html',
  styleUrl: './rating-badge.component.css',
})
export class RatingBadgeComponent {
  rating = input.required<number>();

  get colorClass(): string {
    if (this.rating() >= 8.0) return 'rating--success';
    if (this.rating() >= 6.0) return 'rating--accent';
    return 'rating--secondary';
  }

  get displayRating(): string {
    return this.rating().toFixed(1);
  }
}
