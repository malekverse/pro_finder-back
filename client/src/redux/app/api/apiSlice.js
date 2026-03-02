import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import Cookies from 'js-cookie';  // N'oubliez pas d'importer Cookies
console.log("BASE URL =", import.meta.env.VITE_BASE_URL);
const baseQuery = fetchBaseQuery({
 //baseUrl: import.meta.env.VITE_BASE_URL,
   baseUrl: import.meta.env.VITE_BASE_URL,
  credentials: 'include',
prepareHeaders: (headers, { getState }) => {
  const token = localStorage.getItem("accessToken");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return headers;
}
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  // console.log(args) // request url, method, body
  // console.log(api) // signal, dispatch, getState()
  // console.log(extraOptions) //custom like {shout: true}
  // initial request
  let result = await baseQuery(args, api, extraOptions);

  if (result?.error?.status === 403) {
    console.log('sending refresh token');
    // need to call refresh api to get new access token
    const refreshResult = await baseQuery('/auth/refresh', api, extraOptions);
    if (refreshResult?.data) {
      const { accessToken } = refreshResult.data;
    } else {
      if (refreshResult?.error?.status === 403) {
        refreshResult.error.data.message = 'Your login has expired.';
      }
      return refreshResult;
    }
  }
  return result;
};


export const apiSlice = createApi({
  baseQuery:baseQueryWithReauth ,
  endpoints: () => ({}),
});
