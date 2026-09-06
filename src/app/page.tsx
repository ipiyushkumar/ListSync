'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Film, BookOpen, Tv, Music, Clapperboard, Search,
  ArrowRight, Star, Clock, CheckCircle2, Eye, Pause, Ban,
  TrendingUp, BarChart3, Plus, Dices,
} from 'lucide-react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

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

const CATEGORY_META: Record<string, { icon: LucideIcon; label: string }> = {
  anime: { icon: Film, label: 'Anime' },
  manhwa: { icon: BookOpen, label: 'Manhwa' },
  movie: { icon: Clapperboard, label: 'Movies' },
  tv: { icon: Tv, label: 'TV Shows' },
  music: { icon: Music, label: 'Music' },
};

const STATUS_META: Record<string, { icon: LucideIcon; color: string; dot: string }> = {
  watching: { icon: Eye, color: 'text-emerald-400', dot: 'bg-emerald-400' },
  reading: { icon: BookOpen, color: 'text-emerald-400', dot: 'bg-emerald-400' },
  listening: { icon: Music, color: 'text-emerald-400', dot: 'bg-emerald-400' },
  completed: { icon: CheckCircle2, color: 'text-blue-400', dot: 'bg-blue-400' },
  planned: { icon: Clock, color: 'text-gray-400', dot: 'bg-gray-400' },
  dropped: { icon: Ban, color: 'text-red-400', dot: 'bg-red-400' },
  'on-hold': { icon: Pause, color: 'text-amber-400', dot: 'bg-amber-400' },
  on_hold: { icon: Pause, color: 'text-amber-400', dot: 'bg-amber-400' },
};

function MiniBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
      <div
        className="h-full bg-accent/60 rounded-full transition-all duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function SkeletonDashboard() {
  return (
    <div className="p-4 space-y-4 animate-pulse">
      <div className="h-5 bg-gray-800/50 rounded w-32" />
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 bg-gray-800/30 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2 h-48 bg-gray-800/30 rounded-lg" />
        <div className="h-48 bg-gray-800/30 rounded-lg" />
      </div>
      <div className="h-64 bg-gray-800/30 rounded-lg" />
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/media')
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(data => setMedia(Array.isArray(data) ? data : data.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Keyboard shortcut: / to go to search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        e.preventDefault();
        router.push('/search');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [router]);

  const stats = useMemo(() => {
    const byCategory: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    let totalRating = 0;
    let ratedCount = 0;

    media.forEach(m => {
      byCategory[m.category] = (byCategory[m.category] || 0) + 1;
      byStatus[m.status] = (byStatus[m.status] || 0) + 1;
      if (m.rating && m.rating > 0) {
        totalRating += m.rating > 10 ? m.rating / 10 : m.rating;
        ratedCount++;
      }
    });

    return {
      total: media.length,
      byCategory,
      byStatus,
      avgRating: ratedCount > 0 ? (totalRating / ratedCount).toFixed(1) : '—',
      watching: byStatus['watching'] || 0,
      completed: byStatus['completed'] || 0,
      planned: byStatus['planned'] || 0,
    };
  }, [media]);

  const recentItems = useMemo(() => {
    return [...media]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 8);
  }, [media]);

  const watchingItems = useMemo(() => {
    return media.filter(m => m.status === 'watching' || m.status === 'reading' || m.status === 'listening');
  }, [media]);

  const incrementEpisode = useCallback(async (e: React.MouseEvent, item: MediaItem) => {
    e.stopPropagation();
    const newEp = (item.currentEp || 0) + 1;
    const cap = item.totalEpisodes || Infinity;
    if (newEp > cap) return;
    const newStatus = newEp >= cap ? 'completed' : item.status;
    setMedia(prev => prev.map(m =>
      m.id === item.id ? { ...m, currentEp: newEp, status: newStatus } : m
    ));
    try {
      await fetch(`/api/media/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentEp: newEp, status: newStatus }),
      });
    } catch {
      setMedia(prev => prev.map(m =>
        m.id === item.id ? { ...m, currentEp: item.currentEp, status: item.status } : m
      ));
    }
  }, []);

  const pickRandom = useCallback(() => {
    const candidates = media.filter(m =>
      m.status === 'planned' || m.status === 'watching' || m.status === 'on_hold' || m.status === 'on-hold'
    );
    if (candidates.length === 0) return;
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    router.push(`/media/${pick.id}`);
  }, [media, router]);

  const maxCategoryCount = useMemo(() => {
    return Math.max(...Object.values(stats.byCategory), 1);
  }, [stats.byCategory]);

  if (loading) return <SkeletonDashboard />;

  return (
    <div className="p-4 space-y-4">
      {/* Page header — compact */}
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold text-white tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={pickRandom}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-accent transition-colors"
          >
            <Dices className="w-3 h-3" />
            <span>Surprise Me</span>
          </button>
          <Link
            href="/search"
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            <Search className="w-3 h-3" />
            <span>Search</span>
            <kbd className="px-1 py-0.5 bg-gray-800 rounded text-[10px] font-mono text-gray-500">/</kbd>
          </Link>
        </div>
      </div>

      {/* Metric strip — hero + supports */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Hero: Total items */}
        <div className="col-span-2 sm:col-span-1 bg-gray-900/80 border border-accent/20 rounded-lg p-4">
          <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">Total items</div>
          <div className="text-3xl font-bold text-white tabular-nums tracking-tight">{stats.total}</div>
          <div className="text-[11px] text-gray-600 mt-1 font-mono tabular-nums">
            {stats.watching} watching · {stats.completed} done
          </div>
        </div>

        {/* Supporting metrics */}
        <div className="bg-gray-900/50 border border-gray-800/50 rounded-lg p-4">
          <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">Watching</div>
          <div className="text-2xl font-bold text-emerald-400 tabular-nums tracking-tight">{stats.watching}</div>
          <div className="mt-2">
            <MiniBar value={stats.watching} max={stats.total} />
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800/50 rounded-lg p-4">
          <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">Completed</div>
          <div className="text-2xl font-bold text-blue-400 tabular-nums tracking-tight">{stats.completed}</div>
          <div className="mt-2">
            <MiniBar value={stats.completed} max={stats.total} />
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800/50 rounded-lg p-4">
          <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">Avg rating</div>
          <div className="text-2xl font-bold text-amber-400 tabular-nums tracking-tight flex items-center gap-1.5">
            {stats.avgRating}
            {stats.avgRating !== '—' && <Star className="w-4 h-4 text-amber-400/60 fill-current" />}
          </div>
          <div className="text-[11px] text-gray-600 mt-1 font-mono">
            {Object.keys(stats.byCategory).length} categories
          </div>
        </div>
      </div>

      {/* Continue Watching — horizontal card strip */}
      {watchingItems.length > 0 && (
        <div className="bg-gray-900/50 border border-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-medium text-gray-400">Continue Watching</h2>
            <span className="text-[10px] font-mono text-gray-600">{watchingItems.length} items</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {watchingItems.map(item => {
              const catMeta = CATEGORY_META[item.category] || { icon: Clapperboard, label: item.category };
              const CatIcon = catMeta.icon;
              const pct = item.totalEpisodes ? Math.round(((item.currentEp || 0) / item.totalEpisodes) * 100) : 0;
              return (
                <div
                  key={item.id}
                  onClick={() => router.push(`/media/${item.id}`)}
                  className="flex-shrink-0 w-48 bg-gray-800/50 border border-gray-700/30 rounded-lg p-3 hover:border-accent/30 transition-colors cursor-pointer group"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-10 h-14 rounded overflow-hidden bg-gray-700 shrink-0 relative">
                      {item.posterUrl ? (
                        <>
                          <div className="absolute inset-0 flex items-center justify-center z-0">
                            <CatIcon className="w-3 h-3 text-gray-600" />
                          </div>
                          <img
                            src={item.posterUrl}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover z-10"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <CatIcon className="w-3 h-3 text-gray-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-white font-medium leading-snug line-clamp-2">{item.title}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5 font-mono">
                        {item.currentEp || 0}/{item.totalEpisodes || '?'} episodes
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1">
                      <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="text-[10px] text-gray-600 mt-1 text-right font-mono">{pct}%</div>
                    </div>
                    <button
                      onClick={(e) => incrementEpisode(e, item)}
                      className="shrink-0 w-6 h-6 rounded bg-accent/10 hover:bg-accent/20 flex items-center justify-center transition-colors"
                      title="+1 Episode"
                    >
                      <Plus className="w-3 h-3 text-accent" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Category breakdown + Status overview — side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Category horizontal bars */}
        <div className="lg:col-span-2 bg-gray-900/50 border border-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-medium text-gray-400">By category</h2>
            <BarChart3 className="w-3.5 h-3.5 text-gray-600" />
          </div>
          <div className="space-y-2.5">
            {Object.entries(stats.byCategory)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, count]) => {
                const meta = CATEGORY_META[cat] || { icon: Clapperboard, label: cat };
                const Icon = meta.icon;
                return (
                  <div key={cat} className="flex items-center gap-3">
                    <div className="flex items-center gap-2 w-24 shrink-0">
                      <Icon className="w-3.5 h-3.5 text-gray-500" />
                      <span className="text-xs text-gray-400 truncate">{meta.label}</span>
                    </div>
                    <div className="flex-1">
                      <MiniBar value={count} max={maxCategoryCount} />
                    </div>
                    <span className="text-xs font-mono text-gray-500 tabular-nums w-8 text-right">{count}</span>
                  </div>
                );
              })}
            {Object.keys(stats.byCategory).length === 0 && (
              <div className="text-xs text-gray-600 py-4 text-center">No data yet</div>
            )}
          </div>
        </div>

        {/* Status overview — compact list */}
        <div className="bg-gray-900/50 border border-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-medium text-gray-400">By status</h2>
            <TrendingUp className="w-3.5 h-3.5 text-gray-600" />
          </div>
          <div className="space-y-2">
            {Object.entries(stats.byStatus)
              .sort((a, b) => b[1] - a[1])
              .map(([status, count]) => {
                const meta = STATUS_META[status] || { color: 'text-gray-400', dot: 'bg-gray-400' };
                return (
                  <div key={status} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                      <span className="text-xs text-gray-400 capitalize">{status.replace(/_/g, '-')}</span>
                    </div>
                    <span className="text-xs font-mono text-gray-500 tabular-nums">{count}</span>
                  </div>
                );
              })}
            {Object.keys(stats.byStatus).length === 0 && (
              <div className="text-xs text-gray-600 py-4 text-center">No data yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent items — table */}
      <div className="bg-gray-900/50 border border-gray-800/50 rounded-lg">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800/50">
          <h2 className="text-xs font-medium text-gray-400">Recently updated</h2>
          <span className="text-[10px] font-mono text-gray-600 tabular-nums">{recentItems.length} items</span>
        </div>

        {recentItems.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-xs text-gray-500">No media added yet</p>
            <Link href="/search" className="text-xs text-accent hover:text-accent mt-1 inline-flex items-center gap-1 transition-colors">
              Search and add your first title <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-800/50">
                  <th className="px-4 py-2 text-[10px] font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-4 py-2 text-[10px] font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-4 py-2 text-[10px] font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-2 text-[10px] font-medium text-gray-500 uppercase tracking-wider text-right">Progress</th>
                  <th className="px-4 py-2 text-[10px] font-medium text-gray-500 uppercase tracking-wider text-right">Rating</th>
                  <th className="px-4 py-2 text-[10px] font-medium text-gray-500 uppercase tracking-wider text-right">Updated</th>
                </tr>
              </thead>
              <tbody>
                {recentItems.map(item => {
                  const statusMeta = STATUS_META[item.status] || { dot: 'bg-gray-400', color: 'text-gray-400' };
                  const catMeta = CATEGORY_META[item.category] || { icon: Clapperboard, label: item.category };
                  const CatIcon = catMeta.icon;
                  const score = item.rating ? (item.rating > 10 ? (item.rating / 10).toFixed(1) : item.rating.toFixed(1)) : '—';
                  const progress = item.totalEpisodes ? `${item.currentEp || 0}/${item.totalEpisodes}` : '—';
                  const updated = item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';


                  return (
                    <tr
                      key={item.id}
                      onClick={() => router.push(`/media/${item.id}`)}
                      className="border-b border-gray-800/30 hover:bg-gray-800/20 transition-colors duration-200 cursor-pointer"
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-6 h-8 rounded overflow-hidden bg-gray-800 shrink-0 relative">
                            {item.posterUrl ? (
                              <>
                                <div className="absolute inset-0 flex items-center justify-center z-0">
                                  <CatIcon className="w-3 h-3 text-gray-600" />
                                </div>
                                <img
                                  src={item.posterUrl}
                                  alt=""
                                  className="absolute inset-0 w-full h-full object-cover z-10"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                              </>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <CatIcon className="w-3 h-3 text-gray-600" />
                              </div>
                            )}
                          </div>
                          <span className="text-xs text-white font-medium leading-snug">{item.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-[11px] text-gray-500 capitalize">{catMeta.label}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
                          <span className="text-[11px] text-gray-400 capitalize">{item.status.replace(/_/g, '-')}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span className="text-[11px] font-mono text-gray-500 tabular-nums">{progress}</span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span className="text-[11px] font-mono text-gray-500 tabular-nums flex items-center justify-end gap-1">
                          {score !== '—' && <Star className="w-2.5 h-2.5 text-amber-400/60 fill-current" />}
                          {score}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span className="text-[10px] font-mono text-gray-600 tabular-nums">{updated}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
