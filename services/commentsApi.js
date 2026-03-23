import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { tokenStorage } from "../utils/tokenStorage";
import { BASE_URL } from "../utils/apiConfig";


export const commentsApi = createApi({
  reducerPath: "commentsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: async (headers, { getState, endpoint }) => {
      // Get token from AsyncStorage
      const token = await tokenStorage.getAccessToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Comments", "CommentReplies", "UserComments"],
  endpoints: (builder) => ({
    // Get comments for a specific reel
    getCommentsByReel: builder.query({
      query: ({ reelId, page = 1, limit = 10 }) => ({
        url: `/reels/${reelId}/comments?page=${page}&limit=${limit}`,
        method: "GET",
      }),
      providesTags: (result, error, { reelId }) => 
        result 
          ? [
              ...result.data?.comments?.map(({ _id }) => ({ type: 'Comments', id: _id })) || [],
              { type: 'Comments', id: 'LIST', reelId },
              { type: 'Comments', id: 'PARTIAL-LIST' }
            ]
          : [{ type: 'Comments', id: 'LIST', reelId }, { type: 'Comments', id: 'PARTIAL-LIST' }],
      transformResponse: (response) => {
        if (response.status === 1 && response.data) {
          return {
            success: true,
            message: response.message,
            data: {
              comments: response.data.comments || [],
              pagination: response.data.pagination || {},
              total: response.data.pagination?.totalComments || 0
            }
          };
        }
        
        return response;
      },
    }),

    // Get replies for a specific comment
    getCommentReplies: builder.query({
      query: ({ commentId, page = 1, limit = 10 }) => ({
        url: `/comments/${commentId}/replies?page=${page}&limit=${limit}`,
        method: "GET",
      }),
      providesTags: (result, error, { commentId }) => 
        result 
          ? [
              ...result.data?.replies?.map(({ _id }) => ({ type: 'CommentReplies', id: _id })) || [],
              { type: 'CommentReplies', id: 'LIST', commentId }
            ]
          : [{ type: 'CommentReplies', id: 'LIST', commentId }],
      transformResponse: (response) => {
        if (response.status === 1 && response.data) {
          return {
            success: true,
            message: response.message,
            data: {
              replies: response.data.replies || [],
              pagination: response.data.pagination || {},
              total: response.data.pagination?.totalReplies || 0
            }
          };
        }
        
        return response;
      },
    }),

    // Get a specific comment by ID
    getCommentById: builder.query({
      query: (commentId) => ({
        url: `/comments/${commentId}`,
        method: "GET",
      }),
      providesTags: (result, error, commentId) => [{ type: 'Comments', id: commentId }],
    }),

    // Get comments by a specific user
    getCommentsByUser: builder.query({
      query: ({ userId, page = 1, limit = 10 }) => ({
        url: `/users/${userId}/comments?page=${page}&limit=${limit}`,
        method: "GET",
      }),
      providesTags: (result, error, { userId }) => 
        result 
          ? [
              ...result.data?.comments?.map(({ _id }) => ({ type: 'UserComments', id: _id })) || [],
              { type: 'UserComments', id: 'LIST', userId }
            ]
          : [{ type: 'UserComments', id: 'LIST', userId }],
    }),

    // Create a new comment
    createComment: builder.mutation({
      query: ({ reelId, content, parentCommentId }) => ({
        url: `/reels/${reelId}/comments`,
        method: "POST",
        body: {
          content,
          ...(parentCommentId && { parentCommentId })
        },
      }),
      invalidatesTags: (result, error, { reelId, parentCommentId }) => [
        { type: 'Comments', id: 'LIST', reelId },
        { type: 'Comments', id: 'PARTIAL-LIST' },
        ...(parentCommentId ? [{ type: 'CommentReplies', id: 'LIST', parentCommentId }] : [])
      ],
    }),

    // Update a comment
    updateComment: builder.mutation({
      query: ({ commentId, content }) => ({
        url: `/comments/${commentId}`,
        method: "PUT",
        body: { content },
      }),
      invalidatesTags: (result, error, commentId) => [
        { type: 'Comments', id: commentId },
        { type: 'Comments', id: 'LIST' },
        { type: 'Comments', id: 'PARTIAL-LIST' }
      ],
    }),

    // Delete a comment
    deleteComment: builder.mutation({
      query: (commentId) => ({
        url: `/comments/${commentId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, commentId) => [
        { type: 'Comments', id: commentId },
        { type: 'Comments', id: 'LIST' },
        { type: 'Comments', id: 'PARTIAL-LIST' },
        { type: 'CommentReplies', id: 'LIST' }
      ],
    }),

    // Toggle like on a comment
    toggleCommentLike: builder.mutation({
      query: (commentId) => ({
        url: `/comments/${commentId}/like`,
        method: "POST",
      }),
      invalidatesTags: (result, error, commentId) => [
        { type: 'Comments', id: commentId },
        { type: 'Comments', id: 'LIST' },
        { type: 'Comments', id: 'PARTIAL-LIST' }
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
    }),
  }),
});

export const {
  useGetCommentsByReelQuery,
  useGetCommentRepliesQuery,
  useGetCommentByIdQuery,
  useGetCommentsByUserQuery,
  useCreateCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
  useToggleCommentLikeMutation,
} = commentsApi;
