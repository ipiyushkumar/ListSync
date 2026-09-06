'use client';

import { useState, useEffect, useCallback } from 'react';

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
  createdAt?: string;
  updatedAt?: string;
}

const STATUS_FILTERS = ['all', 'watching', 'completed', 'planned', 'dropped', 'on-hold'] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

const STATUS_COLORS: Record<string, string> = {
  watching: 'bg-green-500/20 text-green-400 border-green-500/30',
  completed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  planned: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  dropped: 'bg-red-500/20 text-red-400 border-red-500/30',
  'on-hold': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
};

function Notification({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg border ${
        type === 'success'
          ? 'bg-green-900/90 border-green-500/50 text-green-200'
          : 'bg-red-900/90 border-red-500/50 text-red-200'
      } backdrop-blur-sm transition-all duration-300`}
    >
      {message}
    </div>
  );
}

function MediaCard({
  item,
  onUpdateStatus,
  onIncrementEp,
  onDelete,
}: {
  item: Media;
  onUpdateStatus: (id: string, status: string) => Promise<void>;
  onIncrementEp: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [updating, setUpdating] = useState(false);
  const progress = item.totalEpisodes ? Math.round((item.currentEp / item.totalEpisodes) * 100) : 0;

  const handleUpdateStatus = async (status: string) => {
    setUpdating(true);
    await onUpdateStatus(item.id, status);
    setUpdating(false);
  };

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10">
      <div className="relative aspect-[3/4] bg-gray-800">
        {item.posterUrl ? (
          <img
            src={item.posterUrl}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            🎌
          </div>
        )}
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[item.status] || STATUS_COLORS.planned}`}>
            {item.status.replace('-', ' ')}
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-white truncate" title={item.title}>
          {item.title}
        </h3>
        {item.originalTitle && (
          <p className="text-xs text-gray-400 truncate">{item.originalTitle}</p>
        )}

        {item.rating != null && (
          <div className="flex items-center gap-1 mt-1">
            <span className="text-yellow-400">★</span>
            <span className="text-sm text-gray-300">{item.rating.toFixed(1)}</span>
          </div>
        )}

        {/* Episode progress */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Episodes</span>
            <span>
              {item.currentEp}/{item.totalEpisodes || '?'}
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>

        {/* Genres */}
        {item.genres && (
          <div className="flex flex-wrap gap-1 mt-2">
            {JSON.parse(item.genres).slice(0, 3).map((genre: string) => (
              <span
                key={genre}
                className="px-2 py-0.5 bg-gray-800 text-gray-300 rounded text-xs"
              >
                {genre}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => onIncrementEp(item.id)}
            disabled={updating || (item.totalEpisodes != null && item.currentEp >= item.totalEpisodes)}
            className="flex-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-xs font-medium rounded-lg transition-colors"
          >
            + Episode
          </button>
          <select
            value={item.status}
            onChange={(e) => handleUpdateStatus(e.target.value)}
            disabled={updating}
            className="flex-1 px-2 py-1.5 bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded-lg focus:outline-none focus:border-purple-500"
          >
            {STATUS_FILTERS.filter((s) => s !== 'all').map((status) => (
              <option key={status} value={status}>
                {status.replace('-', ' ')}
              </option>
            ))}
          </select>
          <button
            onClick={() => onDelete(item.id)}
            disabled={updating}
            className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 text-xs font-medium rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AnimePage() {
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('all');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotification = useCallback((message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
  }, []);

  const fetchMedia = useCallback(async () => {
    try {
      const params = new URLSearchParams({ category: 'anime' });
      if (activeFilter !== 'all') {
        params.set('status', activeFilter);
      }
      const res = await fetch(`/api/media?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setMedia(Array.isArray(data) ? data : data.items || []);
    } catch {
      showNotification('Failed to load anime', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeFilter, showNotification]);

  useEffect(() => {
    setLoading(true);
    fetchMedia();
  }, [fetchMedia]);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/media/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update');
      showNotification('Status updated', 'success');
      fetchMedia();
    } catch {
      showNotification('Failed to update status', 'error');
    }
  };

  const handleIncrementEp = async (id: string) => {
    try {
      const item = media.find((m) => m.id === id);
      if (!item) return;
      const res = await fetch(`/api/media/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentEp: item.currentEp + 1 }),
      });
      if (!res.ok) throw new Error('Failed to update');
      showNotification('Episode incremented', 'success');
      fetchMedia();
    } catch {
      showNotification('Failed to increment episode', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/media/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      showNotification('Deleted successfully', 'success');
      fetchMedia();
    } catch {
      showNotification('Failed to delete', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎌</span>
            <div>
              <h1 className="text-2xl font-bold text-white">Anime</h1>
              <p className="text-sm text-gray-400">Track your anime watching progress</p>
            </div>
          </div>

          {/* Status Tabs */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeFilter === filter
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300'
                }`}
              >
                {filter === 'all' ? 'All' : filter.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden animate-pulse">
                <div className="aspect-[3/4] bg-gray-800" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-800 rounded w-3/4" />
                  <div className="h-3 bg-gray-800 rounded w-1/2" />
                  <div className="h-2 bg-gray-800 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : media.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-6xl">🎌</span>
            <p className="text-gray-400 mt-4 text-lg">No anime found</p>
            <p className="text-gray-500 mt-1">Add some anime to your list to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {media.map((item) => (
              <MediaCard
                key={item.id}
                item={item}
                onUpdateStatus={handleUpdateStatus}
                onIncrementEp={handleIncrementEp}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}
