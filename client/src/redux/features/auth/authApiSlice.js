import { apiSlice } from '../../app/api/apiSlice';

export const authApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation({
      query: (credentials) => {
        // Vérifie le rôle pour adapter le body
        const { roles } = credentials;

        if (roles.includes("company")) {
          // Payload spécifique company
          return {
            url: 'auth/register',
            method: 'POST',
            body: {
              companyName: credentials.companyName,
              email: credentials.email,
              password: credentials.password,
              phone: credentials.phone,
              website: credentials.website,
              logoUrl: credentials.logoUrl || null,
              coverUrl: credentials.coverUrl || null,
              description: credentials.description || '',
              roles: ["company"],
            },
          };
        } else {
          // Payload user
          return {
            url: 'auth/register',
            method: 'POST',
            body: {
              fullName: credentials.fullName,
              email: credentials.email,
              password: credentials.password,
              phone: credentials.phone,
              avatarUrl: credentials.avatarUrl || null,
              roles: ["user"],
            },
          };
        }
      },
    }),
    login: builder.mutation({
      query: (credentials) => ({
        url: 'auth/login',
        method: 'POST',
        body: { ...credentials },
      }),
    }),
    sendLogout: builder.mutation({
      query: () => ({
        url: 'auth/logout',
        method: 'POST',
      }),
    }),
  }),
});

export const { useRegisterMutation, useLoginMutation, useSendLogoutMutation } = authApiSlice;