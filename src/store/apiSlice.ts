import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { MediaItem, SearchResult, MediaCategory } from '@/types/media';

export const mediaApi = createApi({
  reducerPath: 'mediaApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Media'],
  endpoints: (builder) => ({
    // Local media CRUD
    getMedia: builder.query<MediaItem[], { category?: MediaCategory; status?: string }>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params.category) searchParams.set('category', params.category);
        if (params.status) searchParams.set('status', params.status);
        return `/media?${searchParams.toString()}`;
      },
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Media' as const, id })), { type: 'Media', id: 'LIST' }]
          : [{ type: 'Media', id: 'LIST' }],
    }),
    getMediaById: builder.query<MediaItem, string>({
      query: (id) => `/media/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Media', id }],
    }),
    addMedia: builder.mutation<MediaItem, Partial<MediaItem>>({
      query: (body) => ({ url: '/media', method: 'POST', body }),
      invalidatesTags: [{ type: 'Media', id: 'LIST' }],
    }),
    updateMedia: builder.mutation<MediaItem, { id: string; data: Partial<MediaItem> }>({
      query: ({ id, data }) => ({ url: `/media/${id}`, method: 'PUT', body: data }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Media', id }, { type: 'Media', id: 'LIST' }],
    }),
    deleteMedia: builder.mutation<void, string>({
      query: (id) => ({ url: `/media/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Media', id: 'LIST' }],
    }),

    // External search
    searchMedia: builder.query<SearchResult[], { query: string; category?: MediaCategory }>({
      query: ({ query, category }) => {
        const searchParams = new URLSearchParams({ q: query });
        if (category) searchParams.set('category', category);
        return `/search?${searchParams.toString()}`;
      },
    }),
  }),
});

export const {
  useGetMediaQuery,
  useGetMediaByIdQuery,
  useAddMediaMutation,
  useUpdateMediaMutation,
  useDeleteMediaMutation,
  useSearchMediaQuery,
  useLazySearchMediaQuery,
} = mediaApi;
