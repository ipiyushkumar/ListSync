import { Connector, ConnectorMetadata, MediaItem } from './types';

export class AniListConnector implements Connector {
  private endpoint = 'https://graphql.anilist.co';

  metadata(): ConnectorMetadata {
    return {
      id: 'anilist',
      name: 'AniList',
      description: 'Search manga/manhwa via AniList GraphQL API',
      version: '1.0.0',
      author: 'ListSync',
      capabilities: ['search'],
      authType: 'none',
    };
  }

  async search(query: string, category?: string): Promise<MediaItem[]> {
    const mediaType = category === 'manhwa' ? 'MANGA' : 'ANIME';
    const query_str = `
      query ($search: String, $type: MediaType) {
        Media(search: $search, type: $type) {
          id
          title { romaji english }
          description(asHtml: false)
          chapters
          episodes
          status
          startDate { year month day }
          coverImage { large }
          averageScore
          genres
          format
        }
      }
    `;
    const res = await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: query_str,
        variables: { search: query, type: mediaType },
      }),
    });
    if (!res.ok) throw new Error(`AniList API error: ${res.status}`);
    const data = await res.json();
    const media = data.data?.Media;
    if (!media) return [];
    return [
      {
        title: media.title?.english || media.title?.romaji || '',
        category:
          media.format === 'MANGA' || media.format === 'MANHWA'
            ? 'manhwa'
            : 'anime',
        description: media.description || '',
        posterUrl: media.coverImage?.large,
        totalEpisodes: media.episodes || media.chapters || 0,
        status: media.status?.toLowerCase(),
        rating: media.averageScore || 0,
        genres: media.genres || [],
        externalId: String(media.id),
        externalSource: 'anilist',
      },
    ];
  }
}
