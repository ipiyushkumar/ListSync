'use client';

import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Film, BookOpen, Tv, Music, Clapperboard } from 'lucide-react';
import Link from 'next/link';
import { MediaItem } from '@/lib/types';

const CATEGORY_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  anime: { bg: 'bg-violet-500', text: 'text-violet-400', label: 'Anime' },
  manhwa: { bg: 'bg-cyan-500', text: 'text-cyan-400', label: 'Manhwa' },
  movie: { bg: 'bg-amber-500', text: 'text-amber-400', label: 'Movies' },
  tv: { bg: 'bg-emerald-500', text: 'text-emerald-400', label: 'TV Shows' },
  music: { bg: 'bg-pink-500', text: 'text-pink-400', label: 'Music' },
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function CalendarPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  const year = now.getFullYear();
  const month = now.getMonth();

  useEffect(() => {
    setLoading(true);
    fetch('/api/media')
      .then((r) => r.json())
      .then((data) => {
        setMedia(Array.isArray(data) ? data : data.media || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Group media by date (based on createdAt)
  const mediaByDate = useMemo(() => {
    const map: Record<string, MediaItem[]> = {};
    media.forEach((item) => {
      const key = formatDate(item.createdAt);
      if (!map[key]) map[key] = [];
      map[key].push(item);
    });
    return map;
  }, [media]);

  // Also group by updatedAt for "last activity" dots
  const activityByDate = useMemo(() => {
    const map: Record<string, MediaItem[]> = {};
    media.forEach((item) => {
      const key = formatDate(item.updatedAt);
      if (!map[key]) map[key] = [];
      map[key].push(item);
    });
    return map;
  }, [media]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  const prevMonth = () => setNow(new Date(year, month - 1, 1));
  const nextMonth = () => setNow(new Date(year, month + 1, 1));

  // Stats for this month
  const monthStats = useMemo(() => {
    let added = 0;
    let updated = 0;
    const cats: Record<string, number> = {};
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const addedItems = mediaByDate[key] || [];
      const activityItems = activityByDate[key] || [];
      added += addedItems.length;
      updated += activityItems.length;
      addedItems.forEach((item) => {
        cats[item.category] = (cats[item.category] || 0) + 1;
      });
    }
    return { added, updated, cats };
  }, [year, month, daysInMonth, mediaByDate, activityByDate]);

  const calendarDays = [];
  // Add empty cells for days before the 1st
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(d);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 p-6">
        <div className="max-w-4xl mx-auto animate-pulse space-y-6">
          <div className="h-8 bg-gray-800 rounded w-48" />
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-800/50 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Calendar</h1>
            <p className="text-sm text-gray-500">Your media journey over time</p>
          </div>
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            ← Dashboard
          </Link>
        </div>

        {/* Month stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Added</p>
            <p className="text-2xl font-bold text-white">{monthStats.added}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Updated</p>
            <p className="text-2xl font-bold text-white">{monthStats.updated}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Active Days</p>
            <p className="text-2xl font-bold text-white">
              {Object.keys(mediaByDate).filter((key) => {
                const d = new Date(key);
                return d.getFullYear() === year && d.getMonth() === month;
              }).length}
            </p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Categories</p>
            <div className="flex gap-1.5 mt-1">
              {Object.entries(monthStats.cats).map(([cat, count]) => (
                <span
                  key={cat}
                  className={`text-xs px-1.5 py-0.5 rounded-full ${CATEGORY_COLORS[cat]?.bg || 'bg-gray-500'} text-white`}
                  title={`${cat}: ${count}`}
                >
                  {count}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Month navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={prevMonth}
            className="p-2 rounded-lg bg-gray-900 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold text-white">
            {MONTHS[month]} {year}
          </h2>
          <button
            onClick={nextMonth}
            className="p-2 rounded-lg bg-gray-900 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Calendar grid */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-3 sm:p-4">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEKDAYS.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, i) => {
              if (day === null) {
                return <div key={`empty-${i}`} className="h-16 sm:h-20" />;
              }

              const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const addedItems = mediaByDate[dateKey] || [];
              const activityItems = activityByDate[dateKey] || [];
              const isToday = isCurrentMonth && today.getDate() === day;
              const hasActivity = addedItems.length > 0 || activityItems.length > 0;

              // Get unique categories for this day
              const dayCategories = [...new Set(addedItems.map((item) => item.category))];

              return (
                <div
                  key={day}
                  className={`relative h-16 sm:h-20 rounded-lg border transition-all cursor-default
                    ${isToday ? 'border-accent bg-accent/5 ring-1 ring-accent/30' : 'border-gray-800/50 bg-gray-900/30'}
                    ${hasActivity ? 'hover:border-gray-600' : 'hover:border-gray-800'}
                  `}
                  onMouseEnter={() => setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                >
                  <div className="p-1.5">
                    <span
                      className={`text-xs font-medium
                        ${isToday ? 'text-accent' : 'text-gray-500'}
                      `}
                    >
                      {day}
                    </span>
                  </div>

                  {/* Category dots */}
                  {dayCategories.length > 0 && (
                    <div className="absolute bottom-1.5 left-1.5 flex gap-0.5">
                      {dayCategories.map((cat) => (
                        <span
                          key={cat}
                          className={`w-1.5 h-1.5 rounded-full ${CATEGORY_COLORS[cat]?.bg || 'bg-gray-500'}`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Count badge */}
                  {addedItems.length > 0 && (
                    <span className="absolute top-1 right-1 text-[10px] font-bold text-gray-400">
                      +{addedItems.length}
                    </span>
                  )}

                  {/* Hover tooltip */}
                  {hoveredDay === day && (addedItems.length > 0 || activityItems.length > 0) && (
                    <div className="absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-2 text-left pointer-events-none">
                      <p className="text-[10px] text-gray-500 font-medium mb-1">
                        {MONTHS[month]} {day}, {year}
                      </p>
                      {addedItems.length > 0 && (
                        <div className="space-y-0.5">
                          <p className="text-[10px] text-gray-400 font-medium">Added:</p>
                          {addedItems.slice(0, 5).map((item) => (
                            <p key={item.id} className="text-xs text-white truncate">
                              <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${CATEGORY_COLORS[item.category]?.bg || 'bg-gray-500'}`} />
                              {item.title}
                            </p>
                          ))}
                          {addedItems.length > 5 && (
                            <p className="text-[10px] text-gray-500">+{addedItems.length - 5} more</p>
                          )}
                        </div>
                      )}
                      {activityItems.filter((a) => !addedItems.find((b) => b.id === a.id)).length > 0 && (
                        <div className="space-y-0.5 mt-1">
                          <p className="text-[10px] text-gray-400 font-medium">Updated:</p>
                          {activityItems
                            .filter((a) => !addedItems.find((b) => b.id === a.id))
                            .slice(0, 3)
                            .map((item) => (
                              <p key={item.id} className="text-xs text-gray-300 truncate">
                                {item.title}
                              </p>
                            ))}
                        </div>
                      )}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45 -mt-1 border-r border-b border-gray-700" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Category legend */}
        <div className="flex flex-wrap gap-3 justify-center">
          {Object.entries(CATEGORY_COLORS).map(([cat, meta]) => (
            <div key={cat} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${meta.bg}`} />
              <span className="text-xs text-gray-500">{meta.label}</span>
            </div>
          ))}
        </div>

        {/* Recent activity timeline */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-400">Recent Activity</h3>
          <div className="space-y-2">
            {media
              .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
              .slice(0, 10)
              .map((item) => {
                const d = new Date(item.updatedAt);
                const now = new Date();
                const diffMs = now.getTime() - d.getTime();
                const diffH = Math.floor(diffMs / (1000 * 60 * 60));
                const diffD = Math.floor(diffH / 24);
                let timeAgo = '';
                if (diffH < 1) timeAgo = 'Just now';
                else if (diffH < 24) timeAgo = `${diffH}h ago`;
                else if (diffD < 7) timeAgo = `${diffD}d ago`;
                else timeAgo = d.toLocaleDateString();

                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-900/50 border border-gray-800/50 hover:border-gray-700 transition-colors"
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${CATEGORY_COLORS[item.category]?.bg || 'bg-gray-500'}`} />
                    <span className="text-sm text-white truncate flex-1">{item.title}</span>
                    <span className="text-xs text-gray-500 shrink-0">{timeAgo}</span>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
