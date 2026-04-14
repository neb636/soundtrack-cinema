import { Pipe, PipeTransform } from '@angular/core';
import { ImageSize } from '../../../../spec/contracts/types';

@Pipe({ name: 'tmdbImage', standalone: true })
export class TmdbImagePipe implements PipeTransform {
  transform(path: string | null | undefined, size: ImageSize = 'w500'): string {
    if (!path) return '/assets/no-poster.svg';
    return `https://image.tmdb.org/t/p/${size}${path}`;
  }
}
