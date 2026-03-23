import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { tokenStorage } from '../utils/tokenStorage';
import { BASE_URL } from '../utils/apiConfig';

const baseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  prepareHeaders: async (headers) => {
    const token = await tokenStorage.getAccessToken();
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    headers.set('Content-Type', 'application/json');
    return headers;
  },
});

export const advertisementCommentsApi = createApi({
  reducerPath: 'advertisementCommentsApi',
  baseQuery,
  tagTypes: ['AdvertisementComment'],
  endpoints: (builder) => ({
    // Get comments for an advertisement
    getAdvertisementComments: builder.query({
      query: ({ advertisementId, page = 1, limit = 50 }) => ({
        url: `/advertisements/${advertisementId}/comments`,
        params: { page, limit },
      }),
      providesTags: (result, error, { advertisementId }) => [
        { type: 'AdvertisementComment', id: advertisementId },
        { type: 'AdvertisementComment', id: 'LIST' },
        { type: 'AdvertisementComment', id: 'PARTIAL-LIST' },
      ],
      transformResponse: (response) => {
        return response;
      },
      transformErrorResponse: (response) => {
        return response;
      },
    }),

    // Create a new comment on an advertisement
    createAdvertisementComment: builder.mutation({
      query: ({ advertisementId, content, parentCommentId = null }) => ({
        url: `/advertisements/${advertisementId}/comments`,
        method: 'POST',
        body: {
          content,
          parentCommentId,
          contentType: 'advertisement',
        },
      }),
      invalidatesTags: (result, error, { advertisementId }) => [
        { type: 'AdvertisementComment', id: advertisementId },
        { type: 'AdvertisementComment', id: 'LIST' },
        { type: 'AdvertisementComment', id: 'PARTIAL-LIST' },
      ],
      transformResponse: (response) => {
        return response;
      },
      transformErrorResponse: (response) => {
        return response;
      },
    }),

    // Toggle like on an advertisement comment
    toggleAdvertisementCommentLike: builder.mutation({
      query: (commentId) => ({
        url: `/advertisement-comments/${commentId}/like`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, commentId) => [
        { type: 'AdvertisementComment', id: 'LIST' },
        { type: 'AdvertisementComment', id: 'PARTIAL-LIST' },
      ],
      // Add optimistic update for better UX
      async onQueryStarted(commentId, { dispatch, queryFulfilled }) {
        // Optimistic update - we'll let the cache invalidation handle the final state
        try {
          await queryFulfilled;
        } catch (error) {
          // Error handling is done by the component
        }
      },
      transformResponse: (response) => {
        return response;
      },
      transformErrorResponse: (response) => {
        return response;
      },
    }),

    // Get comment count for an advertisement
    getAdvertisementCommentCount: builder.query({
      query: (advertisementId) => ({
        url: `/advertisements/${advertisementId}/comments/count`,
      }),
      providesTags: (result, error, advertisementId) => [
        { type: 'AdvertisementComment', id: `${advertisementId}-count` },
      ],
      transformResponse: (response) => {
        return response;
      },
      transformErrorResponse: (response) => {
        return response;
      },
    }),

    // Update an advertisement comment
    updateAdvertisementComment: builder.mutation({
      query: ({ commentId, content }) => ({
        url: `/advertisement-comments/${commentId}`,
        method: 'PUT',
        body: { content },
      }),
      invalidatesTags: (result, error, { commentId }) => [
        { type: 'AdvertisementComment', id: 'LIST' },
        { type: 'AdvertisementComment', id: 'PARTIAL-LIST' },
      ],
      transformResponse: (response) => {
        return response;
      },
      transformErrorResponse: (response) => {
        return response;
      },
    }),

    // Delete an advertisement comment
    deleteAdvertisementComment: builder.mutation({
      query: (commentId) => ({
        url: `/advertisement-comments/${commentId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, commentId) => [
        { type: 'AdvertisementComment', id: 'LIST' },
        { type: 'AdvertisementComment', id: 'PARTIAL-LIST' },
      ],
      transformResponse: (response) => {
        return response;
      },
      transformErrorResponse: (response) => {
        return response;
      },
    }),
  }),
});

export const {
  useGetAdvertisementCommentsQuery,
  useCreateAdvertisementCommentMutation,
  useToggleAdvertisementCommentLikeMutation,
  useGetAdvertisementCommentCountQuery,
  useUpdateAdvertisementCommentMutation,
  useDeleteAdvertisementCommentMutation,
} = advertisementCommentsApi;
