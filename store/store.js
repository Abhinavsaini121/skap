import AsyncStorage from "@react-native-async-storage/async-storage";
import { configureStore } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";
import { authApi } from "../services/authApi";
import { reelsApi } from "../services/reelsApi";
import { advertisementApi } from "../services/advertisementApi";
import { commentsApi } from "../services/commentsApi";
import { advertisementCommentsApi } from "../services/advertisementCommentsApi";
import { userApi } from "../services/userApi";
import { adPlanApi } from "../services/adPlanApi";
import { webLinksApi } from "../services/webLinksApi";
import { reportApi } from "../services/reportApi";

import authReducer from "./authSlice";

const persistConfig = {
  key: "root",
  storage: AsyncStorage,
  whitelist: ["auth"], // Only persist auth state
  timeout: 10000, // 10 second timeout
  debug: __DEV__, // Enable debug in development
};

const persistedAuthReducer = persistReducer(persistConfig, authReducer);

export const store = configureStore({
  reducer: {
    [authApi.reducerPath]: authApi.reducer,
    [reelsApi.reducerPath]: reelsApi.reducer,
    [advertisementApi.reducerPath]: advertisementApi.reducer,
    [commentsApi.reducerPath]: commentsApi.reducer,
    [advertisementCommentsApi.reducerPath]: advertisementCommentsApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [adPlanApi.reducerPath]: adPlanApi.reducer,
    [webLinksApi.reducerPath]: webLinksApi.reducer,
    [reportApi.reducerPath]: reportApi.reducer,

    auth: persistedAuthReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE", "persist/PAUSE", "persist/PURGE"],
      },
    }).concat(authApi.middleware, reelsApi.middleware, advertisementApi.middleware, commentsApi.middleware, advertisementCommentsApi.middleware, userApi.middleware, adPlanApi.middleware, webLinksApi.middleware, reportApi.middleware),
});

export const persistor = persistStore(store);


