import { Routes } from '@angular/router';
import { ExplorePageComponent } from './pages/explore-page/explore-page.component';
import { SelectedSongPageComponent } from './pages/selected-song-page/selected-song-page.component';
import { MovieDetailPageComponent } from './pages/movie-detail-page/movie-detail-page.component';
import { LoginPageComponent } from './pages/login-page/login-page.component';
import { CallbackPageComponent } from './pages/callback-page/callback-page.component';
import { authGuard } from './common/guards/auth.guard';

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
    path: 'explore',
    component: ExplorePageComponent,
    canActivate: [authGuard],
    title: 'Explore'
  },
  {
    path: 'selected-song/:songName',
    component: SelectedSongPageComponent,
    canActivate: [authGuard],
    title: 'Selected Song - Movie Recommendations'
  },
  {
    path: 'movie/:id',
    component: MovieDetailPageComponent,
    canActivate: [authGuard],
    title: 'Movie Details - Movie Recommendations'
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];
