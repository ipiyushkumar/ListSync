// ListSync Media Detector - Popup Script

document.addEventListener('DOMContentLoaded', () => {
  const $ = (sel) => document.querySelector(sel);

  const statusDot = $('#status-dot');
  const statusLabel = $('#status-label');
  const mediaCard = $('#media-card');
  const mediaEmpty = $('#media-empty');
  const mediaTitle = $('#media-title');
  const mediaEpisode = $('#media-episode');
  const mediaUrl = $('#media-url');
  const mediaPlatformBadge = $('#media-platform-badge');
  const btnAdd = $('#btn-add');
  const btnDashboard = $('#btn-dashboard');
  const statDetected = $('#stat-detected');
  const statSent = $('#stat-sent');

  let currentMedia = null;

  // ── Load state ────────────────────────────────────────────────────────────

  function loadState() {
    chrome.runtime.sendMessage({ type: 'GET_STATE' }, (response) => {
      if (chrome.runtime.lastError || !response) {
        statusDot.className = 'status-dot offline';
        statusLabel.textContent = 'Extension error';
        return;
      }

      // Backend status
      updateBackendStatus(response.backendReachable);

      // Current media
      if (response.currentMedia) {
        showMedia(response.currentMedia);
      }

      // Watchlist count (from response if present)
      if (response.stats) {
        statDetected.textContent = `${response.stats.detected || 0} detected`;
        statSent.textContent = `${response.stats.sent || 0} sent`;
      }
    });
  }

  // ── Backend check ─────────────────────────────────────────────────────────

  function checkBackend() {
    chrome.runtime.sendMessage({ type: 'CHECK_BACKEND' }, (resp) => {
      updateBackendStatus(resp?.reachable);
    });
  }

  function updateBackendStatus(reachable) {
    if (reachable) {
      statusDot.className = 'status-dot online';
      statusLabel.textContent = 'Backend connected';
    } else {
      statusDot.className = 'status-dot offline';
      statusLabel.textContent = 'Backend offline';
    }
  }

  // ── Show detected media ───────────────────────────────────────────────────

  function showMedia(media) {
    currentMedia = media;
    mediaCard.classList.remove('hidden');
    mediaEmpty.classList.add('hidden');
    btnAdd.disabled = false;

    mediaTitle.textContent = media.title || '—';
    mediaPlatformBadge.textContent = (media.platform || 'unknown').toUpperCase();

    if (media.episode) {
      mediaEpisode.textContent = `Episode ${media.episode}`;
      mediaEpisode.classList.remove('hidden');
    } else {
      mediaEpisode.classList.add('hidden');
    }

    if (media.url) {
      try {
        mediaUrl.textContent = new URL(media.url).hostname;
      } catch {
        mediaUrl.textContent = media.url;
      }
      mediaUrl.classList.remove('hidden');
    } else {
      mediaUrl.classList.add('hidden');
    }
  }

  // ── Add to watchlist ─────────────────────────────────────────────────────

  btnAdd.addEventListener('click', () => {
    if (!currentMedia) return;
    chrome.runtime.sendMessage({ type: 'ADD_TO_WATCHLIST', payload: currentMedia }, () => {
      btnAdd.textContent = '✓ Added!';
      btnAdd.disabled = true;
      setTimeout(() => {
        btnAdd.textContent = '＋ Add to Watchlist';
        if (currentMedia) btnAdd.disabled = false;
      }, 2000);
    });
  });

  // ── Open dashboard ──────────────────────────────────────────────────────

  if (btnDashboard) {
    btnDashboard.addEventListener('click', () => {
      chrome.tabs.create({ url: 'http://localhost:3085' });
    });
  }

  // ── Init ──────────────────────────────────────────────────────────────────

  loadState();
  checkBackend();
});
