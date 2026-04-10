import { apiSlice } from "../app/api/apiSlice";

export const reviewApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCompanyReviews: builder.query({
      query: (companyId) => `reviews/company/${companyId}`,
      providesTags: (result, error, companyId) =>
        result
          ? [
              ...result.map(({ _id }) => ({ type: "Review", id: _id })),
              { type: "Review", id: "LIST" },
            ]
          : [{ type: "Review", id: "LIST" }],
    }),
    getAverageRating: builder.query({
      query: (companyId) => `reviews/average/${companyId}`,
      providesTags: (result, error, companyId) => [{ type: "Review", id: `AVG-${companyId}` }],
    }),
    createReview: builder.mutation({
      query: (data) => ({
        url: "reviews/create",
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { company_id }) => [
        { type: "Review", id: "LIST" },
        { type: "Review", id: `AVG-${company_id}` },
      ],
    }),
    deleteReview: builder.mutation({
      query: (id) => ({
        url: `reviews/delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Review", id: "LIST" }],
    }),
    updateReview: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `reviews/update/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { company_id }) => [
        { type: "Review", id: "LIST" },
        { type: "Review", id: `AVG-${company_id}` },
      ],
    }),
  }),
});

export const {
  useGetCompanyReviewsQuery,
  useGetAverageRatingQuery,
  useCreateReviewMutation,
  useDeleteReviewMutation,
  useUpdateReviewMutation,
} = reviewApiSlice;
