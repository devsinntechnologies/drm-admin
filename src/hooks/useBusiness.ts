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

        const queryString = queryParams.toString();
        return queryString ? `/business?${queryString}` : "/business";
      },
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
    }),
    patchBusinessById: builder.mutation<BusinessRecord, PatchBusinessPayload>({
      query: ({ id, body }) => ({
        url: `/business/${id}`,
        method: "PATCH",
        body,
      }),
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
