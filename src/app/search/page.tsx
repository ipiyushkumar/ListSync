'use client';

import { useState } from 'react';

interface SearchResult {
  id: number | string;
  title: string;
  description: string;
  image: string;
  category: string;
  episodes?: number;
  chapters?: number;
  score?: number;
  year?: number;
  genres?: string[];
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}${filter !== 'all' ? `&category=${filter}` : ''}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToLibrary = async (item: SearchResult) => {
    try {
      await fetch('/api/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: item.title,
          description: item.description,
          category: item.category,
          status: 'planned',
          coverImage: item.image,
          totalEpisodes: item.episodes,
          externalId: String(item.id),
          externalSource: item.category === 'anime' ? 'jikan' : item.category === 'manhwa' ? 'anilist' : 'tmdb',
          genres: item.genres || [],
          rating: item.score,
        }),
      });
      alert(`${item.title} added to your library!`);
    } catch (error) {
      console.error('Failed to add:', error);
    }
  };

  const categoryColors: Record<string, string> = {
    anime: 'bg-pink-500/20 text-pink-400',
    manhwa: 'bg-blue-500/20 text-blue-400',
    movie: 'bg-yellow-500/20 text-yellow-400',
    tv: 'bg-green-500/20 text-green-400',
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Search</h1>
        <p className="text-gray-400">Find anime, manhwa, movies, and TV shows</p>
      </div>

      <div className="flex gap-4 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search for any title..."
          className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-6 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors text-lg"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white px-8 py-4 rounded-xl font-medium transition-colors"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        {['all', 'anime', 'manhwa', 'movie', 'tv'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === cat
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {cat === 'all' ? 'All' : cat === 'tv' ? 'TV Shows' : cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <span className="text-6xl mb-4 block">🔍</span>
          <p className="text-xl">Search for your favorite media</p>
          <p className="text-sm mt-2">Results from Jikan, AniList, and TMDB</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((item, idx) => (
            <div key={idx} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden hover:border-gray-700 transition-all">
              <div className="relative h-48 bg-gray-800">
                {item.image ? (
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-purple-600 to-blue-600">📄</div>
                )}
                <span className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium ${categoryColors[item.category] || 'bg-gray-500/20 text-gray-400'}`}>
                  {item.category === 'tv' ? 'TV Show' : item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                </span>
              </div>
              <div className="p-4">
                <h3 className="text-white font-semibold truncate">{item.title}</h3>
                <p className="text-gray-400 text-sm mt-1 line-clamp-2">{item.description || 'No description available'}</p>
                <div className="flex items-center gap-3 mt-3 text-sm text-gray-500">
                  {item.score && <span>⭐ {item.score}</span>}
                  {item.episodes && <span>📺 {item.episodes} eps</span>}
                  {item.chapters && <span>📖 {item.chapters} ch</span>}
                  {item.year && <span>📅 {item.year}</span>}
                </div>
                {item.genres && item.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.genres.slice(0, 3).map((g, i) => (
                      <span key={i} className="px-2 py-0.5 bg-gray-800 text-gray-400 text-xs rounded">{g}</span>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => addToLibrary(item)}
                  className="mt-4 w-full bg-purple-600/20 text-purple-400 hover:bg-purple-600 hover:text-white py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  + Add to Library
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
