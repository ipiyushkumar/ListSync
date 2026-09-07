/**
 * Centralized API client for ListSync
 * Eliminates scattered fetch calls across components
 */

const API_BASE = '';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => `HTTP ${res.status}`);
    throw new Error(errorText || `API error: ${res.status}`);
  }

  return res.json();
}

// Media API
export const mediaApi = {
  list: (params?: { category?: string; status?: string; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.set('category', params.category);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const query = searchParams.toString();
    return apiFetch<any[]>(`/api/media${query ? `?${query}` : ''}`);
  },

  get: (id: string) => apiFetch<any>(`/api/media/${id}`),

  create: (data: Record<string, unknown>) =>
    apiFetch<any>('/api/media', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Record<string, unknown>) =>
    apiFetch<any>(`/api/media/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiFetch<{ success: boolean }>(`/api/media/${id}`, {
      method: 'DELETE',
    }),
};

// Search API
export const searchApi = {
  search: (query: string, category?: string) => {
    const params = new URLSearchParams({ q: query });
    if (category) params.set('category', category);
    return apiFetch<any[]>(`/api/search?${params}`);
  },
};

// Stats API
export const statsApi = {
  get: () => apiFetch<any>('/api/stats'),
};

// Settings API
export const settingsApi = {
  get: () => apiFetch<Record<string, string>>('/api/settings'),
  
  update: (settings: Record<string, string>) =>
    apiFetch<any>('/api/settings', {
      method: 'POST',
      body: JSON.stringify({ settings }),
    }),
};

// Activity API
export const activityApi = {
  list: (params?: { limit?: number; mediaId?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.mediaId) searchParams.set('mediaId', params.mediaId);
    const query = searchParams.toString();
    return apiFetch<any[]>(`/api/activity${query ? `?${query}` : ''}`);
  },

  log: (data: { mediaId: string; action: string; episode?: number; source?: string }) =>
    apiFetch<any>('/api/activity', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Collections API
export const collectionsApi = {
  list: () => apiFetch<any[]>('/api/collections'),

  create: (data: { name: string; description?: string; color?: string }) =>
    apiFetch<any>('/api/collections', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiFetch<{ success: boolean }>(`/api/collections/${id}`, {
      method: 'DELETE',
    }),

  addItem: (collectionId: string, mediaId: string) =>
    apiFetch<any>(`/api/collections/${collectionId}/items`, {
      method: 'POST',
      body: JSON.stringify({ mediaId }),
    }),

  removeItem: (collectionId: string, mediaId: string) =>
    apiFetch<{ success: boolean }>(`/api/collections/${collectionId}/items/${mediaId}`, {
      method: 'DELETE',
    }),
};

// Export API
export const exportApi = {
  json: () => apiFetch<any[]>('/api/export'),
  
  csv: async () => {
    const res = await fetch('/api/export?format=csv');
    if (!res.ok) throw new Error('Export failed');
    return res.text();
  },
};

// Import API
export const importApi = {
  json: (media: any[]) =>
    apiFetch<{ imported: number; skipped: number; errors: string[] }>('/api/import', {
      method: 'POST',
      body: JSON.stringify({ media }),
    }),

  csv: async (csvText: string) => {
    const res = await fetch('/api/import', {
      method: 'POST',
      headers: { 'Content-Type': 'text/csv' },
      body: csvText,
    });
    if (!res.ok) throw new Error('Import failed');
    return res.json();
  },
};

// Connectors API
export const connectorsApi = {
  list: () => apiFetch<any[]>('/api/connectors'),

  toggle: (id: string, isActive: boolean) =>
    apiFetch<any>('/api/connectors', {
      method: 'POST',
      body: JSON.stringify({ id, isActive }),
    }),
};
