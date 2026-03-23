import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { tokenStorage } from "../utils/tokenStorage";
import { BASE_URL } from "../utils/apiConfig";

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL + "/auth",
    timeout: 30000, // 30 second timeout
    prepareHeaders: async (headers, { getState, endpoint }) => {
      // Get token from AsyncStorage instead of Redux state
      const token = await tokenStorage.getAccessToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      // Only set Content-Type for non-multipart requests
      // For updateProfile with FormData, let the browser set the correct Content-Type
      if (endpoint !== 'updateProfile') {
        headers.set("Content-Type", "application/json");
      }
      
      return headers;
    },
  }),
  tagTypes: ["Profile"],
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (body) => ({ url: "/login", method: "POST", body }),
      transformResponse: (response) => {
        // Handle backend response format but maintain expected structure
        if (response.status === 1 && response.data) {
          return {
            success: true,
            data: {
              accessToken: response.data.accessToken,
              refreshToken: response.data.refreshToken,
              user: response.data.user,
            }
          };
        }
        // If response doesn't have expected format, return as is
        return response;
      },
    }),
  
    register: builder.mutation({
      query: (body) => ({ url: "/register", method: "POST", body }),
      transformResponse: (response) => {
        // Handle backend response format
        if (response.status === 1) {
          return { success: true, message: response.message };
        }
        return response;
      },
    }),
    verifyEmail: builder.mutation({
      query: (body) => ({ url: "/verify-email", method: "POST", body }),
      transformResponse: (response) => {
        // Handle backend response format
        if (response.status === 1) {
          return { success: true, message: response.message };
        }
        return response;
      },
    }),
    getProfile: builder.query({
      query: () => "/profile",
      providesTags: ["Profile"],
      transformResponse: (response) => {
        if (response.status === 1 && response.data) {
          return response.data;
        }
        return response;
      },
    }),

    // Get user's active ad plan (plan dates, max ads, etc.)
    getActivePlan: builder.query({
      query: () => "/active-plan",
      providesTags: ["Profile"],
      transformResponse: (response) => {
        if (response.success && response.data) {
          return response.data;
        }
        return response;
      },
    }),

    
    updateProfile: builder.mutation({
      query: (body) => {
        // Check if body contains FormData
        if (body.formData) {
          return {
            url: "/profile",
            method: "PUT",
            body: body.formData,
          };
        }

        // Regular JSON update needs explicit Content-Type header because
        // prepareHeaders skips it for this endpoint to support FormData requests.
        return {
          url: "/profile",
          method: "PUT",
          body,
          headers: {
            "Content-Type": "application/json",
          },
        };
      },
      invalidatesTags: ["Profile"],
      transformResponse: (response) => {
        // Handle different backend response formats
        if (response.status === 1) {
          return { success: true, message: response.message };
        } else if (response.status === 200) {
          return { success: true, message: response.message || 'Profile updated successfully' };
        } else if (response.success) {
          return { success: true, message: response.message };
        } else if (response.message && !response.message.toLowerCase().includes('error')) {
          return { success: true, message: response.message };
        }
        
        // If response doesn't have expected format, return as is
        return response;
      },
    }),

    sendResetPasswordOtp: builder.mutation({
      query: (body) => ({ url: "/send-reset-password-otp", method: "POST", body }),
      transformResponse: (response) => {
        // Handle backend response format
        if (response.status === 1) {
          return { success: true, message: response.message };
        }
        return response;
      },
    }),

    resetPassword: builder.mutation({
      query: (body) => ({ url: "/reset-password", method: "POST", body }),
      transformResponse: (response) => {
        // Handle backend response format
        if (response.status === 1) {
          return { success: true, message: response.message };
        }
        return response;
      },
    }),

    deleteAccount: builder.mutation({
      query: () => ({
        url: "/account",
        method: "DELETE",
        body: { permanent: true },
      }),
      transformResponse: (response) => {
        if (response.status === 1 || response.message) {
          return { success: true, message: response.message };
        }
        return response;
      },
    }),
  }),
});

export const { 
  useLoginMutation, 
  useRegisterMutation, 
  useVerifyEmailMutation,
  useGetProfileQuery,
  useGetActivePlanQuery,
  useUpdateProfileMutation,
  useSendResetPasswordOtpMutation,
  useResetPasswordMutation,
  useDeleteAccountMutation,
} = authApi;

