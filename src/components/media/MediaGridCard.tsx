'use client';

import { useState, useRef, useEffect } from 'react';
import { Star, ChevronDown, Check, Heart, Tag } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import ProgressBar from '@/components/ProgressBar';
import { parseGenres } from '@/lib/utils';

export interface Media {
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
  airStatus?: string;
  notes?: string;
  tags?: string;
  favorite?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const STATUS_OPTIONS = [
  { value: 'watching', label: 'Watching' },
  { value: 'completed', label: 'Completed' },
  { value: 'planned', label: 'Planned' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'dropped', label: 'Dropped' },
];

export default function MediaGridCard({
  item,
  onClick,
  onIncrement,
  onStatusChange,
  onFavoriteToggle,
  incrementLabel = '+1',
  incrementDisabled,
  aspectRatio = '3/4',
}: {
  item: Media;
  onClick: () => void;
  onIncrement: () => void;
  onStatusChange?: (newStatus: string) => void;
  onFavoriteToggle?: () => void;
  incrementLabel?: string;
  incrementDisabled?: boolean;
  aspectRatio?: string;
}) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const genres = parseGenres(item.genres);
  const tags = parseGenres(item.tags);
  const isComplete = incrementDisabled ?? (item.totalEpisodes != null && item.currentEp >= item.totalEpisodes);

  useEffect(() => {
    if (!showStatusMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowStatusMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showStatusMenu]);

  return (
    <div
      className="group bg-gray-900 rounded-xl border border-gray-800 overflow-hidden cursor-pointer hover:border-gray-700 transition-all duration-200 hover:shadow-lg hover:shadow-black/20"
      onClick={onClick}
    >
      {/* Poster */}
      <div className={`relative bg-gray-800 overflow-hidden`} style={{ aspectRatio: aspectRatio === 'square' ? '1' : '3/4' }}>
        {/* Fallback — always behind the image */}
        <div className="absolute inset-0 flex items-center justify-center z-0">
          <span className="text-3xl font-bold text-gray-700">{item.title[0]}</span>
        </div>
        {item.posterUrl && (
          <img
            src={item.posterUrl}
            alt={item.title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 z-10"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}

        {/* Favorite heart button — always visible */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFavoriteToggle?.();
          }}
          className="absolute top-2 right-2 z-20 p-1.5 rounded-full bg-black/50 backdrop-blur-sm transition-colors"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${item.favorite ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-400'}`}
          />
        </button>

        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

        {/* Quick action on hover */}
        <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="flex gap-2">
            {onStatusChange && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowStatusMenu(!showStatusMenu); }}
                  className="flex items-center gap-1 py-1.5 px-2.5 bg-gray-800/90 hover:bg-gray-700/90 text-white text-xs font-medium rounded-lg transition-colors backdrop-blur-sm"
                >
                  Status <ChevronDown className="w-3 h-3" />
                </button>
                {showStatusMenu && (
                  <div className="absolute bottom-full mb-1 left-0 w-36 bg-gray-900 border border-gray-700 rounded-lg shadow-xl py-1 z-30">
                    {STATUS_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (opt.value !== item.status) onStatusChange(opt.value);
                          setShowStatusMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-800 transition-colors"
                      >
                        {opt.value === item.status && <Check className="w-3 h-3 text-accent" />}
                        <span className={opt.value === item.status ? 'text-accent font-medium' : ''}>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!isComplete) onIncrement();
              }}
              disabled={isComplete}
              className="flex-1 py-1.5 bg-accent hover:bg-accent-hover disabled:bg-gray-700 disabled:text-gray-500 text-white text-xs font-medium rounded-lg transition-colors"
            >
              {isComplete ? 'Complete' : incrementLabel}
            </button>
          </div>
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
        <h3 className="font-medium text-white text-sm leading-snug" title={item.title}>
          {item.title}
        </h3>

        {item.airStatus && (() => {
          let dotColor = 'bg-gray-400';
          let textColor = 'text-gray-400';
          let bgColor = 'bg-gray-500/10';
          switch (item.airStatus.toLowerCase()) {
            case 'airing':
            case 'releasing':
              dotColor = 'bg-emerald-400';
              textColor = 'text-emerald-400';
              bgColor = 'bg-emerald-500/10';
              break;
            case 'ended':
            case 'finished':
              dotColor = 'bg-gray-400';
              textColor = 'text-gray-400';
              bgColor = 'bg-gray-500/10';
              break;
            case 'canceled':
            case 'cancelled':
              dotColor = 'bg-red-400';
              textColor = 'text-red-400';
              bgColor = 'bg-red-500/10';
              break;
            case 'upcoming':
            case 'not yet released':
              dotColor = 'bg-amber-400';
              textColor = 'text-amber-400';
              bgColor = 'bg-amber-500/10';
              break;
            case 'hiatus':
              dotColor = 'bg-orange-400';
              textColor = 'text-orange-400';
              bgColor = 'bg-orange-500/10';
              break;
          }
          return (
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${bgColor} ${textColor}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
              {item.airStatus}
            </span>
          );
        })()}

        {item.description && (
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        )}

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

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            <Tag className="w-3 h-3 text-accent mt-0.5 shrink-0" />
            {tags.slice(0, 3).map((t) => (
              <span key={t} className="px-1.5 py-0.5 bg-accent/10 text-accent rounded text-[10px] font-medium">
                {t}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="px-1.5 py-0.5 text-gray-600 text-[10px]">+{tags.length - 3}</span>
            )}
          </div>
        )}

        <ProgressBar current={item.currentEp} total={item.totalEpisodes ?? null} />
      </div>
    </div>
  );
}
