'use client';

import { Clapperboard } from 'lucide-react';
import MediaPageShell from '@/components/media/MediaPageShell';
import type { MediaPageConfig } from '@/components/media/MediaPageShell';

const config: MediaPageConfig = {
  category: 'movie',
  title: 'Movies',
  description: 'Your movie collection and watchlist',
  icon: Clapperboard,
  statusFilters: ['all', 'watching', 'completed', 'planned', 'dropped', 'on-hold'] as const,
  activeStatusVerb: 'watching',
  progressLabel: 'Runtime',
  incrementLabel: '+1 Watch',
  aspectRatio: '3/4',
  emptyMessage: 'No movies yet',
};

export default function MoviesPage() {
  return <MediaPageShell config={config} />;
}
