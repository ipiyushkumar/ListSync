'use client';

import React, { useState } from 'react';
import StatusBadge from './StatusBadge';
import ProgressBar from './ProgressBar';
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

interface MediaCardProps {
  media: Media;
  onUpdate?: (updated: Media) => void;
  onDelete?: (id: string) => void;
}

export default function MediaCard({ media, onUpdate, onDelete }: MediaCardProps) {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/media/${media.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      onDelete?.(media.id);
      setToast({ message: 'Deleted successfully', type: 'success' });
    } catch {
      setToast({ message: 'Failed to delete', type: 'error' });
    }
  };

  const handleIncrementEp = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newEp = media.totalEpisodes
      ? Math.min(media.currentEp + 1, media.totalEpisodes)
      : media.currentEp + 1;

    try {
      const res = await fetch(`/api/media/${media.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentEp: newEp }),
      });
      if (!res.ok) throw new Error('Failed to update');
      const updated = await res.json();
      onUpdate?.(updated);
    } catch {
      setToast({ message: 'Failed to update episode', type: 'error' });
    }
  };

  return (
    <>
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden hover:border-purple-600/50 transition-all duration-200 group">
        {/* Poster */}
        <div className="relative aspect-[2/3] bg-gray-800 overflow-hidden">
          {media.posterUrl ? (
            <img
              src={media.posterUrl}
              alt={media.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-600 text-4xl font-bold">
              {media.title[0]}
            </div>
          )}
          {/* Overlay actions */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-3">
            <div className="flex gap-2 w-full">
              <button
                onClick={handleIncrementEp}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium py-2 rounded-lg transition-colors"
              >
                +1 Episode
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-600/80 hover:bg-red-600 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors"
              >
                🗑
              </button>
            </div>
          </div>
          <div className="absolute top-2 right-2">
            <StatusBadge status={media.status} />
          </div>
        </div>

        {/* Info */}
        <div className="p-3 space-y-2">
          <h3 className="font-semibold text-white text-sm truncate" title={media.title}>
            {media.title}
          </h3>

          <ProgressBar current={media.currentEp} total={media.totalEpisodes ?? null} />

          {media.rating != null && (
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`text-sm ${
                    star <= Math.round(media.rating! / 2)
                      ? 'text-yellow-400'
                      : 'text-gray-700'
                  }`}
                >
                  ★
                </span>
              ))}
              <span className="text-xs text-gray-500 ml-1">
                {(media.rating / 2).toFixed(1)}
              </span>
            </div>
          )}

          <p className="text-xs text-gray-500 truncate">{media.category}</p>
        </div>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </>
  );
}
