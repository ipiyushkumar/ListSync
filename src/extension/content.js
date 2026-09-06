// ListSync Media Detector - Content Script
// Injected into streaming / media sites to extract what the user is consuming.

(function () {
  'use strict';

  let lastDetected = null;
  let debounceTimer = null;

  // ── Platform detection ────────────────────────────────────────────────────

  function detectPlatform() {
    const host = window.location.hostname;
    if (host.includes('netflix.com')) return 'netflix';
    if (host.includes('crunchyroll.com')) return 'crunchyroll';
    if (host.includes('music.youtube.com')) return 'youtube_music';
    if (host.includes('youtube.com')) return 'youtube';
    if (host.includes('spotify.com')) return 'spotify';
    if (host.includes('myanimelist.net')) return 'mal';
    if (host.includes('anilist.co')) return 'anilist';
    return 'unknown';
  }

  // ── Extractors per platform ───────────────────────────────────────────────

  const extractors = {
    netflix() {
      let title = null;
      let episode = null;

      // Try visible title elements first
      const titleEl =
        document.querySelector('.video-title') ||
        document.querySelector('[data-uia="video-detail-header-title"]') ||
        document.querySelector('.preview-modal--player-title-treatment-line');
      if (titleEl) title = titleEl.textContent.trim();

      // Fallback: meta tags
      if (!title) {
        const meta = document.querySelector('meta[name="og:title"]');
        if (meta) title = meta.getAttribute('content');
      }

      // Episode detection from URL: /title/80123456 → episode from hash or query
      const urlMatch = window.location.href.match(/\/title\/(\d+)/);
      if (urlMatch) {
        // Netflix embeds episode info in the hash: #t= or ?episode=
        const epMatch = window.location.hash.match(/ep(?:isode)?[=:]?\s*(\d+)/i);
        if (epMatch) episode = parseInt(epMatch[1], 10);
      }

      // Also check breadcrumb / page text for "S1:E3" patterns
      if (!episode) {
        const bodyText = document.body?.innerText || '';
        const seMatch = bodyText.match(/S(\d+):E(\d+)/i);
        if (seMatch) episode = parseInt(seMatch[2], 10);
      }

      return { title, episode, category: 'tv' };
    },

    crunchyroll() {
      let title = null;
      let episode = null;

      const titleEl =
        document.querySelector('.show-title-rating h1') ||
        document.querySelector('.title') ||
        document.querySelector('[class*="ShowTitle"]');
      if (titleEl) title = titleEl.textContent.trim();

      if (!title) {
        const meta = document.querySelector('meta[property="og:title"]');
        if (meta) title = meta.getAttribute('content');
      }

      // Episode from URL: /watch/GRXXX episode 5
      const epMatch = window.location.href.match(/episode[=-]?(\d+)/i);
      if (epMatch) episode = parseInt(epMatch[1], 10);

      // Also try page text
      if (!episode) {
        const epEl = document.querySelector('.episode-title, [class*="EpisodeNumber"]');
        if (epEl) {
          const m = epEl.textContent.match(/Episode\s+(\d+)/i);
          if (m) episode = parseInt(m[1], 10);
        }
      }

      return { title, episode, category: 'anime' };
    },

    youtube() {
      let title = null;
      let episode = null;

      // Primary: heading element
      const h1 = document.querySelector('h1.ytd-watch-metadata, h1.ytd-video-primary-info-renderer');
      if (h1) title = h1.textContent.trim();

      if (!title) {
        const meta = document.querySelector('meta[name="title"]');
        if (meta) title = meta.getAttribute('content');
      }
      if (!title) {
        const og = document.querySelector('meta[property="og:title"]');
        if (og) title = og.getAttribute('content');
      }

      // Try to detect if it's an anime review / episode reaction
      const desc = document.querySelector('meta[property="og:description"]')?.getAttribute('content') || '';
      const fullText = (title || '') + ' ' + desc;
      const category = inferCategory(fullText, 'youtube');

      return { title, episode, category };
    },

    spotify() {
      let title = null;
      let artist = null;

      const trackEl = document.querySelector('[data-testid="track-name"], .track-name, [class*="TrackName"]');
      if (trackEl) title = trackEl.textContent.trim();

      const artistEl = document.querySelector('[data-testid="artist-name"], .artist-name, [class*="ArtistName"]');
      if (artistEl) artist = artistEl.textContent.trim();

      if (!title) {
        const meta = document.querySelector('meta[property="og:title"]');
        if (meta) title = meta.getAttribute('content');
      }

      return {
        title,
        artist,
        episode: null,
        category: 'music'
      };
    },

    youtube_music() {
      let title = null;
      let artist = null;

      // YouTube Music uses different selectors than regular YouTube
      const songEl = document.querySelector('yt-formatted-string.title, .song-title, [class*="song-title"]');
      if (songEl) title = songEl.textContent.trim();

      const artistEl = document.querySelector('.byline-wrapper a, [class*="artist"] a, yt-formatted-string.byline');
      if (artistEl) artist = artistEl.textContent.trim();

      if (!title) {
        const meta = document.querySelector('meta[property="og:title"]');
        if (meta) title = meta.getAttribute('content');
      }
      if (!title) title = document.title.replace(' - YouTube Music', '').trim();

      return {
        title: artist ? `${artist} - ${title}` : title,
        artist,
        episode: null,
        category: 'music'
      };
    },

    mal() {
      let title = null;
      let episode = null;

      const heading = document.querySelector('h1.h2, h1[data-title], h1');
      if (heading) title = heading.textContent.trim();

      // Chapter/episode from page context
      const bodyText = document.body?.innerText || '';
      const chapMatch = bodyText.match(/Chapter\s+(\d+)/i);
      const epMatch = bodyText.match(/Episode\s+(\d+)/i);
      if (epMatch) episode = parseInt(epMatch[1], 10);
      else if (chapMatch) episode = parseInt(chapMatch[1], 10);

      const category = inferCategory(title || '', 'mal');
      return { title, episode, category };
    },

    anilist() {
      let title = null;
      let episode = null;

      const heading = document.querySelector('h1, .title, [class*="Title"]');
      if (heading) title = heading.textContent.trim();

      if (!title) {
        const meta = document.querySelector('meta[property="og:title"]');
        if (meta) title = meta.getAttribute('content');
      }

      const bodyText = document.body?.innerText || '';
      const epMatch = bodyText.match(/Episode\s+(\d+)/i);
      if (epMatch) episode = parseInt(epMatch[1], 10);

      const category = inferCategory(title || '', 'anilist');
      return { title, episode, category };
    },

    generic() {
      let title = null;
      let description = null;
      let ogType = null;

      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) title = ogTitle.getAttribute('content');

      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) description = ogDesc.getAttribute('content');

      const ogTypeEl = document.querySelector('meta[property="og:type"]');
      if (ogTypeEl) ogType = ogTypeEl.getAttribute('content');

      const metaTitle = document.querySelector('meta[name="title"]');
      if (!title && metaTitle) title = metaTitle.getAttribute('content');
      if (!title) title = document.title;

      const fullText = (title || '') + ' ' + (description || '');
      const category = inferCategory(fullText, 'generic');

      return { title, episode: null, category, ogType };
    }
  };

  // ── Category inference ────────────────────────────────────────────────────

  function inferCategory(text, platform) {
    const lower = (text || '').toLowerCase();

    const animeKeywords = ['anime', 'episode', 'sub', 'dub', 'crunchyroll', 'season'];
    const mangaKeywords = ['manga', 'chapter', 'read', 'manhwa', 'manhua'];
    const musicKeywords = ['song', 'album', 'track', 'artist', 'spotify', 'music'];
    const movieKeywords = ['movie', 'film', 'cinema', 'watch'];
    const showKeywords = ['series', 'season', 'episode', 'show', 'netflix'];

    if (platform === 'spotify' || platform === 'youtube_music') return 'music';
    if (platform === 'crunchyroll' || platform === 'mal' || platform === 'anilist') return 'anime';
    if (platform === 'netflix') return 'tv';

    if (animeKeywords.some((k) => lower.includes(k))) return 'anime';
    if (mangaKeywords.some((k) => lower.includes(k))) return 'manga';
    if (musicKeywords.some((k) => lower.includes(k))) return 'music';
    if (movieKeywords.some((k) => lower.includes(k))) return 'movie';
    if (showKeywords.some((k) => lower.includes(k))) return 'show';

    return 'unknown';
  }

  // ── Main detection & reporting ────────────────────────────────────────────

  function detectAndReport() {
    const platform = detectPlatform();
    const extractor = extractors[platform] || extractors.generic;
    const info = extractor();

    if (!info.title) return; // nothing to report

    const mediaInfo = {
      title: info.title,
      category: info.category || 'unknown',
      platform,
      episode: info.episode || null,
      artist: info.artist || null,
      url: window.location.href,
      timestamp: Date.now()
    };

    // Deduplicate: only report if something changed
    const fingerprint = `${mediaInfo.title}|${mediaInfo.episode || ''}|${mediaInfo.platform}`;
    if (fingerprint === lastDetected) return;
    lastDetected = fingerprint;

    // Send to background service worker
    chrome.runtime.sendMessage({ type: 'MEDIA_DETECTED', payload: mediaInfo }, (resp) => {
      if (chrome.runtime.lastError) {
        console.debug('[ListSync] Message error:', chrome.runtime.lastError.message);
      }
    });
  }

  // ── MutationObserver for SPA navigation ───────────────────────────────────

  function observeChanges() {
    const observer = new MutationObserver(() => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(detectAndReport, 1500);
    });

    observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  // ── Boot ──────────────────────────────────────────────────────────────────

  // Initial detection after page settles
  setTimeout(detectAndReport, 2000);

  // Watch for SPA route changes
  observeChanges();

  // Also listen for pushstate / popstate (SPA navigation)
  const origPush = history.pushState;
  history.pushState = function (...args) {
    origPush.apply(this, args);
    setTimeout(detectAndReport, 1000);
  };
  window.addEventListener('popstate', () => setTimeout(detectAndReport, 1000));
})();
