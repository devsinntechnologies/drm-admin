import { createApi } from "@reduxjs/toolkit/query/react";
import { authenticatedBaseQueryWithReauth } from "@/lib/authenticated-base-query";
import type {
  CustomizedTemplateConfig,
  DashboardCardId,
  IndustryFamily,
  IndustryTemplate,
  ModuleId,
  ThemeMode,
} from "@/templates/types";

export type ApiTemplateConfig = {
  id: string;
  businessId?: string | null;
  businessName: string;
  industryId: string;
  industryName: string;
  family: IndustryFamily;
  currency: string;
  market?: string;
  location: string;
  branchCount: number;
  logoUrl?: string | null;
  primaryColor: string;
  secondaryColor: string;
  themeMode: ThemeMode;
  labels: IndustryTemplate["labels"];
  enabledModules: ModuleId[];
  navigation: CustomizedTemplateConfig["navigation"];
  dashboardCards: DashboardCardId[];
  // null = unrestricted (every industry-available module can be toggled by
  // the business admin) — set by a super_admin to grant a narrower subset.
  entitledModules?: ModuleId[] | null;
  // Free-form per-module display settings, e.g. { orders: { viewType: "grid" } }.
  moduleSettings?: Record<string, Record<string, unknown>>;
  createdAt: string;
  updatedAt?: string;
};

export type CreateTemplateConfigPayload = {
  businessName: string;
  industryId: string;
  primaryColor: string;
  secondaryColor: string;
  themeMode: ThemeMode;
  enabledModules: ModuleId[];
  navigation: CustomizedTemplateConfig["navigation"];
  dashboardCards: DashboardCardId[];
  labels: IndustryTemplate["labels"];
  currency?: string;
  market?: string;
  location?: string;
  branchCount?: number;
  logoUrl?: string;
  businessId?: string;
  moduleSettings?: Record<string, Record<string, unknown>>;
};

export type ApiModuleCatalog = Record<
  string,
  { id: string; label: string; description?: string; category?: string }
>;

export type ApiDashboardCardCatalog = Record<
  string,
  { id: string; label: string; description?: string }
>;

export type IndustryModulePlanResponse = {
  industryId: string;
  compulsory: string[];
  dependencies: Record<string, string[]>;
  summary: string;
};

function unwrapData<T>(response: unknown): T {
  if (response && typeof response === "object" && "data" in response) {
    return (response as { data: T }).data;
  }
  return response as T;
}

export function apiConfigToCustomized(item: ApiTemplateConfig): CustomizedTemplateConfig {
  return {
    id: item.id,
    createdAt: item.createdAt,
    businessName: item.businessName,
    industryId: item.industryId,
    industryName: item.industryName,
    family: item.family,
    currency: item.currency ?? "PKR",
    market: item.market,
    location: item.location ?? "",
    branchCount: item.branchCount ?? 1,
    primaryColor: item.primaryColor,
    secondaryColor: item.secondaryColor,
    themeMode: item.themeMode,
    enabledModules: item.enabledModules,
    navigation: item.navigation,
    dashboardCards: item.dashboardCards,
    labels: item.labels,
    logoDataUrl: item.logoUrl ?? undefined,
  };
}

export const industryTemplateApi = createApi({
  reducerPath: "industryTemplateApi",
  baseQuery: authenticatedBaseQueryWithReauth,
  tagTypes: ["TemplateConfig", "IndustryCatalog"],
  endpoints: (builder) => ({
    listIndustries: builder.query<IndustryTemplate[], void>({
      query: () => "/industry-template/industries",
      transformResponse: (response: unknown) => unwrapData<IndustryTemplate[]>(response) ?? [],
      providesTags: ["IndustryCatalog"],
    }),
    getIndustryById: builder.query<IndustryTemplate, string>({
      query: (id) => `/industry-template/industries/${id}`,
      transformResponse: (response: unknown) => unwrapData<IndustryTemplate>(response),
      providesTags: (_result, _error, id) => [{ type: "IndustryCatalog", id }],
    }),
    getIndustryModulePlan: builder.query<IndustryModulePlanResponse, string>({
      query: (id) => `/industry-template/industries/${id}/module-plan`,
      transformResponse: (response: unknown) => unwrapData<IndustryModulePlanResponse>(response),
      providesTags: (_result, _error, id) => [{ type: "IndustryCatalog", id: `plan-${id}` }],
    }),
    listModules: builder.query<ApiModuleCatalog, void>({
      query: () => "/industry-template/modules",
      transformResponse: (response: unknown) => unwrapData<ApiModuleCatalog>(response) ?? {},
      providesTags: ["IndustryCatalog"],
    }),
    listDashboardCards: builder.query<ApiDashboardCardCatalog, void>({
      query: () => "/industry-template/dashboard-cards",
      transformResponse: (response: unknown) => unwrapData<ApiDashboardCardCatalog>(response) ?? {},
      providesTags: ["IndustryCatalog"],
    }),
    listTemplateConfigs: builder.query<CustomizedTemplateConfig[], void>({
      query: () => "/industry-template",
      transformResponse: (response: unknown) => {
        const rows = unwrapData<ApiTemplateConfig[]>(response) ?? [];
        return rows.map(apiConfigToCustomized);
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "TemplateConfig" as const, id })),
              { type: "TemplateConfig", id: "LIST" },
            ]
          : [{ type: "TemplateConfig", id: "LIST" }],
    }),
    getTemplateConfigById: builder.query<CustomizedTemplateConfig, string>({
      query: (id) => `/industry-template/${id}`,
      transformResponse: (response: unknown) => apiConfigToCustomized(unwrapData<ApiTemplateConfig>(response)),
      providesTags: (_result, _error, id) => [{ type: "TemplateConfig", id }],
    }),
    getTemplateConfigByBusinessId: builder.query<CustomizedTemplateConfig | null, string>({
      query: (businessId) => `/industry-template/by-business/${businessId}`,
      transformResponse: (response: unknown) => {
        const row = unwrapData<ApiTemplateConfig | null>(response);
        return row ? apiConfigToCustomized(row) : null;
      },
      providesTags: (_result, _error, businessId) => [
        { type: "TemplateConfig", id: `business-${businessId}` },
      ],
    }),
    createTemplateConfig: builder.mutation<CustomizedTemplateConfig, CreateTemplateConfigPayload>({
      query: (body) => ({ url: "/industry-template", method: "POST", body }),
      transformResponse: (response: unknown) => apiConfigToCustomized(unwrapData<ApiTemplateConfig>(response)),
      invalidatesTags: (_result, _error, body) => [
        { type: "TemplateConfig", id: "LIST" },
        ...(body.businessId ? [{ type: "TemplateConfig" as const, id: `business-${body.businessId}` }] : []),
      ],
    }),
    updateTemplateConfig: builder.mutation<
      CustomizedTemplateConfig,
      { id: string; body: Partial<CreateTemplateConfigPayload> }
    >({
      query: ({ id, body }) => ({ url: `/industry-template/${id}`, method: "PATCH", body }),
      transformResponse: (response: unknown) => apiConfigToCustomized(unwrapData<ApiTemplateConfig>(response)),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "TemplateConfig", id },
        { type: "TemplateConfig", id: "LIST" },
      ],
    }),
    deleteTemplateConfig: builder.mutation<void, string>({
      query: (id) => ({ url: `/industry-template/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "TemplateConfig", id: "LIST" }],
    }),
    updateEntitlements: builder.mutation<
      CustomizedTemplateConfig,
      { id: string; entitledModules: ModuleId[] }
    >({
      query: ({ id, entitledModules }) => ({
        url: `/industry-template/${id}/entitlements`,
        method: "PATCH",
        body: { entitledModules },
      }),
      transformResponse: (response: unknown) => apiConfigToCustomized(unwrapData<ApiTemplateConfig>(response)),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "TemplateConfig", id },
        { type: "TemplateConfig", id: "LIST" },
      ],
    }),
    getMobileConfigPreview: builder.query<ApiTemplateConfig, string>({
      query: (businessId) =>
        `/industry-template/mobile-config?businessId=${encodeURIComponent(businessId)}`,
      transformResponse: (response: unknown) => unwrapData<ApiTemplateConfig>(response),
    }),
  }),
});

export const {
  useListIndustriesQuery,
  useGetIndustryByIdQuery,
  useGetIndustryModulePlanQuery,
  useListModulesQuery,
  useListDashboardCardsQuery,
  useListTemplateConfigsQuery,
  useGetTemplateConfigByIdQuery,
  useGetTemplateConfigByBusinessIdQuery,
  useCreateTemplateConfigMutation,
  useUpdateTemplateConfigMutation,
  useDeleteTemplateConfigMutation,
  useUpdateEntitlementsMutation,
  useGetMobileConfigPreviewQuery,
} = industryTemplateApi;
