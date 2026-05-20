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
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  const state = api.getState();
  const companyId = state.auth?.user?.companyId;
  const professionalId = state.auth?.user?.professionalId;

  // Injection automatique des IDs de contexte pour les membres d'équipe
  if (companyId || professionalId) {
    if (typeof args === 'string') {
      const separator = args.includes('?') ? '&' : '?';
      if (companyId && !args.includes('_c=')) args += `${separator}_c=${companyId}`;
      else if (professionalId && !args.includes('_p=')) args += `${separator}_p=${professionalId}`;
    } else if (args && typeof args === 'object') {
      if (!args.params) args.params = {};
      if (companyId && !args.params._c) args.params._c = companyId;
      else if (professionalId && !args.params._p) args.params._p = professionalId;
    }
  }

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
      // Session expirée - Ne pas supprimer les tokens si on est sur une page liée au paiement
      const currentPath = window.location.pathname;
      const isPaymentFlow = currentPath.includes('/payment/') || currentPath.includes('/success') || currentPath.includes('/fail');

      if (!isPaymentFlow) {
        localStorage.removeItem('accessToken');
        Cookies.remove('accessToken');
      }
    }
  }

  return result;
};

export const apiSlice = createApi({
  baseQuery: baseQueryWithReauth,
  endpoints: () => ({}),
  tagTypes: ['User', 'Profile', 'Products', 'Company', 'Post', 'Notifications', 'Professional', 'PendingProfessionals', 'Order', 'Reservation', 'Quote', 'Payment'],
});
