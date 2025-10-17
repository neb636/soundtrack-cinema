import { Routes } from '@angular/router';
import { HomePageComponent } from './pages/home-page/home-page.component';
import { SelectedSongPageComponent } from './pages/selected-song-page/selected-song-page.component';
import { MovieDetailPageComponent } from './pages/movie-detail-page/movie-detail-page.component';
import { SearchResultsPageComponent } from './pages/search-results-page/search-results-page.component';

export const routes: Routes = [
  {
    path: '',
    component: HomePageComponent,
    title: 'Home - Movie Recommendations'
  },
  {
    path: 'search-results',
    component: SearchResultsPageComponent,
    title: 'Search Results - Movie Recommendations'
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
    redirectTo: '',
    pathMatch: 'full'
  }
];
