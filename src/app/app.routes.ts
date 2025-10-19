import { Routes } from '@angular/router';
import { ExplorePageComponent } from './pages/explore-page/explore-page.component';
import { SelectedSongPageComponent } from './pages/selected-song-page/selected-song-page.component';
import { MovieDetailPageComponent } from './pages/movie-detail-page/movie-detail-page.component';

export const routes: Routes = [
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
    path: '**',
    redirectTo: 'explore',
    pathMatch: 'full'
  }
];
