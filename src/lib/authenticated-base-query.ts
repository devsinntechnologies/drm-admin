import {
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { BASE_URL } from "@/lib/constant";
import {
  businessInactiveMessage,
  isPortalSessionEndedPayload,
} from "@/lib/business-session";
import { DIGINIZAM_CLIENT, DIGINIZAM_CLIENT_HEADER } from "@/lib/diginizam-client";
import { logout } from "@/lib/features/auth/authSlice";
import { getStoredAuthToken } from "@/lib/utils";
import type { RootState } from "@/lib/store";
import { toast } from "sonner";

function resolveAuthToken(state: RootState): string | null {
  return state.auth?.token || getStoredAuthToken();
}

export const authenticatedBaseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = resolveAuthToken(getState() as RootState);
    if (token) {
      headers.set("Authorization", `Bearer ${token.trim()}`);
    }
    headers.set("accept", "*/*");
    headers.set(DIGINIZAM_CLIENT_HEADER, DIGINIZAM_CLIENT);
    return headers;
  },
});

export function redirectToLogin() {
  if (typeof window === "undefined") return;
  const returnTo = `${window.location.pathname}${window.location.search}`;
  const loginUrl = `/login?returnTo=${encodeURIComponent(returnTo)}`;
  if (!window.location.pathname.startsWith("/login")) {
    window.location.href = loginUrl;
  }
}

export const authenticatedBaseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await authenticatedBaseQuery(args, api, extraOptions);

  if (result.error?.status === 403 && isPortalSessionEndedPayload(result.error.status, result.error.data)) {
    api.dispatch(logout());
    toast.error(businessInactiveMessage(result.error));
    redirectToLogin();
    return result;
  }

  if (result.error?.status === 401) {
    api.dispatch(logout());
    redirectToLogin();
  }

  return result;
};

export function hasAuthToken(state?: RootState): boolean {
  if (state) return Boolean(resolveAuthToken(state));
  return Boolean(getStoredAuthToken());
}
