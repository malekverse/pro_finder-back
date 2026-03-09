// Dans usersApiSlice.js
import { apiSlice } from '../../app/api/apiSlice';
export const usersApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getUsers: builder.query({
            query: () => '/company/users',
            providesTags: (result) =>
        result
          ? [
              ...result.map((user) => ({ type: 'User', id: user.email })), // chaque user a son tag
              { type: 'User', id: 'LIST' }, // tag général pour la liste
            ]
          : [{ type: 'User', id: 'LIST' }],
        }),
       addUserToCompany: builder.mutation({
            query: (userData) => ({
                // On ajoute bien "/company" devant car c'est le préfixe du server.js
                url: '/company/assign-role', 
                method: 'PUT', 
                body: userData, 
            }),
            invalidatesTags:[{ type: 'User', id: 'LIST' }],
        }),
    }),
});

export const { useGetUsersQuery, useAddUserToCompanyMutation } = usersApiSlice;