import { createApi } from "@reduxjs/toolkit/query/react";
import { authenticatedBaseQueryWithReauth } from "@/lib/authenticated-base-query";
import type { ApiTemplateConfig } from "@/hooks/useIndustryTemplate";
import type { CredentialsResult, ResetCredentialsPayload } from "@/lib/credentials-result";
import { asCredentialsResult } from "@/lib/credentials-result";

export type BusinessStatus = "active" | "inactive" | "expired";

export type BusinessRecord = {
  id: string;
  businessName: string;
  address: string;
  phone: string;
  status: BusinessStatus;
  email: string;
  logo?: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  ownerRole: string;
  planId: string;
  planName: string;
  templateConfig?: ApiTemplateConfig | null;
  websiteEnabled?: boolean;
  portalEnabled?: boolean;
  softwareEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type GetBusinessesResponse = {
  data: BusinessRecord[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type GetBusinessesQueryParams = {
  search?: string;
  status?: BusinessStatus;
  page?: number;
};

export type CreateBusinessPayload = {
  businessName: string;
  address: string;
  phone: string;
  email: string;
  manager: string;
  planId: string;
};

export type CreateBusinessResponse = {
  id: string;
  businessName: string;
  address: string;
  phone: string;
  status: BusinessStatus;
  email: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  ownerRole: string;
  planId: string;
  planName: string;
  createdAt: string;
  updatedAt: string;
  temporaryPassword?: string;
  loginEmail?: string;
  credentialsEmailSent?: boolean;
  credentialsEmailError?: string;
};

export type PatchBusinessPayload = {
  id: string;
  body: Partial<CreateBusinessPayload> & {
    logo?: string;
    websiteEnabled?: boolean;
    portalEnabled?: boolean;
    softwareEnabled?: boolean;
  };
};

function defaultPagination(total: number, page = 1, limit = 10): GetBusinessesResponse["pagination"] {
  return {
    total,
    page,
    limit: limit || 10,
    totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
  };
}

/** Normalize backend envelopes: { success, data, pagination } or legacy shapes. */
export function normalizeBusinessesResponse(response: unknown): GetBusinessesResponse {
  if (Array.isArray(response)) {
    return {
      data: response as BusinessRecord[],
      pagination: defaultPagination(response.length, 1, response.length || 10),
    };
  }

  if (!response || typeof response !== "object") {
    return { data: [], pagination: defaultPagination(0) };
  }

  const root = response as Record<string, unknown>;

  if (Array.isArray(root.data)) {
    const rows = root.data as BusinessRecord[];
    const pagination =
      root.pagination && typeof root.pagination === "object"
        ? (root.pagination as GetBusinessesResponse["pagination"])
        : defaultPagination(rows.length);
    return { data: rows, pagination };
  }

  if (root.data && typeof root.data === "object") {
    const nested = root.data as Record<string, unknown>;
    if (Array.isArray(nested.data)) {
      const rows = nested.data as BusinessRecord[];
      const pagination =
        (nested.pagination as GetBusinessesResponse["pagination"]) ??
        (root.pagination as GetBusinessesResponse["pagination"]) ??
        defaultPagination(rows.length);
      return { data: rows, pagination };
    }
    if (Array.isArray(nested.businesses)) {
      const rows = nested.businesses as BusinessRecord[];
      return {
        data: rows,
        pagination:
          (nested.pagination as GetBusinessesResponse["pagination"]) ??
          defaultPagination(rows.length),
      };
    }
  }

  if (Array.isArray(root.businesses)) {
    const rows = root.businesses as BusinessRecord[];
    return { data: rows, pagination: defaultPagination(rows.length) };
  }

  return { data: [], pagination: defaultPagination(0) };
}

function normalizeBusinessRecord(response: unknown): BusinessRecord {
  if (!response || typeof response !== "object") {
    throw new Error("Invalid business response");
  }

  const root = response as Record<string, unknown>;
  if (root.data && typeof root.data === "object") {
    return root.data as BusinessRecord;
  }

  return response as BusinessRecord;
}

export const businessApi = createApi({
  reducerPath: "businessApi",
  baseQuery: authenticatedBaseQueryWithReauth,
  tagTypes: ["Business"],
  endpoints: (builder) => ({
    getBusinesses: builder.query<GetBusinessesResponse, GetBusinessesQueryParams | void>({
      query: (params) => {
        const queryParams = new URLSearchParams();

        if (params?.search) {
          queryParams.append("search", params.search);
        }

        if (params?.status) {
          queryParams.append("status", params.status);
        }

        if (params?.page) {
          queryParams.append("page", String(params.page));
        }

        queryParams.append("limit", "100");

        const queryString = queryParams.toString();
        return queryString ? `/business?${queryString}` : "/business?limit=100";
      },
      transformResponse: (response: unknown) => normalizeBusinessesResponse(response),
      providesTags: [{ type: "Business", id: "LIST" }],
    }),
    createBusiness: builder.mutation<CreateBusinessResponse, CreateBusinessPayload>({
      query: (body) => ({
        url: "/business",
        method: "POST",
        body,
      }),
      transformResponse: (response: unknown) =>
        normalizeBusinessRecord(response) as CreateBusinessResponse,
      invalidatesTags: [{ type: "Business", id: "LIST" }],
    }),
    checkBusinessEmail: builder.query<
      { email: string; available: boolean },
      string
    >({
      query: (email) => ({
        url: "/business/check-email",
        params: { email },
      }),
      transformResponse: (response: unknown) => {
        if (response && typeof response === "object" && "data" in response) {
          return (response as { data: { email: string; available: boolean } }).data;
        }
        return response as { email: string; available: boolean };
      },
    }),
    getBusinessById: builder.query<BusinessRecord, string>({
      query: (id) => `/business/${id}`,
      transformResponse: (response: unknown) => normalizeBusinessRecord(response),
      providesTags: (_result, _error, id) => [{ type: "Business", id }],
    }),
    patchBusinessById: builder.mutation<BusinessRecord, PatchBusinessPayload>({
      query: ({ id, body }) => ({
        url: `/business/${id}`,
        method: "PATCH",
        body,
      }),
      transformResponse: (response: unknown) => normalizeBusinessRecord(response),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Business", id },
        { type: "Business", id: "LIST" },
      ],
    }),
    deleteBusinessById: builder.mutation<{ success?: boolean } | void, string>({
      query: (id) => ({
        url: `/business/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Business", id: "LIST" }],
    }),
    activateBusinessById: builder.mutation<BusinessRecord, string>({
      query: (id) => ({
        url: `/business/${id}/activate`,
        method: "PATCH",
      }),
      transformResponse: (response: unknown) => normalizeBusinessRecord(response),
      invalidatesTags: (_result, _error, id) => [
        { type: "Business", id },
        { type: "Business", id: "LIST" },
      ],
    }),
    uploadBusinessLogo: builder.mutation<BusinessRecord, { id: string; file: File }>({
      query: ({ id, file }) => {
        const body = new FormData();
        body.append("logo", file);
        return {
          url: `/business/${id}/logo`,
          method: "PATCH",
          body,
        };
      },
      transformResponse: (response: unknown) => normalizeBusinessRecord(response),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Business", id },
        { type: "Business", id: "LIST" },
      ],
    }),
    resetOwnerCredentials: builder.mutation<
      CredentialsResult,
      { id: string; body?: ResetCredentialsPayload }
    >({
      query: ({ id, body }) => ({
        url: `/business/${id}/reset-owner-credentials`,
        method: "POST",
        body: body ?? { generate: true, sendEmail: true },
      }),
      transformResponse: (response: unknown) => {
        const parsed = asCredentialsResult(response);
        if (!parsed) {
          throw new Error("Invalid credentials response");
        }
        return parsed;
      },
    }),
  }),
});

export const {
  useGetBusinessesQuery,
  useCreateBusinessMutation,
  useLazyCheckBusinessEmailQuery,
  useGetBusinessByIdQuery,
  useLazyGetBusinessByIdQuery,
  usePatchBusinessByIdMutation,
  useDeleteBusinessByIdMutation,
  useActivateBusinessByIdMutation,
  useUploadBusinessLogoMutation,
  useResetOwnerCredentialsMutation,
} = businessApi;
