export type MediaCategory = 'anime' | 'manhwa' | 'movie' | 'tv' | 'music';

export type MediaStatus = 'watching' | 'completed' | 'dropped' | 'planned' | 'on_hold';

export interface MediaItem {
  id: string;
  title: string;
  description?: string;
  category: MediaCategory;
  status: MediaStatus;
  rating?: number;
  coverImage?: string;
  totalEpisodes?: number;
  currentEpisode?: number;
  externalId?: string;
  externalSource?: string;
  genres?: string[];
  releaseDate?: string;
  streamingPlatforms?: StreamingPlatform[];
  createdAt: string;
  updatedAt: string;
}

export interface StreamingPlatform {
  name: string;
  url?: string;
  type?: 'sub' | 'dub' | 'both';
}

export interface SearchResult {
  id: string | number;
  title: string;
  description: string;
  category: MediaCategory;
  coverImage?: string;
  rating?: number;
  totalEpisodes?: number;
  genres?: string[];
  releaseDate?: string;
  streamingPlatforms?: StreamingPlatform[];
  source: string;
}
