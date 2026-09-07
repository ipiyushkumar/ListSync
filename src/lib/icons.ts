/**
 * Icon mapping utilities for ListSync
 * Maps icon names to Lucide React components
 */

import {
  Film, BookOpen, Tv, Music, Clapperboard,
  Eye, CheckCircle2, Clock, Ban, Pause,
  Star, Calendar, BarChart3, TrendingUp,
  Search, ArrowRight, Plus, Dices,
  Folder, Download, Activity, Settings,
  LayoutDashboard,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Icon name to component mapping
const ICON_COMPONENTS: Record<string, LucideIcon> = {
  Film,
  BookOpen,
  Tv,
  Music,
  Clapperboard,
  Eye,
  CheckCircle2,
  Clock,
  Ban,
  Pause,
  Star,
  Calendar,
  BarChart3,
  TrendingUp,
  Search,
  ArrowRight,
  Plus,
  Dices,
  Folder,
  Download,
  Activity,
  Settings,
  LayoutDashboard,
};

// Get icon component by name
export function getIconComponent(name: string): LucideIcon {
  return ICON_COMPONENTS[name] || Film; // Default to Film icon
}

// Category to icon component
export function getCategoryIconComponent(category: string): LucideIcon {
  const iconMap: Record<string, LucideIcon> = {
    anime: Film,
    manhwa: BookOpen,
    movie: Clapperboard,
    tv: Tv,
    music: Music,
  };
  return iconMap[category] || Clapperboard;
}

// Status to icon component
export function getStatusIconComponent(status: string): LucideIcon {
  const normalized = status === 'on-hold' ? 'on_hold' : status;
  const iconMap: Record<string, LucideIcon> = {
    watching: Eye,
    reading: BookOpen,
    listening: Music,
    completed: CheckCircle2,
    planned: Clock,
    dropped: Ban,
    on_hold: Pause,
  };
  return iconMap[normalized] || Clock;
}
