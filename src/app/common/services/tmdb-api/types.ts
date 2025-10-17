export interface Movie {
  id: number;
  title: string;
  overview: string;
  releaseDate: string;
  rating: number;
  voteCount: number;
  posterPath: string;
  backdropPath: string;
  genres: string[];
}
