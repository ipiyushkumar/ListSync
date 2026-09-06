'use client';

import { Music } from 'lucide-react';
import MediaPageShell from '@/components/media/MediaPageShell';
import type { MediaPageConfig } from '@/components/media/MediaPageShell';

const config: MediaPageConfig = {
  category: 'music',
  title: 'Music',
  description: 'Your music collection and listening history',
  icon: Music,
  statusFilters: ['all', 'listening', 'completed', 'planned', 'dropped', 'on-hold'] as const,
  activeStatusVerb: 'listening',
  progressLabel: 'Tracks',
  incrementLabel: '+1 Track',
  aspectRatio: 'square',
  emptyMessage: 'No music yet',
};

export default function MusicPage() {
  return <MediaPageShell config={config} />;
}
