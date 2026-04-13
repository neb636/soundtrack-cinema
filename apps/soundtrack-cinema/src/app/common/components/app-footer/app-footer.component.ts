import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-footer',
  styleUrls: ['./app-footer.component.css'],
  imports: [CommonModule],
  template: `<footer class="app-footer">
    <p>Powered by Spotify & TMDb APIs</p>
  </footer>`,
})
export class AppFooterComponent {}
