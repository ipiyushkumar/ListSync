export interface ConnectorMetadata {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  icon?: string;
  capabilities: ('search' | 'sync' | 'scrobble' | 'import' | 'export')[];
  authType: 'none' | 'api-key' | 'oauth' | 'cookie';
}

export interface MediaItem {
  title: string;
  category: 'anime' | 'manhwa' | 'movie' | 'tv' | 'music';
  description?: string;
  posterUrl?: string;
  totalEpisodes?: number;
  currentEp?: number;
  status?: string;
  rating?: number;
  genres?: string[];
  externalId?: string;
  externalSource?: string;
  streamingPlatforms?: string[];
}

export interface Connector {
  metadata(): ConnectorMetadata;
  search(query: string, category?: string): Promise<MediaItem[]>;
  getWatchlist?(): Promise<MediaItem[]>;
  getProgress?(externalId: string): Promise<{ currentEp: number; totalEpisodes?: number }>;
  updateProgress?(externalId: string, currentEp: number): Promise<void>;
  authenticate?(credentials: Record<string, string>): Promise<boolean>;
  isAuthenticated?(): boolean;
}
