'use client';

import { useState, useEffect } from 'react';

interface MediaStats {
  total: number;
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
}

interface RecentMedia {
  id: string;
  title: string;
  category: string;
  status: string;
  posterUrl: string | null;
  currentEp: number;
  totalEpisodes: number | null;
  rating: number | null;
  updatedAt: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<MediaStats | null>(null);
  const [recent, setRecent] = useState<RecentMedia[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchRecent();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/media');
      const data = await res.json();
      const byCategory: Record<string, number> = {};
      const byStatus: Record<string, number> = {};
      data.forEach((item: any) => {
        byCategory[item.category] = (byCategory[item.category] || 0) + 1;
        byStatus[item.status] = (byStatus[item.status] || 0) + 1;
      });
      setStats({ total: data.length, byCategory, byStatus });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchRecent = async () => {
    try {
      const res = await fetch('/api/media?limit=6');
      const data = await res.json();
      setRecent(data);
    } catch (error) {
      console.error('Failed to fetch recent:', error);
    } finally {
      setLoading(false);
    }
  };

  const categoryIcons: Record<string, string> = {
    anime: '🎌', manhwa: '📚', movie: '🎬', tv: '📺', music: '🎵'
  };

  const categoryColors: Record<string, string> = {
    anime: 'from-pink-500 to-purple-600',
    manhwa: 'from-blue-500 to-cyan-600',
    movie: 'from-yellow-500 to-orange-600',
    tv: 'from-green-500 to-emerald-600',
    music: 'from-red-500 to-pink-600'
  };

  const statusColors: Record<string, string> = {
    watching: 'bg-blue-500/20 text-blue-400',
    completed: 'bg-green-500/20 text-green-400',
    dropped: 'bg-red-500/20 text-red-400',
    planned: 'bg-gray-500/20 text-gray-400',
    on_hold: 'bg-yellow-500/20 text-yellow-400'
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">Track all your media in one place</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {Object.entries(categoryIcons).map(([category, icon]) => (
          <div key={category} className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-gray-700 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{icon}</span>
              <span className="text-gray-400 capitalize">{category === 'tv' ? 'TV Shows' : category}</span>
            </div>
            <div className="text-3xl font-bold text-white">{stats?.byCategory[category] || 0}</div>
          </div>
        ))}
      </div>

      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Status Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(stats?.byStatus || {}).map(([status, count]) => (
            <div key={status} className="text-center">
              <div className={`inline-block px-4 py-2 rounded-lg ${statusColors[status] || 'bg-gray-500/20 text-gray-400'}`}>
                <span className="text-2xl font-bold">{count}</span>
              </div>
              <div className="text-gray-400 text-sm mt-2 capitalize">{status.replace('_', ' ')}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h2 className="text-xl font-semibold text-white mb-4">Recently Updated</h2>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        ) : recent.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <span className="text-4xl mb-4 block">📝</span>
            <p>No media added yet</p>
            <p className="text-sm mt-2">Search and add your first title to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recent.map((item) => (
              <div key={item.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-all">
                <div className="flex gap-4">
                  <div className="w-16 h-24 rounded-lg overflow-hidden flex-shrink-0">
                    {item.posterUrl ? (
                      <img src={item.posterUrl} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${categoryColors[item.category] || 'from-gray-600 to-gray-800'} flex items-center justify-center text-2xl`}>
                        {categoryIcons[item.category] || '📄'}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium truncate">{item.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded text-xs ${statusColors[item.status] || 'bg-gray-500/20 text-gray-400'}`}>
                        {item.status.replace('_', ' ')}
                      </span>
                      <span className="text-gray-500 text-xs capitalize">{item.category}</span>
                    </div>
                    {item.totalEpisodes && (
                      <div className="mt-2 text-sm text-gray-400">
                        EP {item.currentEp || 0} / {item.totalEpisodes}
                      </div>
                    )}
                    {item.rating && (
                      <div className="mt-1 text-yellow-400 text-sm">
                        {'★'.repeat(Math.floor(item.rating / 2))} {item.rating}/10
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
