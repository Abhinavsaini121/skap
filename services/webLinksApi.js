import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { tokenStorage } from '../utils/tokenStorage';
import { BASE_URL } from '../utils/apiConfig';

export const webLinksApi = createApi({
  reducerPath: 'webLinksApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: BASE_URL,
    prepareHeaders: async (headers) => {
      // Get the access token
      const token = await tokenStorage.getAccessToken();
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      headers.set('Content-Type', 'application/json');
      headers.set('accept', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['WebLink'],
  endpoints: (builder) => ({
    // Get active web links
    getActiveWebLinks: builder.query({
      query: () => ({
        url: 'web-links/active',
        method: 'GET',
      }),
      providesTags: ['WebLink'],
      transformResponse: (response) => {
        // Handle the API response format
        if (response.success && response.data) {
          return {
            success: true,
            message: response.message,
            data: response.data || [],
          };
        }
        return response;
      },
    }),
  }),
});

export const { 
  useGetActiveWebLinksQuery,
} = webLinksApi;

