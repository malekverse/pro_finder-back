import { apiSlice } from '../../api/apiSlice';

export const profileApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
getProfile: builder.query({
  query: () => 'profile', // <-- CORRECT
  providesTags: ['Profile'],
}),
updateProfile: builder.mutation({
      query: (formData) => ({
        url: '/profile',
        method: 'PUT',
        body: formData,
      }),
    }),
    changePassword: builder.mutation({
      query: (passwords) => ({
        url: '/profile/change-password',
        method: 'PUT',
        body: passwords,
      }),
    }),
    changeAdminPassword: builder.mutation({
      query: (passwords) => ({
        url: '/admin/change-password',
        method: 'PUT',
        body: passwords,
      }),
      invalidatesTags: ['Dashboard', 'Activities'],
    }),
    getAdminDashboard: builder.query({
      query: () => '/admin/dashboard',
      providesTags: ['Dashboard'],
    }),
    getAdminActivities: builder.query({
      query: () => '/admin/activities',
      providesTags: ['Activities'],
    }),
    getPendingCompanies: builder.query({
      query: () => '/admin/pending',
      providesTags: ['PendingCompanies'],
    }),
    verifyCompany: builder.mutation({
      query: (companyId) => ({
        url: `/admin/verify/${companyId}`,
        method: 'PUT',
      }),
      invalidatesTags: ['Dashboard', 'PendingCompanies'],
    }),
    rejectCompany: builder.mutation({
      query: ({ companyId, reason, type }) => ({
        url: `/admin/reject/${companyId}`,
        method: 'DELETE',
        body: { reason, type },
      }),
      invalidatesTags: ['Dashboard', 'PendingCompanies'],
    }),
    contactCompany: builder.mutation({
      query: ({ companyId, message, type }) => ({
        url: `/admin/contact/${companyId}`,
        method: 'POST',
        body: { message, type },
      }),
      invalidatesTags: ['Dashboard', 'PendingCompanies'],
    }),

    // ── Professional moderation ──
    getPendingProfessionals: builder.query({
      query: () => '/admin/pending-professionals',
      providesTags: ['PendingProfessionals'],
    }),
    verifyProfessional: builder.mutation({
      query: (professionalId) => ({
        url: `/admin/verify-professional/${professionalId}`,
        method: 'PUT',
      }),
      invalidatesTags: ['Dashboard', 'PendingProfessionals'],
    }),
    rejectProfessional: builder.mutation({
      query: ({ professionalId, reason, type }) => ({
        url: `/admin/reject-professional/${professionalId}`,
        method: 'DELETE',
        body: { reason, type },
      }),
      invalidatesTags: ['Dashboard', 'PendingProfessionals'],
    }),
    contactProfessional: builder.mutation({
      query: ({ professionalId, message, type }) => ({
        url: `/admin/contact-professional/${professionalId}`,
        method: 'POST',
        body: { message, type },
      }),
      invalidatesTags: ['Dashboard', 'PendingProfessionals'],
    }),
  }),
});

export const { 
  useGetProfileQuery, 
  useUpdateProfileMutation, 
  useChangePasswordMutation,
  useChangeAdminPasswordMutation,
  useGetAdminDashboardQuery,
  useGetAdminActivitiesQuery,
  useGetPendingCompaniesQuery,
  useVerifyCompanyMutation,
  useRejectCompanyMutation,
  useContactCompanyMutation,
  useGetPendingProfessionalsQuery,
  useVerifyProfessionalMutation,
  useRejectProfessionalMutation,
  useContactProfessionalMutation,
} = profileApiSlice;
