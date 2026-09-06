'use client';

import { Tv } from 'lucide-react';
import MediaPageShell from '@/components/media/MediaPageShell';
import type { MediaPageConfig } from '@/components/media/MediaPageShell';

const config: MediaPageConfig = {
  category: 'tv',
  title: 'TV Shows',
  description: 'Track your series watching progress',
  icon: Tv,
  statusFilters: ['all', 'watching', 'completed', 'planned', 'dropped', 'on-hold'] as const,
  activeStatusVerb: 'watching',
  progressLabel: 'Episodes',
  incrementLabel: '+1 Episode',
  aspectRatio: '3/4',
  emptyMessage: 'No TV shows yet',
};

export default function TVPage() {
  return <MediaPageShell config={config} />;
}
