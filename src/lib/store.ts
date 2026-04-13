import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/lib/features/auth/authSlice";
import { planApi } from "@/hooks/usePlan";
import { businessApi } from "@/hooks/useBusiness";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [planApi.reducerPath]: planApi.reducer,
    [businessApi.reducerPath]: businessApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(planApi.middleware, businessApi.middleware),
});

export type AppStore = typeof store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
