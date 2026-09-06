'use client';

import { Film } from 'lucide-react';
import MediaPageShell from '@/components/media/MediaPageShell';
import type { MediaPageConfig } from '@/components/media/MediaPageShell';

const config: MediaPageConfig = {
  category: 'anime',
  title: 'Anime',
  description: 'Track your watching progress',
  icon: Film,
  statusFilters: ['all', 'watching', 'completed', 'planned', 'dropped', 'on-hold'] as const,
  activeStatusVerb: 'watching',
  progressLabel: 'Episodes',
  incrementLabel: '+1 Episode',
  aspectRatio: '3/4',
  emptyMessage: 'No anime yet',
};

export default function AnimePage() {
  return <MediaPageShell config={config} />;
}
