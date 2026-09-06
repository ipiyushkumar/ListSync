import { Connector, ConnectorMetadata, MediaItem } from './types';

export class TMDBConnector implements Connector {
  private baseUrl = 'https://api.themoviedb.org/3';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  metadata(): ConnectorMetadata {
    return {
      id: 'tmdb',
      name: 'TMDB',
      description: 'Search movies and TV shows via TMDB API',
      version: '1.0.0',
      author: 'ListSync',
      capabilities: ['search'],
      authType: 'api-key',
    };
  }

  async search(query: string, category?: string): Promise<MediaItem[]> {
    const results: MediaItem[] = [];
    const searchMovie = !category || category === 'movie';
    const searchTV = !category || category === 'tv';

    if (searchMovie) {
      try {
        const res = await fetch(
          `${this.baseUrl}/search/movie?api_key=${this.apiKey}&query=${encodeURIComponent(query)}`,
        );
        if (res.ok) {
          const data = await res.json();
          for (const m of (data.results || []).slice(0, 5)) {
            results.push({
              title: m.title,
              category: 'movie',
              description: m.overview,
              posterUrl: m.poster_path
                ? `https://image.tmdb.org/t/p/w500${m.poster_path}`
                : undefined,
              rating: m.vote_average,
              genres: [],
              externalId: String(m.id),
              externalSource: 'tmdb-movie',
            });
          }
        }
      } catch {
        // silently ignore fetch failures
      }
    }
    if (searchTV) {
      try {
        const res = await fetch(
          `${this.baseUrl}/search/tv?api_key=${this.apiKey}&query=${encodeURIComponent(query)}`,
        );
        if (res.ok) {
          const data = await res.json();
          for (const t of (data.results || []).slice(0, 5)) {
            results.push({
              title: t.name,
              category: 'tv',
              description: t.overview,
              posterUrl: t.poster_path
                ? `https://image.tmdb.org/t/p/w500${t.poster_path}`
                : undefined,
              totalEpisodes: t.episode_count || 0,
              rating: t.vote_average,
              genres: [],
              externalId: String(t.id),
              externalSource: 'tmdb-tv',
            });
          }
        }
      } catch {
        // silently ignore fetch failures
      }
    }
    return results;
  }
}
