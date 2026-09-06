'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Search, Star, Tv, BookOpen, Calendar, FileText, Plus,
  Check, Loader2, Sparkles, Film,
} from 'lucide-react';
import Toast from '@/components/Toast';

interface Platform {
  name: string;
  logo_path: string;
  type: 'flatrate' | 'buy' | 'rent' | 'free';
  link: string;
}

interface SeasonDetail {
  seasonNumber: number;
  episodeCount: number;
  name: string;
  anilistId?: number;
}

interface SearchResult {
  id: string | number;
  title?: string;
  name?: string;
  description?: string;
  overview?: string;
  category: string;
  coverImage?: string;
  image?: string;
  poster_path?: string;
  rating?: number;
  averageScore?: number;
  score?: number;
  vote_average?: number;
  totalEpisodes?: number;
  totalSeasons?: number;
  episodes?: number;
  number_of_episodes?: number;
  releaseDate?: string;
  genres?: string[];
  source?: string;
  airStatus?: string;
  platforms?: Platform[];
  seasonDetails?: SeasonDetail[];
}

interface LibraryEntry {
  id: string;
  title: string;
  category: string;
  externalId?: string;
  externalSource?: string;
}

const CATEGORY_META: Record<string, { label: string; icon: typeof Film; color: string; bg: string }> = {
  anime: { label: 'Anime', icon: Sparkles, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  manhwa: { label: 'Manhwa', icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  movie: { label: 'Movie', icon: Film, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  tv: { label: 'TV Show', icon: Tv, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
};

const CATEGORIES = ['all', 'anime', 'manhwa', 'movie', 'tv'] as const;

function getAirStatusColor(status?: string): { dot: string; text: string; bg: string } | null {
  if (!status) return null;
  switch (status.toLowerCase()) {
    case 'airing':
    case 'releasing':
      return { dot: 'bg-emerald-400', text: 'text-emerald-400', bg: 'bg-emerald-500/10' };
    case 'ended':
    case 'finished':
      return { dot: 'bg-gray-400', text: 'text-gray-400', bg: 'bg-gray-500/10' };
    case 'canceled':
    case 'cancelled':
      return { dot: 'bg-red-400', text: 'text-red-400', bg: 'bg-red-500/10' };
    case 'upcoming':
    case 'not yet released':
      return { dot: 'bg-amber-400', text: 'text-amber-400', bg: 'bg-amber-500/10' };
    case 'hiatus':
      return { dot: 'bg-orange-400', text: 'text-orange-400', bg: 'bg-orange-500/10' };
    default:
      return null;
  }
}

function normalizeScore(score: number | undefined): string {
  if (score == null) return '';
  const s = score > 10 ? score / 10 : score;
  return s.toFixed(1);
}

function SkeletonCard() {
  return (
    <div className="bg-gray-900/50 rounded-xl border border-gray-800/50 overflow-hidden animate-pulse">
      <div className="aspect-[3/4] bg-gray-800/50" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-800 rounded w-3/4" />
        <div className="h-3 bg-gray-800/60 rounded w-1/2" />
        <div className="flex gap-2">
          <div className="h-5 bg-gray-800/40 rounded-full w-12" />
          <div className="h-5 bg-gray-800/40 rounded-full w-16" />
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [library, setLibrary] = useState<LibraryEntry[]>([]);
  const [searched, setSearched] = useState(false);
  const [selectedSeasons, setSelectedSeasons] = useState<Record<string, number>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  // ESC key to clear search input and results
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && query) {
        setQuery('');
        setResults([]);
        setSearched(false);
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [query]);

  // Fetch library to detect duplicates
  useEffect(() => {
    fetch('/api/media')
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(data => {
        const items = Array.isArray(data) ? data : data.items || [];
        setLibrary(items.map((m: Record<string, unknown>) => ({
          id: m.id,
          title: m.title,
          category: m.category,
          externalId: m.externalId,
          externalSource: m.externalSource,
        })));
      })
      .catch(() => {});
  }, []);

  // Auto re-search when category filter changes (if already searched)
  useEffect(() => {
    if (searched && query.trim() && !loading) {
      handleSearch();
    }
    // Only run on filter changes, not on handleSearch changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const isInLibrary = useCallback((item: SearchResult) => {
    const searchId = String(item.id);
    const searchSource = item.source || '';
    if (!searchId || !searchSource) return false;
    return library.some(e => e.externalId === searchId && e.externalSource === searchSource);
  }, [library]);

  const handleSearch = useCallback(async () => {
    const q = query.trim();
    if (!q) return;

    setLoading(true);
    setResults([]);
    setSearched(true);

    try {
      const url = `/api/search?q=${encodeURIComponent(q)}${filter !== 'all' ? `&category=${filter}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) {
        setToast({ message: `Search failed: HTTP ${res.status}`, type: 'error' });
        return;
      }
      const data = await res.json();
      const raw: SearchResult[] = Array.isArray(data) ? data : data.results || data.data || [];
      setResults(raw);
    } catch (err: unknown) {
      setToast({ message: `Search failed: ${err instanceof Error ? err.message : 'Unknown error'}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [query, filter]);

  const addToLibrary = async (item: SearchResult) => {
    const title = item.title || item.name || 'Unknown';
    const itemKey = `${item.id}-${item.category}`;
    const currentSeason = selectedSeasons[itemKey] || 1;
    const totalSeasons = item.totalSeasons || (item.seasonDetails ? item.seasonDetails.length : 0);
    try {
      const res = await fetch('/api/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: (item.description || item.overview || '').replace(/<[^>]*>/g, ''),
          category: item.category,
          status: 'planned',
          posterUrl: item.coverImage || item.image || (item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : ''),
          totalEpisodes: item.totalEpisodes || item.episodes || item.number_of_episodes || 0,
          currentEp: 0,
          externalId: String(item.id),
          externalSource: item.source || item.category,
          genres: item.genres || [],
          platforms: (item.platforms || []).map((p: Platform) => p.name),
          airStatus: item.airStatus || null,
          rating: item.rating || item.averageScore || item.score || item.vote_average || 0,
          ...(totalSeasons > 1 && currentSeason > 1 ? { seasonDetails: item.seasonDetails, currentSeason } : {}),
        }),
      });
      if (res.ok) {
        const newEntry = {
          id: String(item.id), title, category: item.category,
          externalId: String(item.id), externalSource: item.source || '',
        };
        setLibrary(prev => [...prev, newEntry]);
        setAddedIds(prev => new Set(prev).add(itemKey));
        const seasonMsg = totalSeasons > 1 && currentSeason > 1
          ? ` (Season ${currentSeason} + ${currentSeason - 1} previous seasons as completed)`
          : '';
        setToast({ message: `Added "${title}" to library${seasonMsg}`, type: 'success' });
      } else {
        const errText = await res.text().catch(() => `HTTP ${res.status}`);
        setToast({ message: `Failed to add: ${errText}`, type: 'error' });
      }
    } catch (err: unknown) {
      setToast({ message: `Add error: ${err instanceof Error ? err.message : 'Unknown error'}`, type: 'error' });
    }
  };

  const totalResults = results.length;
  const sources = new Set(results.map(r => r.source || r.category));

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-white mb-1">Search</h1>
        <p className="text-sm text-gray-500">Find anime, manhwa, movies, and TV shows across AniList, Jikan, and TMDB</p>
      </div>

      {/* Search bar + filters */}
      <div className="mb-6">
        <div className="flex gap-2 mb-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search for any title..."
              className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 transition-colors font-sans"
            />
            {query && (
              <button
                onClick={() => { setQuery(''); inputRef.current?.focus(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              >
                <span className="text-xs">ESC</span>
              </button>
            )}
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="bg-white text-gray-900 hover:bg-gray-100 disabled:bg-gray-800 disabled:text-gray-500 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 shrink-0"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            Search
          </button>
        </div>

        {/* Category pills */}
        <div className="flex gap-1.5">
          {CATEGORIES.map((cat) => {
            const meta = cat === 'all' ? null : CATEGORY_META[cat];
            const Icon = meta?.icon;
            return (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  filter === cat
                    ? 'bg-white/10 text-white'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
                }`}
              >
                {Icon && <Icon className="w-3 h-3" />}
                {cat === 'all' ? 'All' : meta?.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Result count */}
      {searched && !loading && (
        <div className="mb-4 flex items-center gap-2 text-xs text-gray-500">
          <span>{totalResults} result{totalResults !== 1 ? 's' : ''}</span>
          {sources.size > 0 && (
            <>
              <span className="text-gray-700">from</span>
              {Array.from(sources).map(s => (
                <span key={s} className="px-1.5 py-0.5 bg-gray-800/60 rounded text-gray-400 text-[10px] font-medium uppercase tracking-wider">
                  {s}
                </span>
              ))}
            </>
          )}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Empty state — before any search */}
      {!loading && !searched && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-12 h-12 rounded-xl bg-gray-800/50 flex items-center justify-center mb-4">
            <Search className="w-5 h-5 text-gray-600" />
          </div>
          <p className="text-sm text-gray-400 mb-1">Search across multiple sources</p>
          <p className="text-xs text-gray-600">Anime from AniList &middot; Manhwa from AniList &middot; Movies & TV from TMDB</p>
        </div>
      )}

      {/* Empty state — no results */}
      {!loading && searched && results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-12 h-12 rounded-xl bg-gray-800/50 flex items-center justify-center mb-4">
            <FileText className="w-5 h-5 text-gray-600" />
          </div>
          <p className="text-sm text-gray-400">No results found</p>
          <p className="text-xs text-gray-600 mt-1">Try a different search term or category</p>
        </div>
      )}

      {/* Results grid */}
      {!loading && results.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {results.map((item) => {
            const title = item.title || item.name || 'Unknown';
            const image = item.coverImage || item.image || (item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null);
            const score = item.rating || item.averageScore || item.score || item.vote_average;
            const episodes = item.totalEpisodes || item.episodes || item.number_of_episodes;
            const category = item.category || 'unknown';
            const meta = CATEGORY_META[category] || { label: category, icon: FileText, color: 'text-gray-400', bg: 'bg-gray-500/10' };
            const inLibrary = isInLibrary(item);
            const justAdded = addedIds.has(`${item.id}-${item.category}`);

            return (
              <div
                key={`${item.id}-${item.category}`}
                className="group bg-gray-900/60 rounded-lg border border-gray-800/50 overflow-hidden hover:border-gray-700/50 transition-all duration-200"
              >
                {/* Poster */}
                <div className="relative aspect-[3/4] bg-gray-800/30 overflow-hidden">
                  {/* Fallback icon — always rendered behind the image */}
                  <div className="absolute inset-0 flex items-center justify-center z-0">
                    <meta.icon className="w-8 h-8 text-gray-700" />
                  </div>
                  {image && (
                    <img
                      src={image}
                      alt={title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 z-10"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  )}

                  {/* Category badge */}
                  <span className={`absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-medium ${meta.bg} ${meta.color}`}>
                    {meta.label}
                  </span>

                  {/* Source badge */}
                  {item.source && (
                    <span className="absolute top-2 left-[calc(2rem+0.5rem)] px-1.5 py-0.5 rounded-full bg-gray-700/80 text-[10px] font-medium text-gray-300">
                      {item.source === 'anilist' ? 'AniList' : item.source === 'tmdb' ? 'TMDB' : item.source}
                    </span>
                  )}

                  {/* Score badge */}
                  {score != null && (
                    <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[10px] font-medium text-white flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 text-amber-400 fill-current" />
                      {normalizeScore(score)}
                    </span>
                  )}

                  {/* In Library indicator — always visible */}
                  {inLibrary && (
                    <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-emerald-500/90 text-[10px] font-medium text-white flex items-center gap-0.5">
                      <Check className="w-2.5 h-2.5" />
                      In Library
                    </div>
                  )}

                  {/* Hover overlay with action */}
                  <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => addToLibrary(item)}
                      disabled={inLibrary || justAdded}
                      className={`w-full py-1.5 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                        inLibrary || justAdded
                          ? 'bg-emerald-500/20 text-emerald-400 cursor-default'
                          : 'bg-white text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      {inLibrary || justAdded ? (
                        <>
                          <Check className="w-3 h-3" />
                          In library
                        </>
                      ) : (
                        <>
                          <Plus className="w-3 h-3" />
                          Add to library
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <h3 className="text-sm font-medium text-white leading-snug">{title}</h3>
                  {/* Season picker for multi-season shows */}
                  {item.totalSeasons && item.totalSeasons > 1 && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <Tv className="w-2.5 h-2.5 text-gray-500" />
                      <select
                        value={selectedSeasons[`${item.id}-${item.category}`] || item.totalSeasons}
                        onChange={(e) => setSelectedSeasons(prev => ({
                          ...prev,
                          [`${item.id}-${item.category}`]: parseInt(e.target.value),
                        }))}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-gray-800 border border-gray-700 rounded px-1.5 py-0.5 text-[10px] text-gray-300 cursor-pointer focus:outline-none focus:border-gray-500"
                      >
                        {Array.from({ length: item.totalSeasons }, (_, i) => i + 1).map(s => (
                          <option key={s} value={s}>Season {s}</option>
                        ))}
                      </select>
                      <span className="text-[10px] text-gray-600">
                        {selectedSeasons[`${item.id}-${item.category}`] || item.totalSeasons} of {item.totalSeasons}
                      </span>
                    </div>
                  )}
                  {item.airStatus && (() => {
                    const colors = getAirStatusColor(item.airStatus);
                    return colors ? (
                      <span className={`inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${colors.bg} ${colors.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                        {item.airStatus}
                      </span>
                    ) : null;
                  })()}
                  <div className="flex items-center gap-2 mt-1.5 text-[11px] text-gray-500">
                    {episodes != null && (
                      <span className="flex items-center gap-0.5">
                        <Tv className="w-2.5 h-2.5" /> {episodes} ep
                      </span>
                    )}
                    {item.releaseDate && (
                      <span className="flex items-center gap-0.5">
                        <Calendar className="w-2.5 h-2.5" /> {item.releaseDate}
                      </span>
                    )}
                  </div>
                  {item.genres && item.genres.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.genres.slice(0, 2).map((g: string, i: number) => (
                        <span key={i} className="px-1.5 py-0.5 bg-gray-800/60 text-gray-500 text-[10px] rounded">
                          {g}
                        </span>
                      ))}
                      {item.genres.length > 2 && (
                        <span className="px-1 py-0.5 text-gray-600 text-[10px]">+{item.genres.length - 2}</span>
                      )}
                    </div>
                  )}
                  {item.platforms && item.platforms.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.platforms.slice(0, 2).map((p: Platform, i: number) => (
                        <span key={i} className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 text-[10px] rounded font-medium">
                          {p.name}
                        </span>
                      ))}
                      {item.platforms.length > 2 && (
                        <span className="px-1 py-0.5 text-gray-600 text-[10px]">+{item.platforms.length - 2}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
