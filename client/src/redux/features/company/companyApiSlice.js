import { apiSlice } from "../../app/api/apiSlice";

export const companyApiSlice = apiSlice.injectEndpoints({
  endpoints: builder => ({

    getCompanyProfile: builder.query({
      query: () => "company/profile",
      providesTags: ["Company"]
    }),

    getCompanyFollowers: builder.query({
      query: () => "company/followers",
    }),

    getFollowersStats: builder.query({
      query: () => "followers/followers-stats"
    }),

    getFollowerCount: builder.query({
      query: (companyId) => `followers/count`
    }),

    
    updateCompanyProfile: builder.mutation({
      query: (formData) => ({
        url: "company/updateprofile",
        method: "PUT",
        body: formData,
        formData: true,
      }),
      invalidatesTags: ["Company"]
    })

  })
});

export const {
  useGetFollowersStatsQuery,
  useGetCompanyProfileQuery,
  useGetCompanyFollowersQuery,
  useGetFollowerCountQuery,
  useUpdateCompanyProfileMutation
} = companyApiSlice;