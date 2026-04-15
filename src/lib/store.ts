import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/lib/features/auth/authSlice";
import { planApi } from "@/hooks/usePlan";
import { businessApi } from "@/hooks/useBusiness";
import { actionLogsApi } from "@/hooks/useActionLogs";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [planApi.reducerPath]: planApi.reducer,
    [businessApi.reducerPath]: businessApi.reducer,
    [actionLogsApi.reducerPath]: actionLogsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(planApi.middleware, businessApi.middleware, actionLogsApi.middleware),
});

export type AppStore = typeof store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
