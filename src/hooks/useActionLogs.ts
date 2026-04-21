import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { BASE_URL } from "@/lib/constant";

export type LogStatus = "success" | "failure";

export type ActionLogNormalized = {
  meta?: {
    level?: string;
  };
  user?: {
    id?: string | null;
    role?: string | null;
    username?: string | null;
    businessId?: string | null;
  };
  action?: {
    type?: string;
    module?: string;
    description?: string;
  };
  request?: {
    method?: string;
    endpoint?: string;
    ipAddress?: string;
    userAgent?: string;
    headers?: Record<string, unknown>;
    payload?: unknown;
  };
  response?: {
    payload?: unknown;
    success?: boolean;
    statusCode?: number;
    errorMessage?: string | null;
  };
  performance?: {
    durationMs?: number | null;
  };
  requestId?: string;
};

export type ActionLogRecord = {
  id: string;
  timestamp: string;
  userId: string | null;
  username: string | null;
  userRole: string | null;
  businessId: string | null;
  actionType: string;
  module: string;
  method: string;
  endpoint: string;
  statusCode: number;
  responseStatus: LogStatus;
  durationMs: number | null;
  ipAddress: string | null;
  requestPayload: unknown;
  responsePayload?: unknown;
  requestHeaders?: Record<string, unknown> | null;
  errorMessage: string | null;
  level: string;
  requestId: string;
  responseSuccess?: boolean;
  section: string | null;
  actionDescription: string | null;
  requestUserAgent: string | null;
  normalized: ActionLogNormalized | null;
};

export type ActionLogsResponse = {
  data: ActionLogRecord[];
  total: number;
  page: number;
  last_page: number;
};

export type ActionLogsQueryParams = {
  userId?: string;
  username?: string;
  actionType?: string;
  module?: string;
  status?: LogStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  includeNormalized?: boolean;
  businessId?: string;
};

export const actionLogsApi = createApi({
  reducerPath: "actionLogsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: (headers) => {
      headers.set("accept", "application/json");

      if (typeof window !== "undefined") {
        const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
        if (token) {
          headers.set("Authorization", `Bearer ${token}`);
        }

        // Automatically append businessId from URL if present
        const urlParams = new URLSearchParams(window.location.search);
        const urlBusinessId = urlParams.get("businessId");
        if (urlBusinessId) {
          headers.set("x-business-id", urlBusinessId); // Standard and safe way
        }
      }

      return headers;
    },
  }),
  endpoints: (builder) => ({
    getActionLogs: builder.query<ActionLogsResponse, ActionLogsQueryParams>({
      query: (params) => {
        const queryParams = new URLSearchParams();

        if (params.userId) queryParams.append("userId", params.userId);
        if (params.username) queryParams.append("username", params.username);
        if (params.actionType) queryParams.append("actionType", params.actionType);
        if (params.module) queryParams.append("module", params.module);
        if (params.status) queryParams.append("status", params.status);
        if (params.startDate) queryParams.append("startDate", params.startDate);
        if (params.endDate) queryParams.append("endDate", params.endDate);
        if (params.page) queryParams.append("page", String(params.page));
        if (params.limit) queryParams.append("limit", String(params.limit));
        if (typeof params.includeNormalized === "boolean") {
          queryParams.append("includeNormalized", String(params.includeNormalized));
        }
        if (params.businessId) {
          queryParams.append("businessId", params.businessId);
        }

        return `/log-system?${queryParams.toString()}`;
      },
    }),
  }),
});

export const { useGetActionLogsQuery } = actionLogsApi;