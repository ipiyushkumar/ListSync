'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search, SlidersHorizontal, Grid3X3, List,
  ArrowUpDown, ChevronDown, X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import StatCard from './StatCard';
import MediaGridCard from './MediaGridCard';
import MediaListRow from './MediaListRow';
import MediaDetailModal from './MediaDetailModal';
import { parseGenres } from '@/lib/utils';
import type { Media } from './MediaGridCard';

/* ─── Types ──────────────────────────────────────────────── */

type SortKey = 'title' | 'rating' | 'progress' | 'recent';
type SortDir = 'asc' | 'desc';
type ViewMode = 'grid' | 'list';

export interface MediaPageConfig {
  category: string;
  title: string;
  description: string;
  icon: LucideIcon;
  statusFilters: readonly string[];
  activeStatusVerb: string;       // 'watching' | 'reading' | 'listening'
  progressLabel: string;          // 'Episodes' | 'Chapters' | 'Tracks'
  incrementLabel: string;         // '+1 Episode' | '+1 Chapter' | '+1 Track'
  aspectRatio?: string;           // '3/4' (default) or 'square'
  emptyMessage?: string;
}

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'recent', label: 'Recently added' },
  { key: 'title', label: 'Title' },
  { key: 'rating', label: 'Rating' },
  { key: 'progress', label: 'Progress' },
];

const STATUS_META: Record<string, { color: string; bgColor: string; dotColor: string }> = {
  watching: { color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', dotColor: 'bg-emerald-400' },
  reading: { color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', dotColor: 'bg-emerald-400' },
  listening: { color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', dotColor: 'bg-emerald-400' },
  completed: { color: 'text-blue-400', bgColor: 'bg-blue-500/10', dotColor: 'bg-blue-400' },
  planned: { color: 'text-gray-400', bgColor: 'bg-gray-500/10', dotColor: 'bg-gray-400' },
  dropped: { color: 'text-red-400', bgColor: 'bg-red-500/10', dotColor: 'bg-red-400' },
  'on-hold': { color: 'text-amber-400', bgColor: 'bg-amber-500/10', dotColor: 'bg-amber-400' },
};

/* ─── Main Shell ─────────────────────────────────────────── */

export default function MediaPageShell({ config }: { config: MediaPageConfig }) {
  const {
    category, title, description, icon: Icon,
    statusFilters, activeStatusVerb, progressLabel,
    incrementLabel, aspectRatio = '3/4', emptyMessage,
  } = config;

  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // Normalize on-hold (hyphen) to on_hold (underscore) to match DB canonical form
  const normalizeStatus = (s: string) => s === 'on-hold' ? 'on_hold' : s;
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('recent');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [activeGenre, setActiveGenre] = useState<string | null>(null);

  /* ── Data fetch ──────────────────────────────────────── */
  const fetchMedia = useCallback(async () => {
    try {
      const params = new URLSearchParams({ category });
      const res = await fetch(`/api/media?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setMedia(Array.isArray(data) ? data : data.items || []);
    } catch { /* empty */ } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => { setLoading(true); fetchMedia(); }, [fetchMedia]);

  /* ── Stats ───────────────────────────────────────────── */
  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    statusFilters.forEach((s) => { counts[s] = 0; });
    media.forEach((m) => {
      const key = normalizeStatus(m.status);
      if (counts[key] !== undefined) counts[key]++;
      // Also count under original filter key if normalized form differs
      const origKey = statusFilters.find((f) => normalizeStatus(f as string) === key);
      if (origKey && counts[origKey] !== undefined) counts[origKey]++;
    });
    return { counts, total: media.length };
  }, [media, statusFilters]);

  /* ── Genres ──────────────────────────────────────────── */
  const allGenres = useMemo(() => {
    const s = new Set<string>();
    media.forEach((m) => {
      parseGenres(m.genres).forEach((g) => s.add(g));
    });
    return Array.from(s).sort();
  }, [media]);

  /* ── Filtered + sorted ──────────────────────────────── */
  const displayed = useMemo(() => {
    let items = [...media];

    // Status filter (client-side) — normalize on-hold to on_hold for DB match
    if (activeFilter !== 'all') {
      const filterStatus = normalizeStatus(activeFilter);
      items = items.filter((m) => normalizeStatus(m.status) === filterStatus);
    }

    if (activeGenre) {
      items = items.filter((m) => parseGenres(m.genres).includes(activeGenre));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter((m) =>
        m.title.toLowerCase().includes(q) ||
        (m.originalTitle && m.originalTitle.toLowerCase().includes(q)) ||
        (m.genres && m.genres.toLowerCase().includes(q))
      );
    }

    items.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'title': cmp = a.title.localeCompare(b.title); break;
        case 'rating': cmp = (a.rating || 0) - (b.rating || 0); break;
        case 'progress':
          cmp = (a.totalEpisodes ? a.currentEp / a.totalEpisodes : 0)
              - (b.totalEpisodes ? b.currentEp / b.totalEpisodes : 0);
          break;
        default:
          cmp = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });

    return items;
  }, [media, searchQuery, sortKey, sortDir, activeGenre, activeFilter]);

  /* ── Mutations ───────────────────────────────────────── */
  const handleUpdate = useCallback((updated: Media) => {
    setMedia((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    setSelectedMedia((prev) => (prev?.id === updated.id ? updated : prev));
  }, []);

  const handleDelete = useCallback((id: string) => {
    setMedia((prev) => prev.filter((m) => m.id !== id));
    setSelectedMedia(null);
  }, []);

  const handleIncrement = useCallback(async (item: Media) => {
    const newEp = item.totalEpisodes
      ? Math.min(item.currentEp + 1, item.totalEpisodes)
      : item.currentEp + 1;
    const body: Record<string, unknown> = { currentEp: newEp };
    // Auto-complete when hitting total episodes
    if (item.totalEpisodes && newEp >= item.totalEpisodes && item.status !== 'completed') {
      body.status = 'completed';
    }
    try {
      const res = await fetch(`/api/media/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const updated = await res.json();
        handleUpdate(updated);
      }
    } catch { /* silent */ }
  }, [handleUpdate]);

  /* ── Render ──────────────────────────────────────────── */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/10">
            <Icon className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total" value={stats.total} icon={<Icon className="w-4 h-4" />} accent />
        {statusFilters.filter((s) => s !== 'all').map((status) => {
          const meta = STATUS_META[status];
          return (
            <StatCard
              key={status}
              label={status.replace('-', ' ')}
              value={stats.counts[status] || 0}
              icon={<span className={`w-2 h-2 rounded-full inline-block ${meta?.dotColor || 'bg-gray-400'}`} />}
              active={activeFilter === status}
              onClick={() => setActiveFilter(activeFilter === status ? 'all' : status)}
            />
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${title.toLowerCase()}...`}
            className="w-full pl-9 pr-8 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-gray-500 hover:text-gray-300 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="relative z-30">
          <button
            onClick={() => setShowSortMenu(!showSortMenu)}
            className="flex items-center gap-2 px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-gray-400 hover:text-gray-200 hover:border-gray-700 transition-colors"
          >
            <ArrowUpDown className="w-4 h-4" />
            {SORT_OPTIONS.find((o) => o.key === sortKey)?.label}
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {showSortMenu && (
            <div className="absolute right-0 top-full mt-1 bg-gray-900 border border-gray-800 rounded-lg shadow-xl shadow-black/30 py-1 z-30 min-w-[160px]">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  onClick={() => {
                    if (sortKey === option.key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
                    else { setSortKey(option.key); setSortDir(option.key === 'title' ? 'asc' : 'desc'); }
                    setShowSortMenu(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${
                    sortKey === option.key ? 'text-purple-400 bg-purple-500/10' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                  }`}
                >
                  {option.label}
                  {sortKey === option.key && <span className="ml-1 text-xs text-gray-500">{sortDir === 'asc' ? 'asc' : 'desc'}</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <button onClick={() => setViewMode('grid')} className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button onClick={() => setViewMode('list')} className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Genre chips */}
      {allGenres.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveGenre(null)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${activeGenre === null ? 'bg-purple-600 text-white' : 'bg-gray-800/50 text-gray-500 hover:text-gray-300 hover:bg-gray-800'}`}
          >
            All genres
          </button>
          {allGenres.map((genre) => (
            <button
              key={genre}
              onClick={() => setActiveGenre(activeGenre === genre ? null : genre)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${activeGenre === genre ? 'bg-purple-600 text-white' : 'bg-gray-800/50 text-gray-500 hover:text-gray-300 hover:bg-gray-800'}`}
            >
              {genre}
            </button>
          ))}
        </div>
      )}

      {/* Active filters indicator */}
      {(activeFilter !== 'all' || searchQuery || activeGenre) && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>
            {displayed.length} result{displayed.length !== 1 ? 's' : ''}
            {activeFilter !== 'all' && ` in ${activeFilter.replace('-', ' ')}`}
            {activeGenre && ` · ${activeGenre}`}
            {searchQuery && ` · "${searchQuery}"`}
          </span>
          <button
            onClick={() => { setActiveFilter('all'); setSearchQuery(''); setActiveGenre(null); }}
            className="text-gray-500 hover:text-gray-300 underline underline-offset-2 transition-colors"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden animate-pulse">
                <div className={`${aspectRatio === 'square' ? 'aspect-square' : 'aspect-[3/4]'} bg-gray-800`} />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-gray-800 rounded w-3/4" />
                  <div className="h-3 bg-gray-800 rounded w-1/2" />
                  <div className="h-2 bg-gray-800 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-900 rounded-lg border border-gray-800 animate-pulse" />
            ))}
          </div>
        )
      ) : displayed.length === 0 ? (
        <div className="text-center py-20">
          <div className="inline-flex p-4 rounded-2xl bg-gray-900 border border-gray-800 mb-4">
            <Icon className="w-8 h-8 text-gray-600" />
          </div>
          <p className="text-gray-400 text-lg font-medium">
            {searchQuery || activeGenre ? 'No matches' : emptyMessage || `No ${title.toLowerCase()} yet`}
          </p>
          <p className="text-gray-600 mt-1 text-sm">
            {searchQuery || activeGenre ? 'Try adjusting your filters' : 'Search and add to start tracking'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {displayed.map((item) => (
            <MediaGridCard
              key={item.id}
              item={item}
              onClick={() => setSelectedMedia(item)}
              onIncrement={() => handleIncrement(item)}
              incrementLabel={incrementLabel}
              aspectRatio={aspectRatio}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          {displayed.map((item) => (
            <MediaListRow
              key={item.id}
              item={item}
              onClick={() => setSelectedMedia(item)}
              onIncrement={() => handleIncrement(item)}
              incrementLabel={incrementLabel}
            />
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selectedMedia && (
        <MediaDetailModal
          media={selectedMedia}
          onClose={() => setSelectedMedia(null)}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          progressLabel={progressLabel}
          incrementLabel={incrementLabel}
        />
      )}

      {/* Close sort menu on outside click */}
      {showSortMenu && <div className="fixed inset-0 z-20" onClick={() => setShowSortMenu(false)} />}
    </div>
  );
}
