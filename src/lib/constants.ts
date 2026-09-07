/**
 * Shared constants for ListSync
 * Centralizes STATUS_META, CATEGORY_META, and status normalization
 * Works for both API routes (string icons) and UI (LucideIcon components)
 */

import {
  Film, BookOpen, Tv, Music, Clapperboard,
  Eye, CheckCircle2, Clock, Ban, Pause,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Status normalization: UI uses 'on-hold', DB uses 'on_hold'
export function normalizeStatus(status: string): string {
  return status === 'on-hold' ? 'on_hold' : status;
}

// Canonical status values
export type MediaStatus = 
  | 'watching' 
  | 'reading' 
  | 'listening' 
  | 'completed' 
  | 'planned' 
  | 'dropped' 
  | 'on_hold';

export type MediaCategory = 'anime' | 'manhwa' | 'movie' | 'tv' | 'music';

// Category metadata with LucideIcon components
export const CATEGORY_META: Record<MediaCategory, { 
  label: string; 
  icon: LucideIcon; 
  color: string;
  bg: string;
}> = {
  anime: { label: 'Anime', icon: Film, color: '#a855f7', bg: 'bg-accent/10' },
  manhwa: { label: 'Manhwa', icon: BookOpen, color: '#3b82f6', bg: 'bg-blue-500/10' },
  movie: { label: 'Movies', icon: Clapperboard, color: '#f59e0b', bg: 'bg-amber-500/10' },
  tv: { label: 'TV Shows', icon: Tv, color: '#10b981', bg: 'bg-emerald-500/10' },
  music: { label: 'Music', icon: Music, color: '#ec4899', bg: 'bg-pink-500/10' },
};

// Status metadata with LucideIcon components
export const STATUS_META: Record<MediaStatus, { 
  label: string; 
  color: string; 
  dot: string; 
  icon: LucideIcon;
  bgColor: string;
  dotColor: string;
}> = {
  watching: { label: 'Watching', color: '#10b981', dot: 'bg-emerald-400', icon: Eye, bgColor: 'bg-emerald-500/10', dotColor: 'bg-emerald-400' },
  reading: { label: 'Reading', color: '#10b981', dot: 'bg-emerald-400', icon: BookOpen, bgColor: 'bg-emerald-500/10', dotColor: 'bg-emerald-400' },
  listening: { label: 'Listening', color: '#10b981', dot: 'bg-emerald-400', icon: Music, bgColor: 'bg-emerald-500/10', dotColor: 'bg-emerald-400' },
  completed: { label: 'Completed', color: '#3b82f6', dot: 'bg-blue-400', icon: CheckCircle2, bgColor: 'bg-blue-500/10', dotColor: 'bg-blue-400' },
  planned: { label: 'Planned', color: '#6b7280', dot: 'bg-gray-400', icon: Clock, bgColor: 'bg-gray-500/10', dotColor: 'bg-gray-400' },
  dropped: { label: 'Dropped', color: '#ef4444', dot: 'bg-red-400', icon: Ban, bgColor: 'bg-red-500/10', dotColor: 'bg-red-400' },
  on_hold: { label: 'On Hold', color: '#f59e0b', dot: 'bg-amber-400', icon: Pause, bgColor: 'bg-amber-500/10', dotColor: 'bg-amber-400' },
};

// All valid statuses as array
export const ALL_STATUSES: MediaStatus[] = [
  'watching', 'reading', 'listening', 'completed', 'planned', 'dropped', 'on_hold'
];

// Status to display label
export function getStatusLabel(status: string): string {
  const normalized = normalizeStatus(status) as MediaStatus;
  return STATUS_META[normalized]?.label || status.replace(/_/g, '-');
}

// Status to dot color class
export function getStatusDot(status: string): string {
  const normalized = normalizeStatus(status) as MediaStatus;
  return STATUS_META[normalized]?.dot || 'bg-gray-400';
}

// Status to icon component
export function getStatusIcon(status: string): LucideIcon {
  const normalized = normalizeStatus(status) as MediaStatus;
  return STATUS_META[normalized]?.icon || Clock;
}

// Category to label
export function getCategoryLabel(category: string): string {
  return CATEGORY_META[category as MediaCategory]?.label || category;
}

// Category to color
export function getCategoryColor(category: string): string {
  return CATEGORY_META[category as MediaCategory]?.color || '#6b7280';
}

// Category to icon component
export function getCategoryIcon(category: string): LucideIcon {
  return CATEGORY_META[category as MediaCategory]?.icon || Film;
}

// Get status meta by status string (handles both on-hold and on_hold)
export function getStatusMeta(status: string) {
  const normalized = normalizeStatus(status) as MediaStatus;
  return STATUS_META[normalized] || { 
    label: status, 
    color: '#6b7280', 
    dot: 'bg-gray-400', 
    icon: Clock,
    bgColor: 'bg-gray-500/10',
    dotColor: 'bg-gray-400'
  };
}

// Get category meta by category string
export function getCategoryMeta(category: string) {
  return CATEGORY_META[category as MediaCategory] || { 
    label: category, 
    icon: Film, 
    color: '#6b7280',
    bg: 'bg-gray-500/10'
  };
}
