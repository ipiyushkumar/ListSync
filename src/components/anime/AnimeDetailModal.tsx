'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Star, Calendar, Film, Hash, ExternalLink, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import ProgressBar from '@/components/ProgressBar';

interface Media {
  id: string;
  title: string;
  originalTitle?: string;
  description?: string;
  category: string;
  posterUrl?: string;
  releaseDate?: string;
  totalEpisodes?: number;
  currentEp: number;
  rating?: number;
  status: string;
  genres?: string;
  platforms?: string;
  externalId?: string;
  externalSource?: string;
}

interface AnimeDetailModalProps {
  media: Media;
  onClose: () => void;
  onUpdate: (updated: Media) => void;
  onDelete: (id: string) => void;
}

const STATUS_OPTIONS = ['watching', 'completed', 'planned', 'dropped', 'on-hold'] as const;

export default function AnimeDetailModal({ media, onClose, onUpdate, onDelete }: AnimeDetailModalProps) {
  const [editing, setEditing] = useState(false);
  const [currentEp, setCurrentEp] = useState(media.currentEp);
  const [status, setStatus] = useState(media.status);
  const [saving, setSaving] = useState(false);
  const [showDescription, setShowDescription] = useState(false);

  const genres: string[] = media.genres ? JSON.parse(media.genres) : [];
  const platforms: string[] = media.platforms ? JSON.parse(media.platforms) : [];
  const progress = media.totalEpisodes ? Math.round((currentEp / media.totalEpisodes) * 100) : 0;

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/media/${media.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentEp, status }),
      });
      if (!res.ok) throw new Error('Failed to update');
      const updated = await res.json();
      onUpdate(updated);
      setEditing(false);
    } catch {
      // keep state, user can retry
    } finally {
      setSaving(false);
    }
  }, [media.id, currentEp, status, onUpdate]);

  const handleDelete = useCallback(async () => {
    if (!confirm(`Delete "${media.title}" from your library?`)) return;
    try {
      const res = await fetch(`/api/media/${media.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      onDelete(media.id);
      onClose();
    } catch {
      // keep state
    }
  }, [media.id, media.title, onDelete, onClose]);

  const incrementEp = useCallback(() => {
    if (media.totalEpisodes && currentEp >= media.totalEpisodes) return;
    setCurrentEp((prev) => prev + 1);
    setEditing(true);
  }, [currentEp, media.totalEpisodes]);

  const decrementEp = useCallback(() => {
    if (currentEp <= 0) return;
    setCurrentEp((prev) => prev - 1);
    setEditing(true);
  }, [currentEp]);

  // ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl shadow-black/50 w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with poster */}
        <div className="relative h-48 bg-gray-800 overflow-hidden shrink-0">
          {media.posterUrl ? (
            <img
              src={media.posterUrl}
              alt={media.title}
              className="w-full h-full object-cover object-top"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-600 text-5xl font-bold">
              {media.title[0]}
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/40 hover:bg-black/60 text-gray-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Title overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <div className="flex items-end gap-4">
              {media.posterUrl && (
                <div className="w-16 h-24 rounded-lg overflow-hidden border-2 border-gray-800 shadow-lg shrink-0 -mb-8">
                  <img src={media.posterUrl} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-white truncate tracking-tight">{media.title}</h2>
                {media.originalTitle && (
                  <p className="text-sm text-gray-400 truncate">{media.originalTitle}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 pt-10 space-y-5">
          {/* Status + Rating row */}
          <div className="flex items-center justify-between">
            <StatusBadge status={status} />
            {media.rating != null && (
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-sm font-medium text-gray-200 tabular-nums">{media.rating.toFixed(1)}</span>
                <span className="text-xs text-gray-500">/ 10</span>
              </div>
            )}
          </div>

          {/* Episode control */}
          <div className="bg-gray-800/50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-300">Episodes</span>
              <span className="text-sm tabular-nums text-gray-400">
                {progress}% complete
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={decrementEp}
                disabled={currentEp <= 0}
                className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed text-gray-300 transition-colors"
              >
                <ChevronDown className="w-4 h-4" />
              </button>

              <div className="flex-1">
                <ProgressBar current={currentEp} total={media.totalEpisodes ?? null} />
              </div>

              <button
                onClick={incrementEp}
                disabled={media.totalEpisodes != null && currentEp >= media.totalEpisodes}
                className="p-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Status selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Status</label>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => { setStatus(s); setEditing(true); }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    status === s
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300'
                  }`}
                >
                  {s.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Genres */}
          {genres.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Genres</label>
              <div className="flex flex-wrap gap-1.5">
                {genres.map((genre) => (
                  <span
                    key={genre}
                    className="px-2.5 py-1 bg-gray-800 text-gray-300 rounded-lg text-xs font-medium"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Platforms */}
          {platforms.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Streaming on</label>
              <div className="flex flex-wrap gap-1.5">
                {platforms.map((platform) => (
                  <span
                    key={platform}
                    className="px-2.5 py-1 bg-gray-800 text-gray-300 rounded-lg text-xs font-medium flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {platform}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {media.description && (
            <div className="space-y-2">
              <button
                onClick={() => setShowDescription(!showDescription)}
                className="text-sm font-medium text-gray-300 hover:text-gray-200 flex items-center gap-1 transition-colors"
              >
                <Film className="w-4 h-4" />
                Synopsis
                {showDescription ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              {showDescription && (
                <p className="text-sm text-gray-400 leading-relaxed">
                  {media.description}
                </p>
              )}
            </div>
          )}

          {/* Meta info */}
          <div className="flex flex-wrap gap-4 text-xs text-gray-500">
            {media.releaseDate && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {media.releaseDate}
              </div>
            )}
            {media.totalEpisodes && (
              <div className="flex items-center gap-1">
                <Hash className="w-3.5 h-3.5" />
                {media.totalEpisodes} episodes
              </div>
            )}
            {media.externalSource && (
              <div className="flex items-center gap-1">
                <ExternalLink className="w-3.5 h-3.5" />
                {media.externalSource}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-800 p-4 flex items-center justify-between shrink-0">
          <button
            onClick={handleDelete}
            className="px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>

          <div className="flex items-center gap-2">
            {editing && (
              <button
                onClick={() => {
                  setCurrentEp(media.currentEp);
                  setStatus(media.status);
                  setEditing(false);
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 transition-colors"
              >
                Reset
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={!editing || saving}
              className="px-5 py-2 rounded-lg text-sm font-medium bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
            >
              {saving ? 'Saving...' : editing ? 'Save changes' : 'Saved'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
