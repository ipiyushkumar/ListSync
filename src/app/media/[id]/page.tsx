'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { parseGenres } from '@/lib/utils';
import MediaModal from '@/components/MediaModal';
import {
  ArrowLeft,
  Star,
  Play,
  Edit,
  Trash2,
  ChevronRight,
  ExternalLink,
  Film,
  BookOpen,
  Music,
  Tv,
  Bookmark,
  Loader2,
  Check,
  Clock,
  Pause,
  XCircle,
  ListTodo,
} from 'lucide-react';

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

const STATUS_OPTIONS = [
  { value: 'watching', label: 'Watching', icon: Play, color: 'bg-blue-600 hover:bg-blue-700' },
  { value: 'completed', label: 'Completed', icon: Check, color: 'bg-green-600 hover:bg-green-700' },
  { value: 'on_hold', label: 'On Hold', icon: Pause, color: 'bg-yellow-600 hover:bg-yellow-700' },
  { value: 'dropped', label: 'Dropped', icon: XCircle, color: 'bg-red-600 hover:bg-red-700' },
  { value: 'planned', label: 'Planned', icon: Bookmark, color: 'bg-purple-600 hover:bg-purple-700' },
] as const;

const CATEGORY_ICONS: Record<string, typeof Film> = {
  anime: Film,
  manhwa: BookOpen,
  manga: BookOpen,
  movie: Film,
  tv: Tv,
  music: Music,
};

function RatingStars({ rating }: { rating?: number }) {
  if (!rating) return null;
  const fullStars = Math.floor(rating / 2);
  const halfStar = rating % 2 >= 1;
  const total = 5;
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: total }, (_, i) => (
        <Star
          key={i}
          size={18}
          className={
            i < fullStars
              ? 'fill-yellow-400 text-yellow-400'
              : i === fullStars && halfStar
                ? 'fill-yellow-400/50 text-yellow-400'
                : 'text-gray-600'
          }
        />
      ))}
      <span className="ml-2 text-sm text-gray-400">{rating.toFixed(1)}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string }> = {
    watching: { bg: 'bg-blue-900/50', text: 'text-blue-300' },
    completed: { bg: 'bg-green-900/50', text: 'text-green-300' },
    on_hold: { bg: 'bg-yellow-900/50', text: 'text-yellow-300' },
    dropped: { bg: 'bg-red-900/50', text: 'text-red-300' },
    planned: { bg: 'bg-purple-900/50', text: 'text-purple-300' },
  };
  const { bg, text } = config[status] || config.planned;
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
      {status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
    </span>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const Icon = CATEGORY_ICONS[category] || Film;
  return (
    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-purple-900/50 text-purple-300">
      <Icon size={12} />
      {category.charAt(0).toUpperCase() + category.slice(1)}
    </span>
  );
}

export default function MediaDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [media, setMedia] = useState<Media | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [incrementing, setIncrementing] = useState(false);

  const fetchMedia = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/media/${id}`);
      if (!res.ok) throw new Error('Media not found');
      const data = await res.json();
      setMedia(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load media');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this?')) return;
    try {
      const res = await fetch(`/api/media/${id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/');
      } else {
        alert('Failed to delete');
      }
    } catch {
      alert('Failed to delete');
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!media || updatingStatus) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/media/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setMedia({ ...media, status: newStatus });
      }
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleNextEpisode = async () => {
    if (!media || incrementing) return;
    setIncrementing(true);
    try {
      const newEp = media.currentEp + 1;
      const res = await fetch(`/api/media/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentEp: newEp }),
      });
      if (res.ok) {
        setMedia({ ...media, currentEp: newEp });
      }
    } finally {
      setIncrementing(false);
    }
  };

  const handleSave = (updated: Media) => {
    setMedia(updated);
    setModalOpen(false);
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-10 h-10 rounded-lg bg-gray-800 animate-pulse" />
            <div className="h-6 w-32 bg-gray-800 rounded animate-pulse" />
          </div>
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-80 aspect-[2/3] bg-gray-800 rounded-xl animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-4">
              <div className="h-8 w-64 bg-gray-800 rounded animate-pulse" />
              <div className="h-4 w-48 bg-gray-800 rounded animate-pulse" />
              <div className="h-4 w-80 bg-gray-800 rounded animate-pulse" />
              <div className="h-20 w-full bg-gray-800 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !media) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-gray-400 text-lg">{error || 'Media not found'}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const genres = parseGenres(media.genres);
  const platforms = parseGenres(media.platforms);
  const progressPercent =
    media.totalEpisodes && media.totalEpisodes > 0
      ? Math.min((media.currentEp / media.totalEpisodes) * 100, 100)
      : 0;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Back button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft size={18} />
          <span className="text-sm font-medium">Back</span>
        </Link>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Poster */}
          <div className="w-full md:w-80 flex-shrink-0">
            {media.posterUrl ? (
              <img
                src={media.posterUrl}
                alt={media.title}
                className="w-full aspect-[2/3] object-cover rounded-xl shadow-2xl"
              />
            ) : (
              <div className="w-full aspect-[2/3] rounded-xl shadow-2xl bg-gradient-to-br from-purple-900 via-gray-900 to-gray-800 flex items-center justify-center">
                <span className="text-gray-500 text-4xl">
                  {React.createElement(CATEGORY_ICONS[media.category] || Film, { size: 64 })}
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 space-y-6">
            {/* Title & Badges */}
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{media.title}</h1>
              {media.originalTitle && (
                <p className="text-gray-400 text-sm mb-3">{media.originalTitle}</p>
              )}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <CategoryBadge category={media.category} />
                <StatusBadge status={media.status} />
                {media.releaseDate && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-800 text-gray-400">
                    {media.releaseDate}
                  </span>
                )}
              </div>
              <RatingStars rating={media.rating} />
            </div>

            {/* Episode Progress */}
            {media.totalEpisodes && media.totalEpisodes > 0 && (
              <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <ListTodo size={16} />
                    <span className="font-medium">
                      EP {media.currentEp} / {media.totalEpisodes}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">{progressPercent.toFixed(0)}%</span>
                </div>
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <button
                  onClick={handleNextEpisode}
                  disabled={incrementing || media.currentEp >= (media.totalEpisodes || 0)}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-purple-600/20 text-purple-300 rounded-lg hover:bg-purple-600/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {incrementing ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <ChevronRight size={12} />
                  )}
                  Mark next episode
                </button>
              </div>
            )}

            {/* Genres */}
            {genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {genres.map((genre) => (
                  <span
                    key={genre}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}

            {/* Description */}
            {media.description && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Description
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">{media.description}</p>
              </div>
            )}

            {/* Streaming Platforms */}
            {platforms.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Available On
                </h3>
                <div className="flex flex-wrap gap-2">
                  {platforms.map((platform) => (
                    <span
                      key={platform}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800 text-gray-300 hover:bg-gray-700 cursor-default"
                    >
                      {platform}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Status Update Buttons */}
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Status
              </h3>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map(({ value, label, icon: Icon, color }) => (
                  <button
                    key={value}
                    onClick={() => handleStatusUpdate(value)}
                    disabled={updatingStatus || media.status === value}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      media.status === value
                        ? 'ring-2 ring-purple-500 ' + color
                        : color
                    }`}
                  >
                    <Icon size={14} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors border border-gray-700"
              >
                <Edit size={16} />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-lg text-sm font-medium transition-colors border border-red-800"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {modalOpen && (
        <MediaModal media={media} isOpen={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} />
      )}
    </div>
  );
}
