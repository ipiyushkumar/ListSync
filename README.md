# ListSync

**Your unified media tracker** — track anime, manhwa, movies, TV shows, and music in one place.

## Features

- Dashboard with stats and progress tracking
- Search across AniList (anime/manhwa), Jikan (anime fallback), TMDB (movies/TV)
- Category-specific views with filtering and sorting
- Rating and status management
- BYOI (Bring Your Own Integration) connector architecture
- Chrome extension for auto-detection of streaming sites
- MCP server for AI assistant integration (Claude Desktop, Cursor)
- Modern dark theme with purple accents

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS v4
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: SQLite
- **State**: Zustand
- **Icons**: Lucide React

## Getting Started

```bash
# Clone
git clone https://github.com/ipiyushkumar/ListSync.git
cd ListSync

# Install (uses pnpm)
pnpm install --config.onlyBuiltDependencies='["@prisma/client","@prisma/engines","prisma"]'

# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Start dev server
pnpm dev
```

Visit http://localhost:3085

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TMDB_API_KEY` | No | TMDB API key for movie/TV search (set in Settings page) |

AniList and Jikan APIs work without API keys.

## Chrome Extension

The extension auto-detects what you're watching on:
- Netflix
- Crunchyroll
- YouTube / YouTube Music
- MyAnimeList
- AniList

Load `src/extension/` as an unpacked extension in Chrome.

## MCP Server

Integrate with AI assistants (Claude Desktop, Cursor):

```json
{
  "mcpServers": {
    "listsync": {
      "command": "npx",
      "args": ["tsx", "src/mcp/server.ts"]
    }
  }
}
```

## Project Structure

```
ListSync/
├── prisma/           # Database schema and migrations
├── src/
│   ├── app/          # Next.js pages and API routes
│   ├── components/   # Reusable UI components
│   │   └── media/    # Media-specific components
│   ├── lib/          # Utilities, Prisma client, store
│   ├── mcp/          # MCP server
│   └── extension/    # Chrome extension
├── scripts/          # Utility scripts
└── public/           # Static assets
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/media` | List media (filter by category, status) |
| POST | `/api/media` | Add new media (upsert by externalId) |
| GET | `/api/media/[id]` | Get media details |
| PUT | `/api/media/[id]` | Update media |
| DELETE | `/api/media/[id]` | Delete media |
| GET | `/api/search` | Search external APIs (AniList, Jikan, TMDB) |
| GET | `/api/stats` | Get library statistics |
| GET | `/api/settings` | Get settings |
| POST | `/api/settings` | Update settings |
| GET | `/api/connectors` | List available connectors |
| POST | `/api/connectors` | Toggle connector state |
| GET | `/api/activity` | Activity log |

## License

MIT
