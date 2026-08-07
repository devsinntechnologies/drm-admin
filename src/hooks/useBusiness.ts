import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { BASE_URL } from "@/lib/constant";
import { getStoredAuthToken } from "@/lib/utils";

export type BusinessStatus = "active" | "inactive" | "expired";

export type BusinessRecord = {
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
};

export type PatchBusinessPayload = {
  id: string;
  body: CreateBusinessPayload;
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

export const businessApi = createApi({
  reducerPath: "businessApi",
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as any).auth?.token || getStoredAuthToken();
      
      if (token) {
        headers.set("Authorization", `Bearer ${token.trim()}`);
      }
      
      headers.set("accept", "*/*");

      return headers;
    },
  }),
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
    }),
    createBusiness: builder.mutation<CreateBusinessResponse, CreateBusinessPayload>({
      query: (body) => ({
        url: "/business",
        method: "POST",
        body,
      }),
    }),
    getBusinessById: builder.query<BusinessRecord, string>({
      query: (id) => `/business/${id}`,
      transformResponse: (response: BusinessRecord | { data: BusinessRecord }) =>
        "data" in response && response.data ? response.data : (response as BusinessRecord),
    }),
    patchBusinessById: builder.mutation<BusinessRecord, PatchBusinessPayload>({
      query: ({ id, body }) => ({
        url: `/business/${id}`,
        method: "PATCH",
        body,
      }),
      transformResponse: (response: BusinessRecord | { data: BusinessRecord }) =>
        "data" in response && response.data ? response.data : (response as BusinessRecord),
    }),
    deleteBusinessById: builder.mutation<{ success?: boolean } | void, string>({
      query: (id) => ({
        url: `/business/${id}`,
        method: "DELETE",
      }),
    }),
  }),
});

export const {
  useGetBusinessesQuery,
  useCreateBusinessMutation,
  useGetBusinessByIdQuery,
  useLazyGetBusinessByIdQuery,
  usePatchBusinessByIdMutation,
  useDeleteBusinessByIdMutation,
} = businessApi;
