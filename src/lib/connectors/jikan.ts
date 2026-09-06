import { Connector, ConnectorMetadata, MediaItem } from './types';

export class JikanConnector implements Connector {
  private baseUrl = 'https://api.jikan.moe/v4';

  metadata(): ConnectorMetadata {
    return {
      id: 'jikan',
      name: 'MyAnimeList (Jikan)',
      description: 'Search anime via the Jikan API (unofficial MAL)',
      version: '1.0.0',
      author: 'ListSync',
      capabilities: ['search'],
      authType: 'none',
    };
  }

  async search(query: string): Promise<MediaItem[]> {
    const res = await fetch(`${this.baseUrl}/anime?q=${encodeURIComponent(query)}&limit=10`);
    if (!res.ok) throw new Error(`Jikan API error: ${res.status}`);
    const data = await res.json();
    return (data.data || []).map((a: Record<string, unknown>) => ({
      title: (a.title as string) || '',
      category: 'anime' as const,
      description: (a.synopsis as string) || '',
      posterUrl:
        a.images &&
        typeof a.images === 'object' &&
        (a.images as Record<string, Record<string, string>>).jpg?.large_image_url,
      totalEpisodes: (a.episodes as number) || 0,
      status: a.status as string,
      rating: (a.score as number) || 0,
      genres: Array.isArray(a.genres)
        ? a.genres.map((g: Record<string, string>) => g.name)
        : [],
      externalId: String(a.mal_id),
      externalSource: 'mal',
    }));
  }
}
