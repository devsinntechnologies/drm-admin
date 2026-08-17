"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { Provider } from "react-redux";
import { setToken } from "@/lib/features/auth/authSlice";
import { store } from "@/lib/store";
import { getStoredAuthToken } from "@/lib/utils";

type ReduxProviderProps = {
  children: ReactNode;
};

export default function ReduxProvider({ children }: ReduxProviderProps) {
  useEffect(() => {
    const storedToken = getStoredAuthToken();
    const currentToken = store.getState().auth.token;
    if (storedToken && storedToken !== currentToken) {
      store.dispatch(setToken(storedToken));
    }
  }, []);

  return <Provider store={store}>{children}</Provider>;
}
