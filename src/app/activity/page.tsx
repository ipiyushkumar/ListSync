'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Activity as ActivityIcon,
  Play,
  Eye,
  CheckCircle2,
  Pause,
  BookOpen,
  Music,
  Clock,
  Filter,
} from 'lucide-react';

interface ActivityItem {
  id: string;
  mediaId: string;
  action: string;
  episode: number | null;
  timestamp: string;
  source: string | null;
  metadata: string | null;
  media: {
    id: string;
    title: string;
    category: string;
    posterUrl: string | null;
  };
}

const ACTION_META: Record<string, { icon: typeof Play; color: string; bgColor: string; label: string }> = {
  started: { icon: Play, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', label: 'Started' },
  episode_watched: { icon: Eye, color: 'text-purple-400', bgColor: 'bg-purple-500/10', label: 'Watched episode' },
  completed: { icon: CheckCircle2, color: 'text-blue-400', bgColor: 'bg-blue-500/10', label: 'Completed' },
  paused: { icon: Pause, color: 'text-amber-400', bgColor: 'bg-amber-500/10', label: 'Paused' },
  watched: { icon: Eye, color: 'text-purple-400', bgColor: 'bg-purple-500/10', label: 'Watched' },
  read: { icon: BookOpen, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10', label: 'Read' },
  listened: { icon: Music, color: 'text-pink-400', bgColor: 'bg-pink-500/10', label: 'Listened' },
};

function relativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diff = now - then;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

function groupByTime(items: ActivityItem[]): { label: string; items: ActivityItem[] }[] {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 86400000;
  const weekStart = todayStart - 7 * 86400000;

  const groups: Record<string, ActivityItem[]> = {
    'Today': [],
    'Yesterday': [],
    'This Week': [],
    'Earlier': [],
  };

  for (const item of items) {
    const t = new Date(item.timestamp).getTime();
    if (t >= todayStart) groups['Today'].push(item);
    else if (t >= yesterdayStart) groups['Yesterday'].push(item);
    else if (t >= weekStart) groups['This Week'].push(item);
    else groups['Earlier'].push(item);
  }

  return Object.entries(groups)
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({ label, items }));
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const res = await fetch('/api/activity?limit=100');
        if (res.ok) {
          const data = await res.json();
          setActivities(Array.isArray(data) ? data : []);
        }
      } catch { /* empty */ } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, []);

  const categories = useMemo(() => {
    const s = new Set<string>();
    activities.forEach((a) => s.add(a.media.category));
    return Array.from(s).sort();
  }, [activities]);

  const filtered = useMemo(() => {
    let items = activities;
    if (categoryFilter !== 'all') {
      items = items.filter((a) => a.media.category === categoryFilter);
    }
    if (actionFilter !== 'all') {
      items = items.filter((a) => a.action === actionFilter);
    }
    return items;
  }, [activities, categoryFilter, actionFilter]);

  const grouped = useMemo(() => groupByTime(filtered), [filtered]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/10">
            <ActivityIcon className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Activity</h1>
            <p className="text-sm text-gray-500">Timeline of all your media activity</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Filter className="w-4 h-4" />
          <span>Filters:</span>
        </div>

        {/* Category dropdown */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-1.5 bg-gray-900 border border-gray-800 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-purple-500/50 transition-colors"
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </option>
          ))}
        </select>

        {/* Action chips */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setActionFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              actionFilter === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800/50 text-gray-500 hover:text-gray-300 hover:bg-gray-800'
            }`}
          >
            All actions
          </button>
          {Object.entries(ACTION_META).map(([key, meta]) => (
            <button
              key={key}
              onClick={() => setActionFilter(actionFilter === key ? 'all' : key)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                actionFilter === key
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800/50 text-gray-500 hover:text-gray-300 hover:bg-gray-800'
              }`}
            >
              {meta.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-900 rounded-lg border border-gray-800 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="inline-flex p-4 rounded-2xl bg-gray-900 border border-gray-800 mb-4">
            <ActivityIcon className="w-8 h-8 text-gray-600" />
          </div>
          <p className="text-gray-400 text-lg font-medium">No activity yet</p>
          <p className="text-gray-600 mt-1 text-sm">
            {categoryFilter !== 'all' || actionFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Start tracking media to see your activity here'}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map((group) => (
            <div key={group.label}>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                {group.label}
              </h2>
              <div className="relative pl-6 border-l border-gray-800 space-y-4">
                {group.items.map((activity) => {
                  const meta = ACTION_META[activity.action] || ACTION_META.watched;
                  const Icon = meta.icon;
                  return (
                    <div key={activity.id} className="relative">
                      {/* Dot */}
                      <div className={`absolute -left-[31px] top-3 w-3 h-3 rounded-full border-2 border-gray-900 ${meta.color.replace('text-', 'bg-')}`} />

                      {/* Card */}
                      <div className="bg-gray-900/50 border border-gray-800/50 rounded-lg p-4 hover:border-gray-700/50 transition-colors">
                        <div className="flex items-start gap-3">
                          {/* Action icon */}
                          <div className={`p-1.5 rounded-lg ${meta.bgColor} shrink-0`}>
                            <Icon className={`w-4 h-4 ${meta.color}`} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Link
                                href={`/media/${activity.media.id}`}
                                className="text-sm font-medium text-white hover:text-purple-400 transition-colors truncate"
                              >
                                {activity.media.title}
                              </Link>
                              <span className={`text-xs ${meta.color}`}>
                                {meta.label}
                                {activity.episode != null ? ` #${activity.episode}` : ''}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 mt-1.5">
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {relativeTime(activity.timestamp)}
                              </span>
                              {activity.source && (
                                <span className={`text-xs px-1.5 py-0.5 rounded ${
                                  activity.source === 'auto'
                                    ? 'bg-gray-800 text-gray-400'
                                    : activity.source === 'extension'
                                    ? 'bg-purple-500/10 text-purple-400'
                                    : 'bg-gray-800 text-gray-400'
                                }`}>
                                  {activity.source}
                                </span>
                              )}
                              <span className="text-xs text-gray-600 capitalize">
                                {activity.media.category}
                              </span>
                            </div>
                          </div>

                          {/* Poster thumbnail */}
                          {activity.media.posterUrl && (
                            <div className="w-10 h-14 rounded overflow-hidden bg-gray-800 shrink-0">
                              <img
                                src={activity.media.posterUrl}
                                alt=""
                                className="w-full h-full object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
