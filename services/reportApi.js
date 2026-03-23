import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { tokenStorage } from "../utils/tokenStorage";
import { BASE_URL } from "../utils/apiConfig";

export const reportApi = createApi({
  reducerPath: "reportApi",
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL + "/reports",
    timeout: 15000,
    prepareHeaders: async (headers) => {
      const token = await tokenStorage.getAccessToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  endpoints: (builder) => ({
    submitReport: builder.mutation({
      query: ({ reportedUserId, ...body }) => ({
        url: `/${reportedUserId}`,
        method: "POST",
        body,
      }),
      transformResponse: (response) => {
        if (response.status === 1 || response.message) {
          return { success: true, message: response.message, data: response.data };
        }
        return response;
      },
    }),
  }),
});

export const { useSubmitReportMutation } = reportApi;
