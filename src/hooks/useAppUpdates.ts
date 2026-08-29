import { createApi } from "@reduxjs/toolkit/query/react";
import { authenticatedBaseQueryWithReauth } from "@/lib/authenticated-base-query";

export type AppReleasePlatform = "windows" | "macos" | "android";
export type AppReleasePolicy = "optional_snooze" | "forced" | "soft";
export type AppReleaseStatus = "draft" | "published" | "rolled_back";
export type AppReleaseTargetMode = "all" | "businesses";

export type AppReleaseAsset = {
  id: string;
  fileName: string;
  fileSize: number;
  sha256: string;
  mimeType: string | null;
};

export type AppReleaseRecord = {
  id: string;
  versionName: string;
  versionCode: number;
  platform: AppReleasePlatform;
  policy: AppReleasePolicy;
  maxSkips: number;
  title: string;
  notes: string;
  targetMode: AppReleaseTargetMode;
  status: AppReleaseStatus;
  publishedAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  businessIds: string[];
  asset: AppReleaseAsset | null;
};

export type CreateAppReleasePayload = {
  versionName: string;
  versionCode: number;
  platform: AppReleasePlatform;
  policy: AppReleasePolicy;
  maxSkips: number;
  title?: string;
  notes?: string;
  targetMode: AppReleaseTargetMode;
  businessIds?: string[];
};

export type AppUpdateAdoptionDevice = {
  id: string;
  businessId: string;
  businessName: string | null;
  deviceId: string;
  deviceName: string | null;
  platform: string | null;
  appVersion: string | null;
  versionCode: number | null;
  lastHeartbeatAt: string | null;
  isOnline: boolean;
  latestVersionName: string | null;
  latestVersionCode: number | null;
  isUpToDate: boolean;
};

export type AppUpdateAdoption = {
  latestByPlatform: Partial<
    Record<AppReleasePlatform, { versionName: string; versionCode: number; releaseId: string }>
  >;
  devices: AppUpdateAdoptionDevice[];
};

export type AppUpdateWorkspaceDevice = {
  id: string;
  deviceId: string;
  deviceName: string | null;
  appVersion: string | null;
  versionCode: number | null;
  isOnline: boolean;
  lastHeartbeatAt: string | null;
  isUpToDate: boolean;
};

export type AppUpdateWorkspacePlatform = {
  platform: AppReleasePlatform;
  active: {
    id: string;
    versionName: string;
    versionCode: number;
    policy: AppReleasePolicy;
    targetMode: AppReleaseTargetMode;
    title: string;
    linked: boolean;
  } | null;
  deviceCount: number;
  outdatedCount: number;
  devices: AppUpdateWorkspaceDevice[];
};

export type AppUpdateWorkspace = {
  businessId: string;
  businessName: string;
  alert: {
    policy: AppReleasePolicy;
    versionName: string;
    versionCode: number;
    platform: AppReleasePlatform;
    title: string;
    outdatedCount: number;
    deviceCount: number;
  } | null;
  platforms: AppUpdateWorkspacePlatform[];
  publishedReleases: AppReleaseRecord[];
};

function unwrapData<T>(response: unknown): T {
  if (response && typeof response === "object" && "data" in response) {
    return (response as { data: T }).data;
  }
  return response as T;
}

export const appUpdatesApi = createApi({
  reducerPath: "appUpdatesApi",
  baseQuery: authenticatedBaseQueryWithReauth,
  tagTypes: ["AppReleases", "AppUpdateAdoption", "AppUpdateWorkspace"],
  endpoints: (builder) => ({
    getAppReleases: builder.query<AppReleaseRecord[], void>({
      query: () => "/app-updates",
      transformResponse: (response: unknown) => unwrapData<AppReleaseRecord[]>(response),
      providesTags: [{ type: "AppReleases", id: "LIST" }],
    }),
    getAppUpdateAdoption: builder.query<AppUpdateAdoption, void>({
      query: () => "/app-updates/adoption",
      transformResponse: (response: unknown) => unwrapData<AppUpdateAdoption>(response),
      providesTags: [{ type: "AppUpdateAdoption", id: "LIST" }],
    }),
    getAppUpdateWorkspace: builder.query<AppUpdateWorkspace, string>({
      query: (businessId) => `/app-updates/workspace?businessId=${encodeURIComponent(businessId)}`,
      transformResponse: (response: unknown) => unwrapData<AppUpdateWorkspace>(response),
      providesTags: (_result, _error, businessId) => [
        { type: "AppUpdateWorkspace", id: businessId },
        { type: "AppUpdateWorkspace", id: "LIST" },
      ],
    }),
    createAppRelease: builder.mutation<AppReleaseRecord, CreateAppReleasePayload>({
      query: (body) => ({ url: "/app-updates", method: "POST", body }),
      transformResponse: (response: unknown) => unwrapData<AppReleaseRecord>(response),
      invalidatesTags: [{ type: "AppReleases", id: "LIST" }],
    }),
    updateAppRelease: builder.mutation<
      AppReleaseRecord,
      { id: string; body: Partial<CreateAppReleasePayload> }
    >({
      query: ({ id, body }) => ({ url: `/app-updates/${id}`, method: "PATCH", body }),
      transformResponse: (response: unknown) => unwrapData<AppReleaseRecord>(response),
      invalidatesTags: [{ type: "AppReleases", id: "LIST" }],
    }),
    uploadAppReleaseAsset: builder.mutation<AppReleaseRecord, { id: string; file: File }>({
      query: ({ id, file }) => {
        const formData = new FormData();
        formData.append("file", file);
        return { url: `/app-updates/${id}/asset`, method: "POST", body: formData };
      },
      transformResponse: (response: unknown) => unwrapData<AppReleaseRecord>(response),
      invalidatesTags: [{ type: "AppReleases", id: "LIST" }],
    }),
    publishAppRelease: builder.mutation<AppReleaseRecord, string>({
      query: (id) => ({ url: `/app-updates/${id}/publish`, method: "POST" }),
      transformResponse: (response: unknown) => unwrapData<AppReleaseRecord>(response),
      invalidatesTags: [
        { type: "AppReleases", id: "LIST" },
        { type: "AppUpdateAdoption", id: "LIST" },
        { type: "AppUpdateWorkspace", id: "LIST" },
      ],
    }),
    linkAppReleaseBusiness: builder.mutation<AppReleaseRecord, { id: string; businessId: string }>({
      query: ({ id, businessId }) => ({
        url: `/app-updates/${id}/link-business`,
        method: "POST",
        body: { businessId },
      }),
      transformResponse: (response: unknown) => unwrapData<AppReleaseRecord>(response),
      invalidatesTags: [
        { type: "AppReleases", id: "LIST" },
        { type: "AppUpdateAdoption", id: "LIST" },
        { type: "AppUpdateWorkspace", id: "LIST" },
      ],
    }),
    unlinkAppReleaseBusiness: builder.mutation<AppReleaseRecord, { id: string; businessId: string }>({
      query: ({ id, businessId }) => ({
        url: `/app-updates/${id}/unlink-business`,
        method: "POST",
        body: { businessId },
      }),
      transformResponse: (response: unknown) => unwrapData<AppReleaseRecord>(response),
      invalidatesTags: [
        { type: "AppReleases", id: "LIST" },
        { type: "AppUpdateAdoption", id: "LIST" },
        { type: "AppUpdateWorkspace", id: "LIST" },
      ],
    }),
    rollbackAppRelease: builder.mutation<AppReleaseRecord, string>({
      query: (id) => ({ url: `/app-updates/${id}/rollback`, method: "POST" }),
      transformResponse: (response: unknown) => unwrapData<AppReleaseRecord>(response),
      invalidatesTags: [
        { type: "AppReleases", id: "LIST" },
        { type: "AppUpdateAdoption", id: "LIST" },
        { type: "AppUpdateWorkspace", id: "LIST" },
      ],
    }),
    deleteAppRelease: builder.mutation<{ deleted: boolean; id: string }, string>({
      query: (id) => ({ url: `/app-updates/${id}`, method: "DELETE" }),
      transformResponse: (response: unknown) => unwrapData<{ deleted: boolean; id: string }>(response),
      invalidatesTags: [{ type: "AppReleases", id: "LIST" }],
    }),
  }),
});

export const {
  useGetAppReleasesQuery,
  useGetAppUpdateAdoptionQuery,
  useGetAppUpdateWorkspaceQuery,
  useCreateAppReleaseMutation,
  useUpdateAppReleaseMutation,
  useUploadAppReleaseAssetMutation,
  usePublishAppReleaseMutation,
  useLinkAppReleaseBusinessMutation,
  useUnlinkAppReleaseBusinessMutation,
  useRollbackAppReleaseMutation,
  useDeleteAppReleaseMutation,
} = appUpdatesApi;
