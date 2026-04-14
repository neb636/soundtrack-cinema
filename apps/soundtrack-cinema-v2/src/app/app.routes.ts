import { Routes } from '@angular/router';
import { ShellComponent } from './core/layout/shell.component';

export const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/home/home.component').then(m => m.HomeComponent),
      },
      {
        path: 'track/:id',
        loadComponent: () =>
          import('./features/track-detail/track-detail.component')
            .then(m => m.TrackDetailComponent),
      },
      {
        path: 'movie/:id',
        loadComponent: () =>
          import('./features/movie-detail/movie-detail.component')
            .then(m => m.MovieDetailComponent),
      },
      {
        path: 'playlist',
        loadComponent: () =>
          import('./features/playlist/playlist.component')
            .then(m => m.PlaylistComponent),
      },
    ],
  },
  {
    path: 'callback',
    loadComponent: () =>
      import('./features/callback/callback.component')
        .then(m => m.CallbackComponent),
  },
  { path: '**', redirectTo: '' },
];
