# ListSync Media Detector — Chrome Extension

Auto-detects what you're watching, reading, or listening to and syncs it with the ListSync backend.

## Installation

1. Open **chrome://extensions** in your Chrome browser.
2. Enable **Developer mode** (toggle in the top-right corner).
3. Click **Load unpacked**.
4. Select the `src/extension` folder from this project.
5. The ListSync icon will appear in your toolbar.

## How It Works

The extension automatically detects media on these platforms:

| Platform         | What's Detected                                      |
| ---------------- | ---------------------------------------------------- |
| **Netflix**      | Show/movie title, episode number                     |
| **Crunchyroll**  | Anime title, episode number                          |
| **YouTube**      | Video title, category (anime/movie review detection) |
| **Spotify**      | Track name, artist                                   |
| **MyAnimeList**  | Anime/manga title, chapter/episode                   |
| **AniList**      | Anime/manga title, chapter/episode                   |

### Generic fallback

For any other site, the extension reads `og:title`, `og:description`, and `og:type` meta tags to infer what you're consuming.

### Category inference

The extension tries to classify detected media into categories:
- `anime` — anime episodes, Crunchyroll, MAL, AniList
- `manga` — manga chapters
- `music` — songs, albums, Spotify
- `movie` — films
- `show` — TV series, Netflix
- `unknown` — couldn't determine

## Popup UI

Click the extension icon to see:
- **Currently detected media** (title, platform, episode)
- **"Add to Watchlist"** button — saves to your ListSync watchlist
- **"Open Dashboard"** link — opens the ListSync web dashboard
- **Connection status** — green dot = backend reachable at `localhost:3085`

## Backend Communication

Detected media is automatically POSTed to:
```
POST http://localhost:3885/api/activity
```

Payload shape:
```json
{
  "title": "Attack on Titan",
  "category": "anime",
  "platform": "crunchyroll",
  "episode": 12,
  "url": "https://www.crunchyroll.com/watch/GRDQPM10Y/...",
  "timestamp": 1700000000000
}
```

Make sure the ListSync backend server is running on port **3085** for detection to work.

## Alarm / Polling

The background service worker sets a 30-second alarm that:
1. Queries the current active tab
2. Injects the content script if it hasn't been loaded yet
3. Ensures detection works even on tabs opened before the extension

## Development

All source files are plain JavaScript (no build step required):
- `manifest.json` — Chrome Manifest V3
- `background.js` — Service worker (alarms, backend sync, storage)
- `content.js` — Injected into streaming sites
- `popup.html` / `popup.js` / `style.css` — Extension popup UI

To reload after changes: go to `chrome://extensions` and click the reload icon on the ListSync card.
