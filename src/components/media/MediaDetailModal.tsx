'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, ChevronDown, ChevronUp, Trash2, ExternalLink, Star, Calendar, Clock, Tag } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import { parseGenres } from '@/lib/utils';
import type { Media } from './MediaGridCard';

const STATUS_OPTIONS = ['watching', 'reading', 'listening', 'completed', 'planned', 'dropped', 'on-hold'] as const;

function toUiStatus(s: string): string {
  return s === 'on_hold' ? 'on-hold' : s;
}

const CATEGORY_LABELS: Record<string, string> = {
  anime: 'Anime', manhwa: 'Manhwa', movie: 'Movie', tv: 'TV Show', music: 'Music',
};

function getExternalLink(media: Media): string | null {
  if (!media.externalId || !media.externalSource) return null;
  if (media.externalSource === 'anilist') return `https://anilist.co/anime/${media.externalId}`;
  if (media.externalSource === 'tmdb') {
    return media.category === 'movie'
      ? `https://www.themoviedb.org/movie/${media.externalId}`
      : `https://www.themoviedb.org/tv/${media.externalId}`;
  }
  if (media.externalSource === 'jikan') return `https://myanimelist.net/anime/${media.externalId}`;
  return null;
}

export default function MediaDetailModal({
  media,
  onClose,
  onUpdate,
  onDelete,
  progressLabel = 'Episodes',
  incrementLabel = '+1 Episode',
  decrementLabel = '-1 Episode',
}: {
  media: Media;
  onClose: () => void;
  onUpdate: (updated: Media) => void;
  onDelete: (id: string) => void;
  progressLabel?: string;
  incrementLabel?: string;
  decrementLabel?: string;
}) {
  const [editStatus, setEditStatus] = useState(toUiStatus(media.status));
  const [editEp, setEditEp] = useState(media.currentEp);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  // Reset state when a different media item opens
  useEffect(() => {
    setEditStatus(toUiStatus(media.status));
    setEditEp(media.currentEp);
    setDeleting(false);
  }, [media.id, media.status, media.currentEp]);

  const genres = parseGenres(media.genres);
  const platforms = parseGenres(media.platforms);

  const hasChanges = editStatus !== toUiStatus(media.status) || editEp !== media.currentEp;

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = { status: editStatus, currentEp: editEp };
      // Auto-complete when at total episodes
      if (media.totalEpisodes && editEp >= media.totalEpisodes && editStatus !== 'completed') {
        body.status = 'completed';
        setEditStatus('completed');
      }
      // Auto-set back to active status when decrementing from completed
      if (media.totalEpisodes && editEp < media.totalEpisodes && editStatus === 'completed') {
        const revertStatus = media.category === 'manhwa' ? 'reading'
          : media.category === 'music' ? 'listening'
          : 'watching';
        body.status = revertStatus;
        setEditStatus(revertStatus);
      }
      const res = await fetch(`/api/media/${media.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const updated = await res.json();
        onUpdate(updated);
        // Fire-and-forget: log activity based on status changes
        const origStatus = toUiStatus(media.status);
        const finalStatus = typeof body.status === 'string' ? body.status : editStatus;
        if (finalStatus === 'completed' && origStatus !== 'completed') {
          fetch('/api/activity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mediaId: media.id, action: 'completed', source: 'manual' }),
          }).catch(() => {});
        } else if (
          ['watching', 'reading', 'listening'].includes(finalStatus) &&
          origStatus === 'planned'
        ) {
          fetch('/api/activity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mediaId: media.id, action: 'started', source: 'manual' }),
          }).catch(() => {});
        }
      }
    } finally {
      setSaving(false);
    }
  }, [media.id, media.totalEpisodes, media.category, editStatus, editEp, onUpdate]);

  const handleDelete = useCallback(async () => {
    if (!deleting) {
      setDeleting(true);
      return;
    }
    const res = await fetch(`/api/media/${media.id}`, { method: 'DELETE' });
    if (res.ok) onDelete(media.id);
  }, [deleting, media.id, onDelete]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl shadow-black/40"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with poster */}
        <div className="relative h-48 bg-gray-800 overflow-hidden rounded-t-2xl">
          {/* Fallback — always rendered behind the image */}
          <div className="absolute inset-0 flex items-center justify-center z-0">
            <span className="text-5xl font-bold text-gray-700">{media.title[0]}</span>
          </div>
          {media.posterUrl && (
            <img
              src={media.posterUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover z-10"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Title overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-end gap-3">
              {media.posterUrl && (
                <div className="w-16 h-24 rounded-lg overflow-hidden border-2 border-gray-900 shadow-lg shrink-0 -mb-8 bg-gray-800 relative">
                  <div className="absolute inset-0 flex items-center justify-center z-0">
                    <span className="text-lg font-bold text-gray-600">{media.title[0]}</span>
                  </div>
                  <img
                    src={media.posterUrl}
                    alt=""
                    className="relative z-10 w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              )}
              <div className="min-w-0 pb-1">
                <h2 className="text-lg font-bold text-white leading-snug">{media.title}</h2>
                {media.originalTitle && (
                  <p className="text-xs text-gray-400 leading-snug">{media.originalTitle}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 mt-6">
          {/* Status selector */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Status</label>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setEditStatus(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    editStatus === s
                      ? 'bg-accent text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                  }`}
                >
                  {s.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Progress control */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">{progressLabel}</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setEditEp(Math.max(0, editEp - 1))}
                disabled={editEp <= 0}
                className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-30 text-gray-300 transition-colors"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              <div className="flex-1 text-center">
                <span className="text-2xl font-bold text-white tabular-nums">{editEp}</span>
                {media.totalEpisodes != null && media.totalEpisodes > 0 && (
                  <span className="text-sm text-gray-500 ml-1">/ {media.totalEpisodes}</span>
                )}
              </div>
              <button
                onClick={() => {
                  if (media.totalEpisodes != null && editEp >= media.totalEpisodes) return;
                  setEditEp(editEp + 1);
                }}
                disabled={media.totalEpisodes != null && media.totalEpisodes > 0 && editEp >= media.totalEpisodes}
                className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-30 text-gray-300 transition-colors"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Genres */}
          {genres.length > 0 && (
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Genres</label>
              <div className="flex flex-wrap gap-1.5">
                {genres.map((g) => (
                  <span key={g} className="px-2.5 py-1 bg-gray-800 text-gray-300 rounded-lg text-xs">
                    {g}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Platforms */}
          {platforms.length > 0 && (
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Platforms</label>
              <div className="flex flex-wrap gap-1.5">
                {platforms.map((p) => (
                  <span key={p} className="px-2.5 py-1 bg-gray-800 text-gray-300 rounded-lg text-xs">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description — always visible */}
          {media.description && (
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">About</label>
              <p className="text-sm text-gray-400 leading-relaxed">{media.description}</p>
            </div>
          )}

          {/* Meta info */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2 text-gray-400">
              <Tag className="w-3.5 h-3.5 text-gray-500" />
              <span className="capitalize">{CATEGORY_LABELS[media.category] || media.category}</span>
            </div>
            {media.releaseDate && (
              <div className="flex items-center gap-2 text-gray-400">
                <Calendar className="w-3.5 h-3.5 text-gray-500" />
                <span>{new Date(media.releaseDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
              </div>
            )}
            {media.rating != null && (
              <div className="flex items-center gap-2 text-gray-400">
                <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                <span>{media.rating.toFixed(1)} / 10</span>
              </div>
            )}
            {media.totalEpisodes != null && media.totalEpisodes > 0 && (
              <div className="flex items-center gap-2 text-gray-400">
                <Clock className="w-3.5 h-3.5 text-gray-500" />
                <span>{media.currentEp} / {media.totalEpisodes} episodes</span>
              </div>
            )}
            {media.externalSource && (
              <div className="flex items-center gap-2 text-gray-400">
                <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                <span className="capitalize">{media.externalSource}</span>
              </div>
            )}
          </div>

          {/* External link */}
          {getExternalLink(media) && (
            <a
              href={getExternalLink(media)!}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs text-accent hover:text-accent transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View on {media.externalSource === 'anilist' ? 'AniList' : media.externalSource === 'tmdb' ? 'TMDB' : 'MAL'}
            </a>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 flex items-center gap-3">
          <button
            onClick={handleDelete}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              deleting
                ? 'bg-red-600 text-white hover:bg-red-500'
                : 'bg-gray-800 text-gray-400 hover:text-red-400 hover:bg-gray-700'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            {deleting ? 'Confirm delete' : 'Delete'}
          </button>

          <div className="flex-1" />

          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="px-5 py-2 bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
