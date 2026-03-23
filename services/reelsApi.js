import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { tokenStorage } from "../utils/tokenStorage";
import { BASE_URL } from "../utils/apiConfig";

export const reelsApi = createApi({
  reducerPath: "reelsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL + "/reels",
    prepareHeaders: async (headers, { getState, endpoint }) => {
      // Get token from AsyncStorage like authApi does
      const token = await tokenStorage.getAccessToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Reels", "UserReels"],
  endpoints: (builder) => ({
    getReels: builder.query({
      query: (params) => {
        const userId = params?.userId;
        const page = params?.page || 1;
        const limit = params?.limit || 10;
        const country = params?.country;
        const name = params?.name;
        const caption = params?.caption;
        
        let url = `/`;
        const queryParams = [];
        
        if (userId) {
          queryParams.push(`userId=${encodeURIComponent(userId)}`);
        }
        if (page) {
          queryParams.push(`page=${page}`);
        }
        if (limit) {
          queryParams.push(`limit=${limit}`);
        }
        if (country) {
          queryParams.push(`country=${encodeURIComponent(country)}`);
        }
        if (name) {
          queryParams.push(`name=${encodeURIComponent(name)}`);
        }
        if (caption) {
          queryParams.push(`caption=${encodeURIComponent(caption)}`);
        }
        
        if (queryParams.length > 0) {
          url += `?${queryParams.join('&')}`;
        }
        
        return { url };
      },
      providesTags: ["Reels"],
      transformResponse: (response) => {
        // Handle the nested response structure
        if (response.status === 1 && response.data) {
          return {
            success: true,
            message: response.message,
            data: {
              reels: response.data.reels || [],
              total: response.data.total || 0
            }
          };
        }
        
        // If response doesn't have expected format, return as is
        return response;
      },
    }),
    getReelsByUser: builder.query({
      query: ({ userId, page = 1, limit = 10, country } = {}) => {
        let url = `/user/${userId}?page=${page}&limit=${limit}`;
        if (country) {
          url += `&country=${encodeURIComponent(country)}`;
        }
        return { url };
      },
      providesTags: ["UserReels"],
      transformResponse: (response) => {
        // Handle the nested response structure
        if (response.status === 1 && response.data) {
          return {
            success: true,
            message: response.message,
            data: {
              reels: response.data.reels || [],
              pagination: response.data.pagination || {},
              total: response.data.pagination?.totalReels || 0
            }
          };
        }
        
        // If response doesn't have expected format, return as is
        return response;
      },
    }),
    getCommentCount: builder.query({
      query: (reelId) => ({ url: `/${reelId}/comments/count` }),
      transformResponse: (response) => {
        // Handle the nested response structure
        if (response.status === 1 && response.data) {
          return {
            success: true,
            message: response.message,
            data: response.data
          };
        }
        
        // If response doesn't have expected format, return as is
        return response;
      },
    }),
    createReel: builder.mutation({
      query: (formData) => ({ url: "/", method: "POST", body: formData }),
      invalidatesTags: ["Reels", "UserReels"],
    }),
    toggleLike: builder.mutation({
      query: (reelId) => ({ url: `/${reelId}/like`, method: "PATCH" }),
      invalidatesTags: ["Reels", "UserReels"],
    }),
    deleteReel: builder.mutation({
      query: (reelId) => ({ url: `/${reelId}`, method: "DELETE" }),
      invalidatesTags: ["Reels", "UserReels"],
    }),
    trackShare: builder.mutation({
      query: (reelId) => ({ 
        url: `/${reelId}/share`, 
        method: "POST",
        // No authentication required for share tracking
        prepareHeaders: (headers) => {
          headers.set("Content-Type", "application/json");
          return headers;
        }
      }),
      transformResponse: (response) => {
        // Handle the nested response structure
        if (response.status === 1 && response.data) {
          return {
            success: true,
            message: response.message,
            data: response.data
          };
        }
        
        // If response doesn't have expected format, return as is
        return response;
      },
      transformErrorResponse: (response) => {
        return response;
      },
    }),
    trackView: builder.mutation({
      query: (reelId) => ({ 
        url: `/${reelId}/view`, 
        method: "POST",
        // No authentication required for view tracking
        prepareHeaders: (headers) => {
          headers.set("Content-Type", "application/json");
          return headers;
        }
      }),
      transformResponse: (response) => {
        // Handle the nested response structure
        if (response.status === 1 && response.data) {
          return {
            success: true,
            message: response.message,
            data: response.data
          };
        }
        
        // If response doesn't have expected format, return as is
        return response;
      },
      transformErrorResponse: (response) => {
        return response;
      },
    }),
  }),
});

export const { 
  useGetReelsQuery, 
  useGetReelsByUserQuery,
  useGetCommentCountQuery,
  useCreateReelMutation, 
  useToggleLikeMutation,
  useDeleteReelMutation,
  useTrackShareMutation,
  useTrackViewMutation
} = reelsApi;
