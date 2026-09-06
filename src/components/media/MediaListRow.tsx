'use client';

import { Plus, Star } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import ProgressBar from '@/components/ProgressBar';
import { parseGenres } from '@/lib/utils';
import type { Media } from './MediaGridCard';

export default function MediaListRow({
  item,
  onClick,
  onIncrement,
  incrementLabel = '+1',
  incrementDisabled,
}: {
  item: Media;
  onClick: () => void;
  onIncrement: () => void;
  incrementLabel?: string;
  incrementDisabled?: boolean;
}) {
  const genres = parseGenres(item.genres);
  const isComplete = incrementDisabled ?? (item.totalEpisodes != null && item.currentEp >= item.totalEpisodes);

  return (
    <div
      className="group flex items-center gap-4 p-3 bg-gray-900 rounded-lg border border-gray-800 cursor-pointer hover:border-gray-700 transition-colors"
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="w-10 h-14 rounded-lg overflow-hidden bg-gray-800 shrink-0 relative">
        {item.posterUrl && (
          <img
            src={item.posterUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover z-10"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center z-0">
          <span className="text-sm font-bold text-gray-600">{item.title[0]}</span>
        </div>
      </div>

      {/* Title + genres */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-white text-sm truncate">{item.title}</h3>
          <StatusBadge status={item.status} />
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {genres.slice(0, 3).map((g, i) => (
            <span key={g}>
              {i > 0 && <span className="text-gray-700 mr-2">·</span>}
              <span className="text-[10px] text-gray-500 font-medium">{g}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Rating */}
      {item.rating != null && (
        <div className="flex items-center gap-1 shrink-0">
          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
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
        className="p-1.5 rounded-lg bg-gray-800 hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed text-gray-400 hover:text-white transition-colors shrink-0"
        title={isComplete ? 'Completed' : incrementLabel}
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
