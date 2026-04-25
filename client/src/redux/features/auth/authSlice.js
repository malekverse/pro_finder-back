import { createSlice } from '@reduxjs/toolkit';
import Cookies from 'js-cookie';
const authSlice = createSlice({
  name: 'auth',
  initialState: { 
    user: JSON.parse(localStorage.getItem("user")) || null, 
    token: Cookies.get('accessToken') || localStorage.getItem("accessToken") || null,
    permissions: JSON.parse(localStorage.getItem("permissions")) || []
  },
  reducers: {
   setCredentials: (state, action) => {
  const { accessToken, account } = action.payload;

  state.token = accessToken;
  state.user = account;
  state.permissions = account?.permissions || [];
  
  // Persist credentials
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("user", JSON.stringify(account));
  if (account?.permissions) {
    localStorage.setItem("permissions", JSON.stringify(account.permissions));
  }
},

    setPermissions: (state, action) => {
      state.permissions = action.payload;
      localStorage.setItem("permissions", JSON.stringify(action.payload));
    },
    logOut: (state) => {
      state.user = null;
      state.token = null;
      state.permissions = []
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      localStorage.removeItem("permissions");
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