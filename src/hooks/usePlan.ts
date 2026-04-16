import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { BASE_URL } from "@/lib/constant";

export type SubscribedBusiness = {
  id: string;
  businessName: string;
  email: string;
  phone: string;
};

export type Plan = {
  id: string;
  planName: string;
  displayName?: string;
  price: number;
  description: string;
  features?: string[];
  duration?: string;
  mostPopular?: boolean;
  isActive: boolean;
  subscribedBusinesses: SubscribedBusiness[];
  createdAt: string;
  updatedAt: string;
};

export type PlanStats = {
  totalPlans: number;
  subscribedBusinesses: number;
  byPlan: Record<string, number>;
};

export type PlanApiResponse = {
  stats: PlanStats;
  plans: Plan[];
};

export type CreatePlanPayload = {
  planName: string;
  displayName: string;
  price: number;
  description: string;
  features: string[];
  duration: string;
  mostPopular: boolean;
  isActive: boolean;
};

export type CreatePlanResponse = Plan;

export type PatchPlanPayload = {
  id: string;
  body: CreatePlanPayload;
};

export const planApi = createApi({
  reducerPath: "planApi",
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: (headers) => {
      headers.set("accept", "*/*");
      headers.set("Content-Type", "application/json");

      if (typeof window !== "undefined") {
        const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
        if (token) {
          headers.set("Authorization", `Bearer ${token}`);
        }
      }

      return headers;
    },
  }),
  endpoints: (builder) => ({
    getPlans: builder.query<PlanApiResponse, void>({
      query: () => "/plan",
    }),
    createPlan: builder.mutation<CreatePlanResponse, CreatePlanPayload>({
      query: (body) => ({
        url: "/plan",
        method: "POST",
        body,
      }),
    }),
    patchPlanById: builder.mutation<Plan, PatchPlanPayload>({
      query: ({ id, body }) => ({
        url: `/plan/${id}`,
        method: "PATCH",
        body,
      }),
    }),
    deletePlanById: builder.mutation<{ success?: boolean } | void, string>({
      query: (id) => ({
        url: `/plan/${id}`,
        method: "DELETE",
      }),
    }),
  }),
});

export const { useGetPlansQuery, useCreatePlanMutation, usePatchPlanByIdMutation, useDeletePlanByIdMutation } = planApi;
