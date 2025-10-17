import { effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ApplicationStateService } from '../services/application-state/application-state.service';

export const navigateOnSearchQueryChangeEffect = () => {
  const applicationStateService = inject(ApplicationStateService);
  const router = inject(Router);

  effect(() => {
     const debouncedSearchQuery = applicationStateService.debouncedSearchQuery();

     if (debouncedSearchQuery) {
       router.navigate(['/search-results'], { queryParams: { query: debouncedSearchQuery } });
     } else {
       router.navigate(['/']);
     }
  })
};
