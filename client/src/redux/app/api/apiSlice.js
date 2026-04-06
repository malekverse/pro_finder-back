import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import Cookies from 'js-cookie';

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_BASE_URL,
  credentials: 'include', // pour cookies si nécessaire
prepareHeaders: (headers, { getState }) => {
  const token = getState().auth?.token || localStorage.getItem("accessToken");

  if (token) {
    headers.set("authorization", `Bearer ${token}`);
  }

  return headers;
}
}
);

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result?.error?.status === 401 || result?.error?.status === 403) {
    // Essayer de rafraîchir le token
    const refreshResult = await baseQuery('/auth/refresh', api, extraOptions);
    if (refreshResult?.data?.accessToken) {
      const { accessToken } = refreshResult.data;
      localStorage.setItem('accessToken', accessToken);
      Cookies.set('accessToken', accessToken, { expires: 7 });
      result = await baseQuery(args, api, extraOptions);
    } else {
      // Session expirée
      localStorage.removeItem('accessToken');
      Cookies.remove('accessToken');
      // Optionnel: rediriger vers login
      // window.location.href = '/auth/login';
    }
  }

  return result;
};

export const apiSlice = createApi({
  baseQuery: baseQueryWithReauth,
  endpoints: () => ({}),
tagTypes: ['User', 'Profile', 'Products', 'Company', 'Post', 'Notifications'],});
