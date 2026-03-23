import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action) => {
      const { user } = action.payload || {};
      state.user = user || null;
    },

    logout: (state) => {
      state.user = null;
    },
    
    clearUserData: () => initialState,
    
    // Handle token validation failures
    tokenValidationFailed: (state) => {
      state.user = null;
    },
  },
});

// Selectors
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => !!state.auth.user; // Check if user exists instead of token
export const selectIsPersistenceReady = (state) => {
  // Check if Redux Persist is ready, with fallback
  const persistReady = state._persist?.rehydrated;
  
  // If persistence is undefined or false, return false
  // If persistence is true, return true
  // Add a fallback: if persistence is undefined after a reasonable time, assume it's ready
  return persistReady === true;
};

export const { setUser, logout, clearUserData, tokenValidationFailed } = authSlice.actions;
export default authSlice.reducer;


