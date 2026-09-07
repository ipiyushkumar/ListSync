/**
 * Shared types for ListSync
 */

export interface MediaItem {
  id: string;
  title: string;
  category: string;
  status: string;
  posterUrl: string | null;
  currentEp: number;
  totalEpisodes: number | null;
  rating: number | null;
  genres: string | null;
  createdAt: string;
  updatedAt: string;
}
