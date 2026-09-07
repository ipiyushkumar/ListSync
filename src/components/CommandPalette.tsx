'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, LayoutDashboard, Film, BookOpen, Tv, Music, Clapperboard,
  Settings, Activity, ArrowRight, X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { MediaItem } from '@/lib/types';

interface Command {
  id: string;
  label: string;
  icon: LucideIcon;
  shortcut?: string;
  action: () => void;
  category: 'navigation' | 'media';
}

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/search', label: 'Search', icon: Search },
  { path: '/anime', label: 'Anime', icon: Film },
  { path: '/manhwa', label: 'Manhwa', icon: BookOpen },
  { path: '/movies', label: 'Movies', icon: Clapperboard },
  { path: '/tv', label: 'TV Shows', icon: Tv },
  { path: '/music', label: 'Music', icon: Music },
  { path: '/activity', label: 'Activity', icon: Activity },
  { path: '/settings', label: 'Settings', icon: Settings },
];

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  anime: Film,
  manhwa: BookOpen,
  movie: Clapperboard,
  tv: Tv,
  music: Music,
};

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Global keyboard shortcut: Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  // Fetch media when palette opens
  useEffect(() => {
    if (open && media.length === 0) {
      fetch('/api/media')
        .then(r => r.json())
        .then(data => setMedia(Array.isArray(data) ? data : data.items || []))
        .catch(() => {});
    }
  }, [open, media.length]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const commands: Command[] = useMemo(() => {
    const nav: Command[] = NAV_ITEMS.map((item, i) => ({
      id: `nav-${item.path}`,
      label: item.label,
      icon: item.icon,
      shortcut: i === 0 ? '/' : undefined,
      category: 'navigation' as const,
      action: () => { router.push(item.path); setOpen(false); },
    }));

    const items: Command[] = media.map(m => ({
      id: `media-${m.id}`,
      label: m.title,
      icon: CATEGORY_ICONS[m.category] || Film,
      category: 'media' as const,
      action: () => { router.push(`/media/${m.id}`); setOpen(false); },
    }));

    return [...nav, ...items];
  }, [media, router]);

  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(c => c.label.toLowerCase().includes(q));
  }, [commands, query]);

  // Group by category
  const grouped = useMemo(() => {
    const nav = filtered.filter(c => c.category === 'navigation');
    const items = filtered.filter(c => c.category === 'media');
    return { nav, items };
  }, [filtered]);

  const totalResults = filtered.length;

  // Keyboard navigation inside palette
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, totalResults - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      filtered[selectedIndex]?.action();
    }
  }, [filtered, selectedIndex, totalResults]);

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.children[selectedIndex] as HTMLElement;
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (!open) return null;

  let globalIndex = -1;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Palette */}
      <div className="relative w-full max-w-lg bg-gray-900 border border-gray-700/50 rounded-xl shadow-2xl overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
          <Search className="w-4 h-4 text-gray-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Search commands, media, pages..."
            className="flex-1 bg-transparent text-sm text-gray-100 placeholder:text-gray-500 outline-none"
          />
          <button
            onClick={() => setOpen(false)}
            className="p-1 rounded hover:bg-gray-800 text-gray-500 hover:text-gray-300"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-80 overflow-y-auto py-1">
          {totalResults === 0 && (
            <div className="px-4 py-8 text-center text-sm text-gray-500">
              No results found
            </div>
          )}

          {/* Navigation section */}
          {grouped.nav.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                Pages
              </div>
              {grouped.nav.map(cmd => {
                globalIndex++;
                const isSelected = globalIndex === selectedIndex;
                const Icon = cmd.icon;
                return (
                  <button
                    key={cmd.id}
                    onClick={cmd.action}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
                      isSelected
                        ? 'bg-accent/10 text-accent'
                        : 'text-gray-300 hover:bg-gray-800/50'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1 text-left">{cmd.label}</span>
                    {cmd.shortcut && (
                      <kbd className="text-[10px] text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">
                        {cmd.shortcut}
                      </kbd>
                    )}
                    {isSelected && <ArrowRight className="w-3 h-3 text-accent" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Media section */}
          {grouped.items.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                Library
              </div>
              {grouped.items.map(cmd => {
                globalIndex++;
                const isSelected = globalIndex === selectedIndex;
                const Icon = cmd.icon;
                return (
                  <button
                    key={cmd.id}
                    onClick={cmd.action}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
                      isSelected
                        ? 'bg-accent/10 text-accent'
                        : 'text-gray-300 hover:bg-gray-800/50'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1 text-left truncate">{cmd.label}</span>
                    {isSelected && <ArrowRight className="w-3 h-3 text-accent" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-3 py-2 border-t border-gray-800 flex items-center gap-4 text-[10px] text-gray-500">
          <span><kbd className="bg-gray-800 px-1 py-0.5 rounded">Esc</kbd> close</span>
          <span><kbd className="bg-gray-800 px-1 py-0.5 rounded">Enter</kbd> select</span>
          <span><kbd className="bg-gray-800 px-1 py-0.5 rounded">&uarr;&darr;</kbd> navigate</span>
        </div>
      </div>
    </div>
  );
}
