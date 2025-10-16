import { Routes } from '@angular/router';
import { HomePageComponent } from './pages/home-page/home-page.component';
import { SelectedSongPageComponent } from './pages/selected-song-page/selected-song-page.component';
import { MovieDetailComponent } from './pages/movie-detail/movie-detail.component';

export const routes: Routes = [
  {
    path: '',
    component: HomePageComponent,
    title: 'Home - Movie Recommendations'
  },
  {
    path: 'selected-song/:songName',
    component: SelectedSongPageComponent,
    title: 'Selected Song - Movie Recommendations'
  },
  {
    path: 'movie/:id',
    component: MovieDetailComponent,
    title: 'Movie Details - Movie Recommendations'
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
];
