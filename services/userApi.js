import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { tokenStorage } from '../utils/tokenStorage';
import { BASE_URL } from '../utils/apiConfig';

export const userApi = createApi({
  reducerPath: 'userApi',
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: async (headers) => {
      const token = await tokenStorage.getAccessToken();
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      headers.set('content-type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['User', 'UserProfile', 'FollowStatus', 'BlockedUsers'],
  endpoints: (builder) => ({
    // Get user profile by ID
    getUserProfile: builder.query({
      query: (userId) => {
        return `/users/${userId}`;
      },
      providesTags: (result, error, userId) => [
        { type: 'UserProfile', id: userId },
        { type: 'User', id: userId },
      ],
    }),

    // Get follow status for a user
    getFollowStatus: builder.query({
      query: (userId) => `/users/${userId}/follow-status`,
      providesTags: (result, error, userId) => [
        { type: 'FollowStatus', id: userId },
      ],
    }),

    // Follow a user
    followUser: builder.mutation({
      query: (userId) => ({
        url: `/users/${userId}/follow`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, userId) => [
        { type: 'FollowStatus', id: userId },
        { type: 'UserProfile', id: userId },
        { type: 'User', id: userId },
      ],
    }),

    // Unfollow a user
    unfollowUser: builder.mutation({
      query: (userId) => ({
        url: `/users/${userId}/unfollow`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, userId) => [
        { type: 'FollowStatus', id: userId },
        { type: 'UserProfile', id: userId },
        { type: 'User', id: userId },
      ],
    }),

    // Get user's followers
    getUserFollowers: builder.query({
      query: ({ userId, page = 1, limit = 20 }) => 
        `/users/${userId}/followers?page=${page}&limit=${limit}`,
      providesTags: (result, error, { userId }) => [
        { type: 'User', id: `${userId}-followers` },
      ],
    }),

    // Get user's following
    getUserFollowing: builder.query({
      query: ({ userId, page = 1, limit = 20 }) => 
        `/users/${userId}/following?page=${page}&limit=${limit}`,
      providesTags: (result, error, { userId }) => [
        { type: 'User', id: `${userId}-following` },
      ],
    }),

    // Search users
    searchUsers: builder.query({
      query: ({ query, page = 1, limit = 20 }) => 
        `/users/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
      providesTags: (result, error, { query }) => [
        { type: 'User', id: `search-${query}` },
      ],
    }),

    // Update user profile
    updateUserProfile: builder.mutation({
      query: ({ userId, ...updates }) => ({
        url: `/users/${userId}`,
        method: 'PATCH',
        body: updates,
      }),
      invalidatesTags: (result, error, { userId }) => [
        { type: 'UserProfile', id: userId },
        { type: 'User', id: userId },
      ],
    }),

    // Get user statistics
    getUserStats: builder.query({
      query: (userId) => `/users/${userId}/stats`,
      providesTags: (result, error, userId) => [
        { type: 'User', id: `${userId}-stats` },
      ],
    }),

    // Block a user
    blockUser: builder.mutation({
      query: (userId) => ({
        url: `/users/${userId}/block`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, userId) => [
        { type: 'UserProfile', id: userId },
        { type: 'User', id: userId },
        { type: 'BlockedUsers' },
      ],
    }),

    // Unblock a user
    unblockUser: builder.mutation({
      query: (userId) => ({
        url: `/users/${userId}/unblock`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, userId) => [
        { type: 'UserProfile', id: userId },
        { type: 'User', id: userId },
        { type: 'BlockedUsers' },
      ],
    }),

    // Get blocked users list
    getBlockedUsers: builder.query({
      query: () => '/users/me/blocked-users',
      providesTags: [{ type: 'BlockedUsers' }],
    }),
  }),
});

export const {
  useGetUserProfileQuery,
  useGetFollowStatusQuery,
  useFollowUserMutation,
  useUnfollowUserMutation,
  useGetUserFollowersQuery,
  useGetUserFollowingQuery,
  useSearchUsersQuery,
  useUpdateUserProfileMutation,
  useGetUserStatsQuery,
  useBlockUserMutation,
  useUnblockUserMutation,
  useGetBlockedUsersQuery,
} = userApi;
