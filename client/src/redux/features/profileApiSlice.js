import { apiSlice } from '../app/api/apiSlice';

export const profileApiSlice = apiSlice.injectEndpoints({
  endpoints: builder => ({
    getProfile: builder.query({
      query: () => '/profile'
    }),

    updateProfile: builder.mutation({
      query: (formData) => ({
        url: '/profile',
        method: 'PUT',
        body: formData
      })
    })
  })
});

export const {
  useGetProfileQuery,
  useUpdateProfileMutation
} = profileApiSlice;