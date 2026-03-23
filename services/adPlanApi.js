import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { tokenStorage } from "../utils/tokenStorage";
import { BASE_URL } from "../utils/apiConfig";

export const adPlanApi = createApi({
  reducerPath: "adPlanApi",
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: async (headers, { getState, endpoint }) => {
      // Public endpoints that don't require auth
      const publicEndpoints = [
        'getActiveAdPlans',
        'getAdPlanById'
      ];
      
      // Only add auth header if it's not a public endpoint
      if (!publicEndpoints.includes(endpoint)) {
        const token = await tokenStorage.getAccessToken();
        if (token) {
          headers.set("Authorization", `Bearer ${token}`);
        }
      }
      
      return headers;
    },
  }),
  tagTypes: ["AdPlans", "UserAdPlan"],
  endpoints: (builder) => ({
    // Get all active ad plans (public endpoint)
    getActiveAdPlans: builder.query({
      query: () => ({
        url: "/ad-plans/active",
      }),
      providesTags: ["AdPlans"],
      transformResponse: (response) => {
        if (response.success && response.data) {
          return {
            success: true,
            message: response.message,
            data: response.data
          };
        }
        
        return response;
      },
    }),

    // Get ad plan by ID
    getAdPlanById: builder.query({
      query: (id) => ({ url: `/ad-plans/${id}` }),
      providesTags: ["AdPlans"],
      transformResponse: (response) => {
        if (response.success && response.data) {
          return {
            success: true,
            message: response.message,
            data: response.data
          };
        }
        return response;
      },
    }),

    // Create Payment Intent for purchasing ad plan (requires auth) - native Payment Sheet on iOS & Android
    createPaymentIntent: builder.mutation({
      query: (adPlanId) => ({
        url: `/user-ad-plans/payment-intent/${adPlanId}`,
        method: "POST",
      }),
      transformResponse: (response) => {
        if (response.success && response.data) {
          return {
            success: true,
            message: response.message,
            data: response.data
          };
        }
        return response;
      },
    }),

    // Verify Payment Intent status after payment (requires auth)
    verifyPaymentIntent: builder.mutation({
      query: (paymentIntentId) => ({
        url: `/user-ad-plans/verify-payment/${paymentIntentId}`,
        method: 'GET',
      }),
      invalidatesTags: ["UserAdPlan"],
      transformResponse: (response) => {
        if (response.success && response.data) {
          return {
            success: true,
            message: response.message,
            data: response.data
          };
        }
        return response;
      },
    }),

    // Get current user's active ad plan (requires auth)
    getCurrentAdPlan: builder.query({
      query: () => ({ url: "/user-ad-plans/current" }),
      providesTags: ["UserAdPlan"],
      transformResponse: (response) => {
        if (response.success && response.data) {
          return {
            success: true,
            message: response.message,
            data: response.data
          };
        }
        return response;
      },
    }),

    // Get user's ad plan history (requires auth)
    getAdPlanHistory: builder.query({
      query: ({ page = 1, limit = 10 } = {}) => ({
        url: `/user-ad-plans/history?page=${page}&limit=${limit}`,
      }),
      providesTags: ["UserAdPlan"],
      transformResponse: (response) => {
        if (response.success && response.data) {
          return {
            success: true,
            message: response.message,
            data: response.data
          };
        }
        return response;
      },
    }),

  }),
});

export const {
  useGetActiveAdPlansQuery,
  useGetAdPlanByIdQuery,
  useCreatePaymentIntentMutation,
  useVerifyPaymentIntentMutation,
  useGetCurrentAdPlanQuery,
  useGetAdPlanHistoryQuery,
} = adPlanApi;
