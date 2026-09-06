// ListSync Media Detector - Background Service Worker

const BACKEND_URL = 'http://localhost:3085/api/media';
const ALARM_NAME = 'listsync-check-tab';
const CHECK_INTERVAL_MINUTES = 0.5; // 30 seconds

// ── Initialization ────────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  console.log('[ListSync] Extension installed');
  chrome.storage.local.set({
    backendReachable: false,
    currentMedia: null,
    watchlist: [],
    stats: { detected: 0, sent: 0 }
  });

  // Set up periodic active-tab check alarm
  chrome.alarms.create(ALARM_NAME, {
    delayInMinutes: CHECK_INTERVAL_MINUTES,
    periodInMinutes: CHECK_INTERVAL_MINUTES
  });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    checkActiveTab();
  }
});

// ── Message handling from content scripts ─────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'MEDIA_DETECTED') {
    handleMediaDetected(message.payload, sender.tab);
    sendResponse({ status: 'ok' });
    return true;
  }

  if (message.type === 'GET_STATE') {
    chrome.storage.local.get(['currentMedia', 'backendReachable', 'watchlist'], (data) => {
      sendResponse(data);
    });
    return true; // async response
  }

  if (message.type === 'ADD_TO_WATCHLIST') {
    addToWatchlist(message.payload);
    sendToBackend(message.payload);
    sendResponse({ status: 'ok' });
    return true;
  }

  if (message.type === 'CHECK_BACKEND') {
    checkBackendReachability().then((reachable) => {
      sendResponse({ reachable });
    });
    return true;
  }
});

// ── Media detection handler ───────────────────────────────────────────────────

async function handleMediaDetected(mediaInfo, tab) {
  // Update stored current media
  const enriched = {
    ...mediaInfo,
    tabId: tab?.id,
    tabUrl: tab?.url,
    detectedAt: Date.now()
  };

  await chrome.storage.local.set({ currentMedia: enriched });

  // Increment detection count
  const { stats } = await chrome.storage.local.get('stats');
  await chrome.storage.local.set({
    stats: { ...stats, detected: (stats?.detected || 0) + 1 }
  });

  // Send to backend
  await sendToBackend(enriched);
}

// ── Backend communication ─────────────────────────────────────────────────────

async function sendToBackend(mediaInfo) {
  try {
    // Map extension detection data to /api/media POST format
    const categoryMap = { show: 'tv', manga: 'manhwa', unknown: 'anime' };
    const payload = {
      title: mediaInfo.title,
      category: categoryMap[mediaInfo.category] || mediaInfo.category || 'anime',
      status: 'watching',
      currentEp: mediaInfo.episode || 0,
      platforms: mediaInfo.platform ? [mediaInfo.platform] : [],
    };

    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      await chrome.storage.local.set({ backendReachable: true });
      const { stats } = await chrome.storage.local.get('stats');
      await chrome.storage.local.set({
        stats: { ...stats, sent: (stats?.sent || 0) + 1 }
      });
      console.log('[ListSync] Sent to backend:', mediaInfo.title);
    } else {
      console.warn('[ListSync] Backend responded with:', response.status);
      await chrome.storage.local.set({ backendReachable: false });
    }
  } catch (err) {
    console.warn('[ListSync] Backend unreachable:', err.message);
    await chrome.storage.local.set({ backendReachable: false });
  }
}

async function checkBackendReachability() {
  try {
    const resp = await fetch('http://localhost:3085/api/stats', { method: 'GET' });
    const reachable = resp.ok;
    await chrome.storage.local.set({ backendReachable: reachable });
    return reachable;
  } catch {
    await chrome.storage.local.set({ backendReachable: false });
    return false;
  }
}

// ── Active tab check (alarm-driven) ──────────────────────────────────────────

async function checkActiveTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url && !tab.url.startsWith('chrome://')) {
      // Inject content script on demand for non-pre-matched sites
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
      } catch {
        // Script may already be injected or page doesn't allow it
      }
    }
  } catch (err) {
    console.debug('[ListSync] Tab check error:', err.message);
  }
}

// ── Watchlist management ─────────────────────────────────────────────────────

async function addToWatchlist(mediaInfo) {
  const { watchlist = [] } = await chrome.storage.local.get('watchlist');

  // Deduplicate by title + platform
  const exists = watchlist.some(
    (item) => item.title === mediaInfo.title && item.platform === mediaInfo.platform
  );

  if (!exists) {
    watchlist.push({
      ...mediaInfo,
      addedAt: Date.now()
    });
    await chrome.storage.local.set({ watchlist });
    console.log('[ListSync] Added to watchlist:', mediaInfo.title);
  }
}
