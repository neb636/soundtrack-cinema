import { Routes } from '@angular/router';
import { ExplorePageComponent } from './pages/explore-page/explore-page.component';
import { SelectedSongPageComponent } from './pages/selected-song-page/selected-song-page.component';
import { MovieDetailPageComponent } from './pages/movie-detail-page/movie-detail-page.component';
import { LoginPageComponent } from './pages/login-page/login-page.component';
import { CallbackPageComponent } from './pages/callback-page/callback-page.component';
import { authGuard } from './common/guards/auth.guard';
import { AuthenticatedLayoutComponent } from './common/layouts/authenticated-layout/authenticated-layout.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginPageComponent,
    title: 'Login - Soundtrack Cinema'
  },
  {
    path: 'callback',
    component: CallbackPageComponent,
    title: 'Logging in...'
  },
  {
    path: '',
    component: AuthenticatedLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'explore',
        component: ExplorePageComponent,
        title: 'Explore'
      },
      {
        path: 'selected-song/:songName',
        component: SelectedSongPageComponent,
        title: 'Selected Song - Movie Recommendations'
      },
      {
        path: 'movie/:id',
        component: MovieDetailPageComponent,
        title: 'Movie Details - Movie Recommendations'
      },
      {
        path: '',
        redirectTo: 'explore',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];
