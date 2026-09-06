import { Connector, ConnectorMetadata } from './connectors/types';
import { JikanConnector } from './connectors/jikan';
import { AniListConnector } from './connectors/anilist';
import { TMDBConnector } from './connectors/tmdb';

class ConnectorRegistry {
  private connectors: Map<string, Connector> = new Map();

  constructor() {
    // Register built-in connectors
    this.register(new JikanConnector());
    this.register(new AniListConnector());
  }

  register(connector: Connector): void {
    const meta = connector.metadata();
    this.connectors.set(meta.id, connector);
  }

  get(id: string): Connector | undefined {
    return this.connectors.get(id);
  }

  list(): ConnectorMetadata[] {
    return Array.from(this.connectors.values()).map((c) => c.metadata());
  }

  getTMDB(apiKey: string): TMDBConnector {
    const existing = this.connectors.get('tmdb');
    if (existing) return existing as TMDBConnector;
    const tmdb = new TMDBConnector(apiKey);
    this.register(tmdb);
    return tmdb;
  }

  async searchAll(
    query: string,
    category?: string,
  ): Promise<
    { connector: string; results: Awaited<ReturnType<Connector['search']>> }[]
  > {
    const promises = Array.from(this.connectors.values()).map(async (c) => {
      try {
        const results = await c.search(query, category);
        return { connector: c.metadata().id, results };
      } catch {
        return { connector: c.metadata().id, results: [] };
      }
    });
    return Promise.all(promises);
  }
}

export const registry = new ConnectorRegistry();
export type { Connector, ConnectorMetadata, MediaItem } from './connectors/types';
