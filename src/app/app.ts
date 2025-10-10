import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  styleUrl: './app.css',
  template: `
    <h1>Welcome to {{ title() }}!</h1>

    <router-outlet />
  `,
})
export class App {
  protected readonly title = signal('movie-recommendations');
}
