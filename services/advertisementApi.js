import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { tokenStorage } from '../utils/tokenStorage';
import { BASE_URL } from '../utils/apiConfig';

export const advertisementApi = createApi({
  reducerPath: 'advertisementApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: BASE_URL,
    prepareHeaders: async (headers, { endpoint }) => {
      // Get the access token
      const token = await tokenStorage.getAccessToken();
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      // Only set Content-Type for non-file-upload endpoints
      // For FormData endpoints, fetchBaseQuery will automatically handle it
      if (endpoint !== 'createAdvertisement' && endpoint !== 'updateAdvertisement') {
        headers.set('Content-Type', 'application/json');
      }
      return headers;
    },
  }),
  tagTypes: ['Advertisement'],
  endpoints: (builder) => ({
    getActiveAdvertisements: builder.query({
      query: (params = {}) => ({
        url: 'advertisements',
        params,
      }),
      providesTags: ['Advertisement'],
      // Remove transformResponse to get the full API response
      // The component will handle the data structure
    }),
    
    // Get advertisements by specific type
    getAdvertisementsByType: builder.query({
      query: (adType) => ({
        url: 'advertisements',
        params: { adType },
      }),
      providesTags: ['Advertisement'],
    }),
    
    // Get advertisement statistics
    getAdvertisementStats: builder.query({
      query: () => ({
        url: 'advertisements/stats',
      }),
      providesTags: ['Advertisement'],
    }),
    
    // Refresh advertisements (force refetch)
    refreshAdvertisements: builder.mutation({
      query: () => ({
        url: 'advertisements',
        method: 'GET',
      }),
      invalidatesTags: ['Advertisement'],
    }),
    
    // Toggle like/unlike advertisement
    toggleAdvertisementLike: builder.mutation({
      query: (advertisementId) => ({
        url: `advertisements/${advertisementId}/like`,
        method: 'POST',
      }),
      invalidatesTags: ['Advertisement'],
      // Optimistic update to immediately reflect the change in UI
      async onQueryStarted(advertisementId, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          // The API response will be handled by the component
        } catch (error) {
          // Error handling is done by the component
        }
      },
    }),
    
    // Get advertisement like count
    getAdvertisementLikeCount: builder.query({
      query: (advertisementId) => ({
        url: `advertisements/${advertisementId}/likes/count`,
        method: 'GET',
      }),
      providesTags: (result, error, advertisementId) => [
        { type: 'Advertisement', id: advertisementId },
      ],
    }),

    // Create advertisement
    createAdvertisement: builder.mutation({
      query: (formData) => ({
        url: 'advertisements',
        method: 'POST',
        body: formData,
        // RTK Query will automatically handle FormData and set the correct Content-Type
      }),
      invalidatesTags: ['Advertisement'],
    }),

    // Get user's advertisements by userId
    getUserAdvertisements: builder.query({
      query: ({ userId, params = {} }) => ({
        url: `advertisements/user/${userId}`,
        params,
      }),
      providesTags: ['Advertisement'],
    }),

    // Update advertisement
    updateAdvertisement: builder.mutation({
      query: ({ id, formData }) => ({
        url: `advertisements/admin/${id}`,
        method: 'PUT',
        body: formData,
      }),
      invalidatesTags: ['Advertisement'],
    }),

    // Delete advertisement
    deleteAdvertisement: builder.mutation({
      query: (id) => ({
        url: `advertisements/admin/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Advertisement'],
    }),

    // Toggle advertisement status (active/inactive)
    toggleAdvertisementStatus: builder.mutation({
      query: (id) => ({
        url: `advertisements/admin/${id}/toggle`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Advertisement'],
    }),

    // Get active ad show order numbers
    getActiveAdShowOrderNos: builder.query({
      query: () => ({
        url: 'ad-show-order-nos/active',
        method: 'GET',
      }),
      providesTags: ['Advertisement'],
    }),
  }),
});

export const { 
  useGetActiveAdvertisementsQuery,
  useGetAdvertisementsByTypeQuery,
  useGetAdvertisementStatsQuery,
  useRefreshAdvertisementsMutation,
  useToggleAdvertisementLikeMutation,
  useGetAdvertisementLikeCountQuery,
  useCreateAdvertisementMutation,
  useGetUserAdvertisementsQuery,
  useUpdateAdvertisementMutation,
  useDeleteAdvertisementMutation,
  useToggleAdvertisementStatusMutation,
  useGetActiveAdShowOrderNosQuery,
} = advertisementApi;
