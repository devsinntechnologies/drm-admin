import { createApi } from "@reduxjs/toolkit/query/react";
import { authenticatedBaseQueryWithReauth } from "@/lib/authenticated-base-query";

export type MobileDeviceSyncRecord = {
  id: string;
  businessId: string;
  deviceId: string;
  deviceName: string | null;
  platform: string | null;
  appVersion: string | null;
  userRole: string | null;
  isOnline: boolean;
  isEffectivelyOnline: boolean;
  offlineSyncEnabled: boolean;
  pendingQueueCount: number;
  failedQueueCount: number;
  syncState: string;
  lastHeartbeatAt: string | null;
  lastSuccessfulSyncAt: string | null;
  lastError: string | null;
  updatedAt: string;
};

export type BusinessLiveStatus = {
  businessId: string;
  isLive: boolean;
};

function unwrapData<T>(response: unknown): T {
  if (response && typeof response === "object" && "data" in response) {
    return (response as { data: T }).data;
  }
  return response as T;
}

export const mobileSyncApi = createApi({
  reducerPath: "mobileSyncApi",
  baseQuery: authenticatedBaseQueryWithReauth,
  tagTypes: ["MobileSyncDevices", "MobileSyncLiveStatus"],
  endpoints: (builder) => ({
    getMobileSyncDevices: builder.query<MobileDeviceSyncRecord[], string>({
      query: (businessId) => `/mobile-sync/devices?businessId=${encodeURIComponent(businessId)}`,
      transformResponse: (response: unknown) => unwrapData<MobileDeviceSyncRecord[]>(response),
      providesTags: (_result, _error, businessId) => [{ type: "MobileSyncDevices", id: businessId }],
    }),
    // The "Live" half of the Live/Synced status pair -- whether any
    // realtime client (order socket) is connected for this business right
    // now. Deliberately separate from getMobileSyncDevices, which reports
    // per-device heartbeat/"Synced" status -- the two signals answer
    // different questions and shouldn't be forced into one response shape.
    getMobileSyncLiveStatus: builder.query<BusinessLiveStatus, string>({
      query: (businessId) => `/mobile-sync/live-status?businessId=${encodeURIComponent(businessId)}`,
      transformResponse: (response: unknown) => unwrapData<BusinessLiveStatus>(response),
      providesTags: (_result, _error, businessId) => [{ type: "MobileSyncLiveStatus", id: businessId }],
    }),
  }),
});

export const { useGetMobileSyncDevicesQuery, useGetMobileSyncLiveStatusQuery } = mobileSyncApi;
