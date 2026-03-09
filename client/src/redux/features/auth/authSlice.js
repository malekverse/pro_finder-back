import { createSlice } from '@reduxjs/toolkit';
import Cookies from 'js-cookie';
const authSlice = createSlice({
  name: 'auth',
  initialState: { 
    user: null, 
token: Cookies.get('accessToken') || localStorage.getItem("accessToken") || null,  permissions: []   },
  reducers: {
   setCredentials: (state, action) => {
  const { accessToken, account } = action.payload;

  state.token = accessToken;
  state.user = account;
  state.permissions = account?.permissions || [];
},

    setPermissions: (state, action) => {
      state.permissions = action.payload;
    },
    logOut: (state) => {
      state.user = null;
      state.token = null;
      state.permissions = []
      localStorage.removeItem("accessToken");
      Cookies.remove('accessToken');
    },
  },
});

export const { setCredentials, setPermissions,logOut } = authSlice.actions;
export default authSlice.reducer;

// Selectors pour récupérer les infos facilement
export const selectCurrentUser = (state) => state.auth.user;
export const selectCurrentToken = (state) => state.auth.token;
export const selectPermissions = (state) => state.auth.permissions || [];