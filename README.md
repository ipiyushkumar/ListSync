# ListSync

**Your unified media tracker** — track anime, manhwa, movies, TV shows, and music in one place.

## Features

- 📊 Dashboard with stats and progress tracking
- 🔍 Search across Jikan (anime), AniList (manhwa), TMDB (movies/TV)
- 📺 Category-specific views with filtering
- ⭐ Rating and status management
- 🔌 BYOI (Bring Your Own Integration) connector architecture
- 🌐 Chrome extension for auto-detection of streaming sites
- 🤖 MCP server for AI assistant integration
- 🎨 Modern dark theme with purple accents

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS v4, Redux Toolkit
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: SQLite
- **Icons**: Lucide React

## Getting Started

```bash
# Clone
git clone https://github.com/piyushdev2026/ListSync.git
cd ListSync

# Install (uses pnpm)
pnpm install

# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Start dev server
pnpm dev
```

Visit http://localhost:3000

## Production

```bash
# Build
pnpm build

# Start
pnpm start -- -p 3085
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | SQLite connection string |
| `TMDB_API_KEY` | No | TMDB API key for movie/TV search |
| `ANILIST_API_KEY` | No | AniList API key for higher rate limits |

## Chrome Extension

The extension auto-detects what you're watching on:
- Netflix
- Crunchyroll
- YouTube
- Spotify
- MyAnimeList
- AniList

Load `src/extension/` as an unpacked extension in Chrome.

## MCP Server

Integrate with AI assistants:

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
│   ├── lib/          # Utilities and connectors
│   │   └── connectors/  # BYOI connector implementations
│   ├── mcp/          # MCP server
│   ├── store/        # Redux store
│   ├── types/        # TypeScript types
│   └── extension/    # Chrome extension
├── scripts/          # Import and utility scripts
└── public/           # Static assets
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/media` | List media (filter by category, status) |
| POST | `/api/media` | Add new media |
| GET | `/api/media/[id]` | Get media details |
| PUT | `/api/media/[id]` | Update media |
| DELETE | `/api/media/[id]` | Delete media |
| GET | `/api/search` | Search external APIs |
| GET | `/api/stats` | Get library statistics |
| GET | `/api/settings` | Get settings |
| POST | `/api/settings` | Update settings |
| GET | `/api/connectors` | List available connectors |

## License

MIT
