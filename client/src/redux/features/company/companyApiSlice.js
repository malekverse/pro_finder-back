import { apiSlice } from "../../app/api/apiSlice";

export const companyApiSlice = apiSlice.injectEndpoints({
  endpoints: builder => ({

    getCompanyProfile: builder.query({
      query: (companyId) => {
        console.log("Fetching profile for companyId:", companyId);
        return {
          url: "company/profile",
          params: { _c: companyId }
        };
      },
      providesTags: ["Company"]
    }),

    followCompany: builder.mutation({
      query: ({ companyId, isFollowed }) => ({
        url: isFollowed ? "followers/unfollow" : "followers/follow",
        method: isFollowed ? "DELETE" : "POST",
        body: { company_id: companyId },
      }),
      invalidatesTags: (result, error, { companyId }) => [
        "Company",
        "Post",
        { type: "Follow", id: companyId },
      ],
    }),

    /** Profil entreprise par ID — pour les utilisateurs (dashboard / fil) */
    getPublicCompanyProfile: builder.query({
      query: (companyId) => `company/public/${companyId}`,
      providesTags: (result, error, companyId) => [{ type: "Company", id: companyId }],
    }),

    getCompanyFollowers: builder.query({
      query: () => "company/followers",
      providesTags: ["Followers"],
    }),

    getBlockedUsers: builder.query({
      query: () => "company/blocked",
      providesTags: ["Followers"],
    }),

    toggleBlockFollower: builder.mutation({
      query: (followId) => ({
        url: `company/followers/${followId}/block`,
        method: "PUT",
      }),
      invalidatesTags: ["Followers"],
    }),

    getFollowersStats: builder.query({
      query: (period = "annual") => `followers/followers-stats?period=${period}`
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
    }),

    searchCompanies: builder.query({
      query: (params) => {
        const { q, country, region, city, category, subCategory, service } = params || {};
        const searchParams = new URLSearchParams();
        if (q) searchParams.append('q', q);
        if (country) searchParams.append('country', country);
        if (region) searchParams.append('region', region);
        if (city) searchParams.append('city', city);
        if (category) searchParams.append('category', category);
        if (subCategory) searchParams.append('subCategory', subCategory);
        if (service) searchParams.append('service', service);
        return `company/search?${searchParams.toString()}`;
      },
      providesTags: ["Company"],
    }),

    getSuggestedCompanies: builder.query({
      query: () => "company/suggested",
      providesTags: ["Company"],
    }),

    // ✅ Vérifier si l'utilisateur suit déjà une company
    checkFollowStatus: builder.query({
      query: (companyId) => `followers/check/${companyId}`,
      providesTags: (result, error, companyId) => [{ type: "Follow", id: companyId }],
    }),

    // ✅ Nouveaux endpoints pour les filtres
    getCities: builder.query({
      query: () => "localisation/city/getCities",
    }),

    getRegions: builder.query({
      query: (countryId) => `localisation/getRegionsByCountry/${countryId}`,
    }),

    getCitiesByRegion: builder.query({
      query: (regionId) => `localisation/getCitiesByRegion/${regionId}`,
    }),

    getCountries: builder.query({
      query: () => "localisation/getCountries",
    }),

    getCategories: builder.query({
      query: () => "categories/categories",
    }),

    getSubCategories: builder.query({
      query: (categoryId) => `categories/subCategories/${categoryId}`,
    }),

    getServicesBySub: builder.query({
      query: (subCategoryId) => `categories/services/${subCategoryId}`,
    }),

    getServices: builder.query({
      query: () => "categories/services",
    }),

    getRecommendedCompanies: builder.query({
      query: () => "company/recommended",
      providesTags: ["Company"],
    }),

  })
});

export const {
  useFollowCompanyMutation,
  useGetFollowersStatsQuery,
  useGetCompanyProfileQuery,
  useGetPublicCompanyProfileQuery,
  useGetCompanyFollowersQuery,
  useGetBlockedUsersQuery,
  useToggleBlockFollowerMutation,
  useGetFollowerCountQuery,
  useUpdateCompanyProfileMutation,
  useSearchCompaniesQuery,
  useGetSuggestedCompaniesQuery,
  useCheckFollowStatusQuery,
  useGetCitiesQuery,
  useGetCountriesQuery,
  useGetRegionsQuery,
  useGetCitiesByRegionQuery,
  useGetCategoriesQuery,
  useGetSubCategoriesQuery,
  useGetServicesBySubQuery,
  useGetServicesQuery,
  useGetRecommendedCompaniesQuery,
} = companyApiSlice;