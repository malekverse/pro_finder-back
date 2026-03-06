import { createSlice } from '@reduxjs/toolkit';
import Cookies from 'js-cookie';
const authSlice = createSlice({
  name: 'auth',
  initialState: { 
    user: null, 
token: Cookies.get('accessToken') || localStorage.getItem("accessToken") || null  },
  reducers: {
    setCredentials: (state, action) => {
      // On récupère accessToken et account depuis ce que le backend envoie
      const { accessToken, account } = action.payload;
      state.token = accessToken;
      state.user = account;
    },
    logOut: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem("accessToken");
      Cookies.remove('accessToken');
    },
  },
});

export const { setCredentials, logOut } = authSlice.actions;
export default authSlice.reducer;

// Selectors pour récupérer les infos facilement
export const selectCurrentUser = (state) => state.auth.user;
export const selectCurrentToken = (state) => state.auth.token;