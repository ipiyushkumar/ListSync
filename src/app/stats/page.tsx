'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  BarChart3, Film, BookOpen, Tv, Music, Clapperboard, Star,
  Clock, TrendingUp, CheckCircle2, Eye, Pause, Ban, Calendar,
} from 'lucide-react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

/* ──────── Types ──────── */

interface MediaItem {
  id: string;
  title: string;
  category: string;
  status: string;
  posterUrl: string | null;
  currentEp: number;
  totalEpisodes: number | null;
  rating: number | null;
  genres: string | null;
  createdAt: string;
  updatedAt: string;
}

/* ──────── Constants ──────── */

const CATEGORY_META: Record<string, { icon: LucideIcon; label: string; color: string }> = {
  anime: { icon: Film, label: 'Anime', color: '#a855f7' },
  manhwa: { icon: BookOpen, label: 'Manhwa', color: '#3b82f6' },
  movie: { icon: Clapperboard, label: 'Movies', color: '#10b981' },
  tv: { icon: Tv, label: 'TV Shows', color: '#f59e0b' },
  music: { icon: Music, label: 'Music', color: '#ec4899' },
};

const STATUS_META: Record<string, { label: string; color: string }> = {
  watching: { label: 'Watching', color: '#10b981' },
  completed: { label: 'Completed', color: '#3b82f6' },
  planned: { label: 'Planned', color: '#a855f7' },
  dropped: { label: 'Dropped', color: '#ef4444' },
  on_hold: { label: 'On Hold', color: '#f59e0b' },
  reading: { label: 'Reading', color: '#10b981' },
  listening: { label: 'Listening', color: '#ec4899' },
};

const RATING_BUCKETS = ['1-2', '3-4', '5-6', '7-8', '9-10'];

/* ──────── Helper ──────── */

function normalizeStatus(s: string): string {
  return s === 'on-hold' ? 'on_hold' : s;
}

/* ──────── Page ──────── */

export default function StatsPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/media')
      .then((r) => r.json())
      .then((data: MediaItem[]) => setItems(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  /* ──────── Computed stats ──────── */

  const stats = useMemo(() => {
    const total = items.length;

    // By category
    const byCategory: Record<string, number> = {};
    for (const item of items) {
      byCategory[item.category] = (byCategory[item.category] || 0) + 1;
    }

    // By status
    const byStatus: Record<string, number> = {};
    for (const item of items) {
      const s = normalizeStatus(item.status);
      byStatus[s] = (byStatus[s] || 0) + 1;
    }

    // Episodes watched
    const totalEpisodesWatched = items.reduce((sum, item) => sum + item.currentEp, 0);

    // Estimated watch time (24 min avg per episode for anime/tv, 5 min for manhwa/music)
    const estimatedMinutes = items.reduce((sum, item) => {
      const ep = item.currentEp;
      if (item.category === 'manhwa') return sum + ep * 5;
      if (item.category === 'music') return sum + ep * 4;
      if (item.category === 'movie') return sum + (ep || 1) * 120;
      return sum + ep * 24;
    }, 0);
    const estimatedHours = Math.round(estimatedMinutes / 60);

    // Completion rate
    const completedCount = byStatus['completed'] || 0;
    const completionRate = total > 0 ? Math.round((completedCount / total) * 100) : 0;

    // Average rating
    const rated = items.filter((i) => i.rating && i.rating > 0);
    const avgRating = rated.length > 0
      ? (rated.reduce((sum, i) => sum + (i.rating || 0), 0) / rated.length).toFixed(1)
      : '0.0';

    // Rating distribution
    const ratingBuckets = RATING_BUCKETS.map(() => 0);
    for (const item of items) {
      if (!item.rating || item.rating <= 0) continue;
      const idx = Math.min(Math.floor((item.rating - 1) / 2), 4);
      ratingBuckets[idx]++;
    }
    const maxRatingBucket = Math.max(...ratingBuckets, 1);

    // Top rated
    const topRated = [...rated]
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 5);

    // Recently added
    const recentAdded = [...items]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    // Category progress (totalEp / totalEpisodes for items with known totals)
    const categoryProgress: Record<string, { watched: number; total: number }> = {};
    for (const item of items) {
      if (!item.totalEpisodes || item.totalEpisodes <= 0) continue;
      if (!categoryProgress[item.category]) categoryProgress[item.category] = { watched: 0, total: 0 };
      categoryProgress[item.category].watched += item.currentEp;
      categoryProgress[item.category].total += item.totalEpisodes;
    }

    return {
      total, byCategory, byStatus, totalEpisodesWatched, estimatedHours,
      completionRate, avgRating, ratingBuckets, topRated, recentAdded, categoryProgress,
    };
  }, [items]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-accent" />
          Statistics
        </h1>
        <p className="text-sm text-gray-500 mt-1">Your media consumption at a glance</p>
      </div>

      {/* ── Top Metric Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Total Items" value={String(stats.total)} icon={<BarChart3 className="w-5 h-5 text-accent" />} />
        <MetricCard label="Episodes Watched" value={String(stats.totalEpisodesWatched)} icon={<Eye className="w-5 h-5 text-emerald-400" />} />
        <MetricCard label="Est. Watch Time" value={`${stats.estimatedHours}h`} icon={<Clock className="w-5 h-5 text-amber-400" />} />
        <MetricCard label="Avg Rating" value={stats.avgRating} icon={<Star className="w-5 h-5 text-yellow-400" />} sub={`${items.filter((i) => i.rating && i.rating > 0).length} rated`} />
      </div>

      {/* ── Secondary Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <MetricCard label="Completion Rate" value={`${stats.completionRate}%`} icon={<CheckCircle2 className="w-5 h-5 text-blue-400" />} />
        <MetricCard label="Currently Active" value={String((stats.byStatus['watching'] || 0) + (stats.byStatus['reading'] || 0) + (stats.byStatus['listening'] || 0))} icon={<TrendingUp className="w-5 h-5 text-emerald-400" />} />
        <MetricCard label="Dropped" value={String(stats.byStatus['dropped'] || 0)} icon={<Ban className="w-5 h-5 text-red-400" />} />
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">By Category</h2>
          <div className="space-y-3">
            {Object.entries(stats.byCategory)
              .sort(([, a], [, b]) => b - a)
              .map(([cat, count]) => {
                const meta = CATEGORY_META[cat] || { icon: BarChart3, label: cat, color: '#a855f7' };
                const Icon = meta.icon;
                const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="flex items-center gap-2 text-gray-300">
                        <Icon className="w-4 h-4" style={{ color: meta.color }} />
                        {meta.label}
                      </span>
                      <span className="text-gray-500">{count} ({Math.round(pct)}%)</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: meta.color }} />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">By Status</h2>
          <div className="space-y-3">
            {Object.entries(stats.byStatus)
              .sort(([, a], [, b]) => b - a)
              .map(([status, count]) => {
                const meta = STATUS_META[status] || { label: status, color: '#a855f7' };
                const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="flex items-center gap-2 text-gray-300">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.color }} />
                        {meta.label}
                      </span>
                      <span className="text-gray-500">{count} ({Math.round(pct)}%)</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: meta.color }} />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* ── Rating Distribution ── */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Rating Distribution</h2>
        <div className="flex items-end gap-3 h-40">
          {RATING_BUCKETS.map((bucket, i) => {
            const count = stats.ratingBuckets[i];
            const h = stats.maxRatingBucket > 0 ? (count / stats.maxRatingBucket) * 100 : 0;
            return (
              <div key={bucket} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs text-gray-500">{count}</span>
                <div className="w-full bg-gray-800 rounded-t-md overflow-hidden" style={{ height: '100px' }}>
                  <div className="w-full rounded-t-md transition-all duration-500" style={{ height: `${h}%`, backgroundColor: '#a855f7' }} />
                </div>
                <span className="text-xs text-gray-400">{bucket}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Category Progress ── */}
      {Object.keys(stats.categoryProgress).length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Episode Progress by Category</h2>
          <div className="space-y-4">
            {Object.entries(stats.categoryProgress)
              .sort(([, a], [, b]) => b.total - a.total)
              .map(([cat, { watched, total }]) => {
                const meta = CATEGORY_META[cat] || { icon: BarChart3, label: cat, color: '#a855f7' };
                const pct = total > 0 ? Math.round((watched / total) * 100) : 0;
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-300">{meta.label}</span>
                      <span className="text-gray-500">{watched}/{total} episodes ({pct}%)</span>
                    </div>
                    <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: meta.color }} />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ── Top Rated ── */}
      {stats.topRated.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Top Rated</h2>
          <div className="space-y-3">
            {stats.topRated.map((item) => (
              <Link key={item.id} href={`/media/${item.id}`} className="flex items-center gap-3 group hover:bg-gray-800/50 rounded-lg p-2 transition-colors">
                <img
                  src={item.posterUrl || ''}
                  alt={item.title}
                  className="w-8 h-11 rounded object-cover bg-gray-800"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white group-hover:text-accent transition-colors truncate">{item.title}</p>
                  <p className="text-xs text-gray-500">{CATEGORY_META[item.category]?.label || item.category}</p>
                </div>
                <span className="flex items-center gap-1 text-sm text-yellow-400">
                  <Star className="w-3.5 h-3.5 fill-yellow-400" />
                  {item.rating}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Recently Added ── */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Recently Added</h2>
        <div className="space-y-3">
          {stats.recentAdded.map((item) => (
            <Link key={item.id} href={`/media/${item.id}`} className="flex items-center gap-3 group hover:bg-gray-800/50 rounded-lg p-2 transition-colors">
              <img
                src={item.posterUrl || ''}
                alt={item.title}
                className="w-8 h-11 rounded object-cover bg-gray-800"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white group-hover:text-accent transition-colors truncate">{item.title}</p>
                <p className="text-xs text-gray-500">{CATEGORY_META[item.category]?.label || item.category}</p>
              </div>
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(item.createdAt).toLocaleDateString()}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ──────── MetricCard Sub-component ──────── */

function MetricCard({ label, value, icon, sub }: { label: string; value: string; icon: React.ReactNode; sub?: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center gap-2 text-gray-500 text-xs uppercase tracking-wider mb-2">
        {icon}
        {label}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}
