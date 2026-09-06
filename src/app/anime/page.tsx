'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Film, Search, SlidersHorizontal, Grid3X3, List, Star,
  ArrowUpDown, Eye, CheckCircle2, Clock, Pause, Ban,
  Plus, TrendingUp, ChevronDown, X,
} from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import ProgressBar from '@/components/ProgressBar';
import AnimeDetailModal from '@/components/anime/AnimeDetailModal';

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

type SortKey = 'title' | 'rating' | 'progress' | 'recent' | 'episodes';
type SortDir = 'asc' | 'desc';
type ViewMode = 'grid' | 'list';

const STATUS_FILTERS = ['all', 'watching', 'completed', 'planned', 'dropped', 'on-hold'] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'recent', label: 'Recently added' },
  { key: 'title', label: 'Title' },
  { key: 'rating', label: 'Rating' },
  { key: 'progress', label: 'Progress' },
  { key: 'episodes', label: 'Episodes' },
];

const STATUS_META: Record<string, { icon: typeof Eye; color: string; bgColor: string }> = {
  watching: { icon: Eye, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10' },
  completed: { icon: CheckCircle2, color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
  planned: { icon: Clock, color: 'text-gray-400', bgColor: 'bg-gray-500/10' },
  dropped: { icon: Ban, color: 'text-red-400', bgColor: 'bg-red-500/10' },
  'on-hold': { icon: Pause, color: 'text-amber-400', bgColor: 'bg-amber-500/10' },
};

export default function AnimePage() {
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('recent');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [activeGenre, setActiveGenre] = useState<string | null>(null);

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
      // error state handled by empty media
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    setLoading(true);
    fetchMedia();
  }, [fetchMedia]);

  // Stats
  const stats = useMemo(() => {
    const counts: Record<string, number> = { watching: 0, completed: 0, planned: 0, dropped: 0, 'on-hold': 0 };
    let totalEpisodes = 0;
    let watchedEpisodes = 0;
    media.forEach((m) => {
      if (counts[m.status] !== undefined) counts[m.status]++;
      totalEpisodes += m.totalEpisodes || 0;
      watchedEpisodes += m.currentEp;
    });
    return { counts, total: media.length, totalEpisodes, watchedEpisodes };
  }, [media]);

  // All genres
  const allGenres = useMemo(() => {
    const genreSet = new Set<string>();
    media.forEach((m) => {
      if (m.genres) {
        try {
          JSON.parse(m.genres).forEach((g: string) => genreSet.add(g));
        } catch { /* skip */ }
      }
    });
    return Array.from(genreSet).sort();
  }, [media]);

  // Filtered + sorted
  const displayed = useMemo(() => {
    let items = [...media];

    // Genre filter
    if (activeGenre) {
      items = items.filter((m) => {
        if (!m.genres) return false;
        try {
          return JSON.parse(m.genres).includes(activeGenre);
        } catch {
          return false;
        }
      });
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          (m.originalTitle && m.originalTitle.toLowerCase().includes(q)) ||
          (m.genres && m.genres.toLowerCase().includes(q))
      );
    }

    // Sort
    items.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'title':
          cmp = a.title.localeCompare(b.title);
          break;
        case 'rating':
          cmp = (a.rating || 0) - (b.rating || 0);
          break;
        case 'progress':
          cmp = (a.totalEpisodes ? a.currentEp / a.totalEpisodes : 0) - (b.totalEpisodes ? b.currentEp / b.totalEpisodes : 0);
          break;
        case 'episodes':
          cmp = a.currentEp - b.currentEp;
          break;
        case 'recent':
        default:
          cmp = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
          break;
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });

    return items;
  }, [media, searchQuery, sortKey, sortDir, activeGenre]);

  const handleUpdate = useCallback((updated: Media) => {
    setMedia((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    setSelectedMedia((prev) => (prev?.id === updated.id ? updated : prev));
  }, []);

  const handleDelete = useCallback((id: string) => {
    setMedia((prev) => prev.filter((m) => m.id !== id));
    setSelectedMedia(null);
  }, []);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/10">
            <Film className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Anime</h1>
            <p className="text-sm text-gray-500">Track your watching progress</p>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          label="Total"
          value={stats.total}
          icon={<Film className="w-4 h-4" />}
          accent
        />
        {Object.entries(STATUS_META).map(([status, meta]) => {
          const Icon = meta.icon;
          return (
            <StatCard
              key={status}
              label={status.replace('-', ' ')}
              value={stats.counts[status] || 0}
              icon={<Icon className="w-4 h-4" />}
              active={activeFilter === status}
              onClick={() => setActiveFilter(activeFilter === status ? 'all' : status as StatusFilter)}
            />
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search anime..."
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

        {/* Sort */}
        <div className="relative">
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
                    if (sortKey === option.key) {
                      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortKey(option.key);
                      setSortDir(option.key === 'title' ? 'asc' : 'desc');
                    }
                    setShowSortMenu(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${
                    sortKey === option.key
                      ? 'text-purple-400 bg-purple-500/10'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                  }`}
                >
                  {option.label}
                  {sortKey === option.key && (
                    <span className="ml-1 text-xs text-gray-500">
                      {sortDir === 'asc' ? 'asc' : 'desc'}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* View toggle */}
        <div className="flex bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 transition-colors ${
              viewMode === 'grid' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 transition-colors ${
              viewMode === 'list' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Genre chips */}
      {allGenres.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveGenre(null)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              activeGenre === null
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800/50 text-gray-500 hover:text-gray-300 hover:bg-gray-800'
            }`}
          >
            All genres
          </button>
          {allGenres.map((genre) => (
            <button
              key={genre}
              onClick={() => setActiveGenre(activeGenre === genre ? null : genre)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                activeGenre === genre
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800/50 text-gray-500 hover:text-gray-300 hover:bg-gray-800'
              }`}
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
            onClick={() => {
              setActiveFilter('all');
              setSearchQuery('');
              setActiveGenre(null);
            }}
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
                <div className="aspect-[3/4] bg-gray-800" />
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
            <Film className="w-8 h-8 text-gray-600" />
          </div>
          <p className="text-gray-400 text-lg font-medium">
            {searchQuery || activeGenre ? 'No matches' : 'No anime yet'}
          </p>
          <p className="text-gray-600 mt-1 text-sm">
            {searchQuery || activeGenre
              ? 'Try adjusting your filters'
              : 'Search and add anime to start tracking'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {displayed.map((item) => (
            <GridCard
              key={item.id}
              item={item}
              onClick={() => setSelectedMedia(item)}
              onIncrement={async () => {
                const newEp = item.totalEpisodes
                  ? Math.min(item.currentEp + 1, item.totalEpisodes)
                  : item.currentEp + 1;
                const res = await fetch(`/api/media/${item.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ currentEp: newEp }),
                });
                if (res.ok) {
                  const updated = await res.json();
                  handleUpdate(updated);
                }
              }}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          {displayed.map((item) => (
            <ListRow
              key={item.id}
              item={item}
              onClick={() => setSelectedMedia(item)}
              onIncrement={async () => {
                const newEp = item.totalEpisodes
                  ? Math.min(item.currentEp + 1, item.totalEpisodes)
                  : item.currentEp + 1;
                const res = await fetch(`/api/media/${item.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ currentEp: newEp }),
                });
                if (res.ok) {
                  const updated = await res.json();
                  handleUpdate(updated);
                }
              }}
            />
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selectedMedia && (
        <AnimeDetailModal
          media={selectedMedia}
          onClose={() => setSelectedMedia(null)}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}

      {/* Close sort menu on outside click */}
      {showSortMenu && (
        <div className="fixed inset-0 z-20" onClick={() => setShowSortMenu(false)} />
      )}
    </div>
  );
}

/* ─── Stat Card ──────────────────────────────────────────── */

function StatCard({
  label,
  value,
  icon,
  accent,
  active,
  onClick,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent?: boolean;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`text-left p-3 rounded-xl border transition-all ${
        accent
          ? 'bg-purple-500/10 border-purple-500/20'
          : active
          ? 'bg-gray-800 border-gray-700 ring-1 ring-purple-500/30'
          : 'bg-gray-900 border-gray-800 hover:border-gray-700'
      } ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span className={accent ? 'text-purple-400' : 'text-gray-500'}>{icon}</span>
        <span className="text-xs text-gray-500 uppercase tracking-wider" style={{ fontSize: '10px' }}>{label}</span>
      </div>
      <span className="text-xl font-bold text-white tabular-nums">{value}</span>
    </button>
  );
}

/* ─── Grid Card ──────────────────────────────────────────── */

function GridCard({
  item,
  onClick,
  onIncrement,
}: {
  item: Media;
  onClick: () => void;
  onIncrement: () => void;
}) {
  const progress = item.totalEpisodes ? Math.round((item.currentEp / item.totalEpisodes) * 100) : 0;
  const genres: string[] = item.genres ? (() => { try { return JSON.parse(item.genres); } catch { return []; } })() : [];
  const isComplete = item.totalEpisodes && item.currentEp >= item.totalEpisodes;

  return (
    <div
      className="group bg-gray-900 rounded-xl border border-gray-800 overflow-hidden cursor-pointer hover:border-gray-700 transition-all duration-200 hover:shadow-lg hover:shadow-black/20"
      onClick={onClick}
    >
      {/* Poster */}
      <div className="relative aspect-[3/4] bg-gray-800 overflow-hidden">
        {item.posterUrl ? (
          <img
            src={item.posterUrl}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600 text-3xl font-bold">
            {item.title[0]}
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

        {/* Quick actions on hover */}
        <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!isComplete) onIncrement();
            }}
            disabled={isComplete}
            className="w-full py-1.5 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-xs font-medium rounded-lg transition-colors"
          >
            {isComplete ? 'Complete' : '+1 Episode'}
          </button>
        </div>

        {/* Status badge */}
        <div className="absolute top-2 right-2">
          <StatusBadge status={item.status} />
        </div>

        {/* Rating */}
        {item.rating != null && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/50 backdrop-blur-sm">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            <span className="text-xs font-medium text-white tabular-nums">{item.rating.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <h3 className="font-medium text-white text-sm truncate" title={item.title}>
          {item.title}
        </h3>

        {genres.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {genres.slice(0, 2).map((g) => (
              <span key={g} className="px-1.5 py-0.5 bg-gray-800 text-gray-400 rounded text-[10px] font-medium">
                {g}
              </span>
            ))}
            {genres.length > 2 && (
              <span className="px-1.5 py-0.5 text-gray-600 text-[10px]">+{genres.length - 2}</span>
            )}
          </div>
        )}

        <ProgressBar current={item.currentEp} total={item.totalEpisodes ?? null} />
      </div>
    </div>
  );
}

/* ─── List Row ───────────────────────────────────────────── */

function ListRow({
  item,
  onClick,
  onIncrement,
}: {
  item: Media;
  onClick: () => void;
  onIncrement: () => void;
}) {
  const genres: string[] = item.genres ? (() => { try { return JSON.parse(item.genres); } catch { return []; } })() : [];
  const isComplete = item.totalEpisodes && item.currentEp >= item.totalEpisodes;
  const progress = item.totalEpisodes ? Math.round((item.currentEp / item.totalEpisodes) * 100) : 0;

  return (
    <div
      className="group flex items-center gap-4 p-3 bg-gray-900 rounded-lg border border-gray-800 cursor-pointer hover:border-gray-700 transition-colors"
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="w-10 h-14 rounded-lg overflow-hidden bg-gray-800 shrink-0">
        {item.posterUrl ? (
          <img src={item.posterUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600 text-sm font-bold">
            {item.title[0]}
          </div>
        )}
      </div>

      {/* Title + genres */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-white text-sm truncate">{item.title}</h3>
          <StatusBadge status={item.status} />
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {genres.slice(0, 3).map((g) => (
            <span key={g} className="text-[10px] text-gray-500 font-medium">{g}</span>
          )).reduce((prev, curr, i) => (i === 0 ? [curr] : [...prev, <span key={`dot-${i}`} className="text-gray-700">·</span>, curr]), [] as React.ReactNode[])}
        </div>
      </div>

      {/* Rating */}
      {item.rating != null && (
        <div className="flex items-center gap-1 shrink-0">
          <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
          <span className="text-sm font-medium text-gray-300 tabular-nums">{item.rating.toFixed(1)}</span>
        </div>
      )}

      {/* Progress bar */}
      <div className="w-32 shrink-0 hidden sm:block">
        <ProgressBar current={item.currentEp} total={item.totalEpisodes ?? null} />
      </div>

      {/* Quick increment */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (!isComplete) onIncrement();
        }}
        disabled={isComplete}
        className="p-1.5 rounded-lg bg-gray-800 hover:bg-purple-600 disabled:opacity-30 disabled:cursor-not-allowed text-gray-400 hover:text-white transition-colors shrink-0"
        title={isComplete ? 'Completed' : '+1 episode'}
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
