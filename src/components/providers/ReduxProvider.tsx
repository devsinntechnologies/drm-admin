"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { Provider } from "react-redux";
import { restoreSession } from "@/lib/features/auth/authSlice";
import { store } from "@/lib/store";
import { getStoredAuthToken } from "@/lib/utils";

type ReduxProviderProps = {
  children: ReactNode;
};

// Suspended routes may hydrate after the restoration effect runs. Keep their
// hydration snapshot identical to SSR while the live store restores auth.
const serverState = store.getState();

export default function ReduxProvider({ children }: ReduxProviderProps) {
  useEffect(() => {
    const storedToken = getStoredAuthToken();
    if (storedToken && !store.getState().auth.token) {
      const businessId = localStorage.getItem("businessId");
      store.dispatch(restoreSession({
        token: storedToken,
        role: localStorage.getItem("roleName") || localStorage.getItem("auth_role") || null,
        user: businessId ? { businessId } : null,
      }));
    }
  }, []);

  return <Provider store={store} serverState={serverState}>{children}</Provider>;
}
