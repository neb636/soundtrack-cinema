import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `
    <h1>Welcome to {{ title() }}!</h1>

    <router-outlet />
  `,
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('movie-recommendations');
}
