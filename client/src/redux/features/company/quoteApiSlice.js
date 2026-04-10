import { apiSlice } from "../../app/api/apiSlice";

export const quoteApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCompanyQuotes: builder.query({
      query: () => "/quotes/company",
      providesTags: ["Quote"],
    }),
    getUserQuotes: builder.query({
      query: () => "/quotes/user",
      providesTags: ["Quote"],
    }),
    createQuote: builder.mutation({
      query: (quoteData) => ({
        url: "/quotes/create",
        method: "POST",
        body: quoteData,
      }),
      invalidatesTags: ["Quote"],
    }),
    updateQuoteStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/quotes/${id}/status`,
        method: "PUT",
        body: { status },
      }),
      invalidatesTags: ["Quote"],
    }),
  }),
});

export const {
  useGetCompanyQuotesQuery,
  useGetUserQuotesQuery,
  useCreateQuoteMutation,
  useUpdateQuoteStatusMutation,
} = quoteApiSlice;
