'use client';

import React, { useState, useEffect } from 'react';
import Toast from './Toast';

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

interface MediaModalProps {
  media: Media | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (updated: Media) => void;
}

const STATUS_OPTIONS = [
  { value: 'watching', label: 'Watching' },
  { value: 'completed', label: 'Completed' },
  { value: 'dropped', label: 'Dropped' },
  { value: 'planned', label: 'Planned' },
  { value: 'on_hold', label: 'On Hold' },
];

export default function MediaModal({ media, isOpen, onClose, onSave }: MediaModalProps) {
  const [formData, setFormData] = useState<Partial<Media>>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (media) {
      setFormData({
        status: media.status,
        currentEp: media.currentEp,
        rating: media.rating,
        description: media.description,
        genres: media.genres,
        platforms: media.platforms,
      });
    }
  }, [media]);

  if (!isOpen || !media) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/media/${media.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Failed to update');
      const updated = await res.json();
      onSave?.(updated);
      setToast({ message: 'Saved successfully', type: 'success' });
      setTimeout(() => onClose(), 500);
    } catch {
      setToast({ message: 'Failed to save', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-4">
            {media.posterUrl ? (
              <img
                src={media.posterUrl}
                alt={media.title}
                className="w-16 h-24 object-cover rounded-lg"
              />
            ) : (
              <div className="w-16 h-24 bg-gray-800 rounded-lg flex items-center justify-center text-gray-600 text-xl font-bold">
                {media.title[0]}
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-white">{media.title}</h2>
              {media.originalTitle && (
                <p className="text-sm text-gray-400">{media.originalTitle}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">{media.category}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFormData({ ...formData, status: opt.value })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    formData.status === opt.value
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Episode Progress */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Episodes {media.totalEpisodes ? `/ ${media.totalEpisodes}` : ''}
            </label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                min={0}
                max={media.totalEpisodes ?? 9999}
                value={formData.currentEp ?? 0}
                onChange={(e) =>
                  setFormData({ ...formData, currentEp: parseInt(e.target.value) || 0 })
                }
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white w-24 focus:outline-none focus:border-purple-600"
              />
              <input
                type="range"
                min={0}
                max={media.totalEpisodes ?? 100}
                value={formData.currentEp ?? 0}
                onChange={(e) =>
                  setFormData({ ...formData, currentEp: parseInt(e.target.value) })
                }
                className="flex-1 accent-purple-600"
              />
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Rating</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <button
                  key={n}
                  onClick={() => setFormData({ ...formData, rating: n })}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                    (formData.rating ?? 0) >= n
                      ? 'bg-yellow-400 text-gray-900'
                      : 'bg-gray-800 text-gray-500 hover:bg-gray-700'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              value={formData.description ?? ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-purple-600 resize-none"
              placeholder="Add a description..."
            />
          </div>

          {/* Genres */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Genres</label>
            <input
              type="text"
              value={formData.genres ?? ''}
              onChange={(e) => setFormData({ ...formData, genres: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-purple-600"
              placeholder='["Action", "Drama"]'
            />
          </div>

          {/* Info */}
          {media.releaseDate && (
            <div className="text-xs text-gray-500">
              Released: {new Date(media.releaseDate).toLocaleDateString()}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-800">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 rounded-lg text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
