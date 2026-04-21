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
    getProfessionalReviews: builder.query({
      query: (professionalId) => `reviews/professional/${professionalId}`,
      providesTags: (result, error, professionalId) =>
        result
          ? [
              ...result.map(({ _id }) => ({ type: "Review", id: _id })),
              { type: "Review", id: "LIST" },
            ]
          : [{ type: "Review", id: "LIST" }],
    }),
    getProfessionalAverageRating: builder.query({
      query: (professionalId) => `reviews/average-pro/${professionalId}`,
      providesTags: (result, error, professionalId) => [{ type: "Review", id: `AVG-${professionalId}` }],
    }),
    createReview: builder.mutation({
      query: (data) => ({
        url: "reviews/create",
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { company_id, professional_id }) => [
        { type: "Review", id: "LIST" },
        company_id ? { type: "Review", id: `AVG-${company_id}` } : { type: "Review", id: `AVG-${professional_id}` },
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
      invalidatesTags: (result, error, { company_id, professional_id }) => [
        { type: "Review", id: "LIST" },
        company_id ? { type: "Review", id: `AVG-${company_id}` } : { type: "Review", id: `AVG-${professional_id}` },
      ],
    }),
  }),
});

export const {
  useGetCompanyReviewsQuery,
  useGetAverageRatingQuery,
  useGetProfessionalReviewsQuery,
  useGetProfessionalAverageRatingQuery,
  useCreateReviewMutation,
  useDeleteReviewMutation,
  useUpdateReviewMutation,
} = reviewApiSlice;
