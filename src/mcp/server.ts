#!/usr/bin/env node

/**
 * ListSync MCP Server
 * 
 * Exposes ListSync media tracking tools to AI agents via the Model Context Protocol.
 * Run: npx tsx src/mcp/server.ts
 * 
 * Configure in Claude Desktop / Cursor / etc:
 * {
 *   "mcpServers": {
 *     "listsync": {
 *       "command": "npx",
 *       "args": ["tsx", "/path/to/ListSync/src/mcp/server.ts"]
 *     }
 *   }
 * }
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const BACKEND_URL = process.env.LISTSYNC_URL || 'http://localhost:3085';

async function apiCall(path: string, options?: RequestInit) {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

const server = new McpServer({
  name: 'ListSync',
  version: '1.0.0',
});

// ─── Search Media ───────────────────────────────────────────
server.tool(
  'search_media',
  'Search for anime, manhwa, movies, TV shows, or music across external APIs',
  {
    query: z.string().describe('The title to search for'),
    category: z.enum(['anime', 'manhwa', 'movie', 'tv', 'music']).optional().describe('Filter by category'),
  },
  async ({ query, category }) => {
    const params = new URLSearchParams({ q: query });
    if (category) params.set('category', category);
    const results = await apiCall(`/api/search?${params}`);
    return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
  }
);

// ─── Get Watchlist ──────────────────────────────────────────
server.tool(
  'get_watchlist',
  'Get the user\'s watchlist, optionally filtered by category or status',
  {
    category: z.enum(['anime', 'manhwa', 'movie', 'tv', 'music']).optional().describe('Filter by category'),
    status: z.enum(['watching', 'completed', 'dropped', 'planned', 'on_hold', 'on-hold']).optional().describe('Filter by status'),
    limit: z.number().optional().describe('Max items to return (default 50)'),
  },
  async ({ category, status, limit }) => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (status) params.set('status', status);
    if (limit) params.set('limit', String(limit));
    const results = await apiCall(`/api/media?${params}`);
    return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
  }
);

// ─── Get Media Detail ───────────────────────────────────────
server.tool(
  'get_media',
  'Get detailed information about a specific media item by ID',
  {
    id: z.string().describe('The media item ID'),
  },
  async ({ id }) => {
    const result = await apiCall(`/api/media/${id}`);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

// ─── Add to Watchlist ───────────────────────────────────────
server.tool(
  'add_to_watchlist',
  'Add a media title to the watchlist',
  {
    title: z.string().describe('Media title'),
    category: z.enum(['anime', 'manhwa', 'movie', 'tv', 'music']).describe('Media category'),
    status: z.enum(['watching', 'completed', 'dropped', 'planned', 'on_hold', 'on-hold']).default('planned'),
    description: z.string().optional(),
    posterUrl: z.string().optional(),
    totalEpisodes: z.number().optional(),
    rating: z.number().optional(),
    genres: z.array(z.string()).optional(),
    externalId: z.string().optional(),
    externalSource: z.string().optional(),
  },
  async ({ title, category, status, ...rest }) => {
    const result = await apiCall('/api/media', {
      method: 'POST',
      body: JSON.stringify({ title, category, status, ...rest }),
    });
    return { content: [{ type: 'text', text: `Added "${title}" to ${category} list. ID: ${result.id}` }] };
  }
);

// ─── Update Progress ────────────────────────────────────────
server.tool(
  'update_progress',
  'Update episode/chapter progress for a media item',
  {
    id: z.string().describe('Media item ID'),
    currentEp: z.number().describe('Current episode/chapter number'),
    status: z.enum(['watching', 'completed', 'dropped', 'planned', 'on_hold', 'on-hold']).optional(),
  },
  async ({ id, currentEp, status }) => {
    const body: Record<string, unknown> = { currentEp };
    if (status) body.status = status;
    const result = await apiCall(`/api/media/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    return { content: [{ type: 'text', text: `Updated progress to EP ${currentEp}. Status: ${result.status || 'unchanged'}` }] };
  }
);

// ─── Update Status ──────────────────────────────────────────
server.tool(
  'update_status',
  'Change the status of a media item',
  {
    id: z.string().describe('Media item ID'),
    status: z.enum(['watching', 'completed', 'dropped', 'planned', 'on_hold', 'on-hold']).describe('New status'),
  },
  async ({ id, status }) => {
    const result = await apiCall(`/api/media/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    return { content: [{ type: 'text', text: `Updated "${result.title}" status to ${status}` }] };
  }
);

// ─── Delete Media ───────────────────────────────────────────
server.tool(
  'delete_media',
  'Remove a media item from the watchlist',
  {
    id: z.string().describe('Media item ID'),
  },
  async ({ id }) => {
    await apiCall(`/api/media/${id}`, { method: 'DELETE' });
    return { content: [{ type: 'text', text: `Deleted media item ${id}` }] };
  }
);

// ─── Get Stats ──────────────────────────────────────────────
server.tool(
  'get_stats',
  'Get watchlist statistics: counts by category and status',
  {},
  async () => {
    const anime = await apiCall('/api/media?category=anime');
    const manhwa = await apiCall('/api/media?category=manhwa');
    const movie = await apiCall('/api/media?category=movie');
    const tv = await apiCall('/api/media?category=tv');
    const music = await apiCall('/api/media?category=music');

    const stats = {
      anime: { total: anime.length, watching: anime.filter((m: { status: string }) => m.status === 'watching').length, completed: anime.filter((m: { status: string }) => m.status === 'completed').length },
      manhwa: { total: manhwa.length, watching: manhwa.filter((m: { status: string }) => m.status === 'watching').length, completed: manhwa.filter((m: { status: string }) => m.status === 'completed').length },
      movies: { total: movie.length, watching: movie.filter((m: { status: string }) => m.status === 'watching').length, completed: movie.filter((m: { status: string }) => m.status === 'completed').length },
      tv: { total: tv.length, watching: tv.filter((m: { status: string }) => m.status === 'watching').length, completed: tv.filter((m: { status: string }) => m.status === 'completed').length },
      music: { total: music.length, watching: music.filter((m: { status: string }) => m.status === 'watching').length, completed: music.filter((m: { status: string }) => m.status === 'completed').length },
      grandTotal: anime.length + manhwa.length + movie.length + tv.length + music.length,
    };

    return { content: [{ type: 'text', text: JSON.stringify(stats, null, 2) }] };
  }
);

// ─── Log Activity ───────────────────────────────────────────
server.tool(
  'log_activity',
  'Log a watch/read/listen activity for a media item',
  {
    mediaId: z.string().describe('Media item ID'),
    action: z.enum(['watched', 'read', 'listened']).describe('Activity type'),
    episode: z.number().optional().describe('Episode/chapter number'),
    source: z.enum(['manual', 'auto', 'extension']).default('manual'),
  },
  async ({ mediaId, action, episode, source }) => {
    const result = await apiCall('/api/activity', {
      method: 'POST',
      body: JSON.stringify({ mediaId, action, episode, source }),
    });
    return { content: [{ type: 'text', text: `Logged activity: ${action} (EP ${episode || '?'}) for media ${mediaId}` }] };
  }
);

// ─── Start Server ───────────────────────────────────────────
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('ListSync MCP server running on stdio');
}

main().catch((err) => {
  console.error('Failed to start MCP server:', err);
  process.exit(1);
});
