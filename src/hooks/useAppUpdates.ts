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

function unwrapData<T>(response: unknown): T {
  if (response && typeof response === "object" && "data" in response) {
    return (response as { data: T }).data;
  }
  return response as T;
}

export const appUpdatesApi = createApi({
  reducerPath: "appUpdatesApi",
  baseQuery: authenticatedBaseQueryWithReauth,
  tagTypes: ["AppReleases", "AppUpdateAdoption"],
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
      ],
    }),
    rollbackAppRelease: builder.mutation<AppReleaseRecord, string>({
      query: (id) => ({ url: `/app-updates/${id}/rollback`, method: "POST" }),
      transformResponse: (response: unknown) => unwrapData<AppReleaseRecord>(response),
      invalidatesTags: [
        { type: "AppReleases", id: "LIST" },
        { type: "AppUpdateAdoption", id: "LIST" },
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
  useCreateAppReleaseMutation,
  useUpdateAppReleaseMutation,
  useUploadAppReleaseAssetMutation,
  usePublishAppReleaseMutation,
  useRollbackAppReleaseMutation,
  useDeleteAppReleaseMutation,
} = appUpdatesApi;
