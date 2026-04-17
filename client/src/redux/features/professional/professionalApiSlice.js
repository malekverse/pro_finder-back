import { apiSlice } from "../../app/api/apiSlice";

export const professionalApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({

    getProfessionalProfile: builder.query({
      query: () => "professional/profile",
      providesTags: ["Professional"],
    }),

    getPublicProfessionalProfile: builder.query({
      query: (professionalId) => `professional/public/${professionalId}`,
      providesTags: (result, error, professionalId) => [{ type: "Professional", id: professionalId }],
    }),

    updateProfessionalProfile: builder.mutation({
      query: (formData) => ({
        url: "professional/updateprofile",
        method: "PUT",
        body: formData,
        formData: true,
      }),
      invalidatesTags: ["Professional"],
    }),

    searchProfessionals: builder.query({
      query: (params) => {
        const { q, country, region, city, category, subCategory, service } = params || {};
        const searchParams = new URLSearchParams();
        if (q) searchParams.append("q", q);
        if (country) searchParams.append("country", country);
        if (region) searchParams.append("region", region);
        if (city) searchParams.append("city", city);
        if (category) searchParams.append("category", category);
        if (subCategory) searchParams.append("subCategory", subCategory);
        if (service) searchParams.append("service", service);
        return `professional/search?${searchParams.toString()}`;
      },
      providesTags: ["Professional"],
    }),

    getSuggestedProfessionals: builder.query({
      query: () => "professional/suggested",
      providesTags: ["Professional"],
    }),

    getRecommendedProfessionals: builder.query({
      query: () => "professional/recommended",
      providesTags: ["Professional"],
    }),

    followProfessional: builder.mutation({
      query: (professionalId) => ({
        url: "followers/follow-pro",
        method: "POST",
        body: { professional_id: professionalId },
      }),
      invalidatesTags: (result, error, professionalId) => [{ type: "Professional", id: professionalId }, "Professional"],
    }),

    unfollowProfessional: builder.mutation({
      query: (professionalId) => ({
        url: "followers/unfollow-pro",
        method: "DELETE",
        body: { professional_id: professionalId },
      }),
      invalidatesTags: (result, error, professionalId) => [{ type: "Professional", id: professionalId }, "Professional"],
    }),

    checkFollowProStatus: builder.query({
      query: (professionalId) => `followers/check-pro/${professionalId}`,
      providesTags: (result, error, professionalId) => [{ type: "Professional", id: professionalId }],
    }),
  }),
});

export const {
  useGetProfessionalProfileQuery,
  useGetPublicProfessionalProfileQuery,
  useUpdateProfessionalProfileMutation,
  useSearchProfessionalsQuery,
  useGetSuggestedProfessionalsQuery,
  useGetRecommendedProfessionalsQuery,
  useFollowProfessionalMutation,
  useUnfollowProfessionalMutation,
  useCheckFollowProStatusQuery,
} = professionalApiSlice;
