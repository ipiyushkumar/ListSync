'use client';

import { BookOpen } from 'lucide-react';
import MediaPageShell from '@/components/media/MediaPageShell';
import type { MediaPageConfig } from '@/components/media/MediaPageShell';

const config: MediaPageConfig = {
  category: 'manhwa',
  title: 'Manhwa',
  description: 'Track your manhwa reading progress',
  icon: BookOpen,
  statusFilters: ['all', 'reading', 'completed', 'planned', 'dropped', 'on-hold'] as const,
  activeStatusVerb: 'reading',
  progressLabel: 'Chapters',
  incrementLabel: '+1 Chapter',
  aspectRatio: '3/4',
  emptyMessage: 'No manhwa yet',
};

export default function ManhwaPage() {
  return <MediaPageShell config={config} />;
}
