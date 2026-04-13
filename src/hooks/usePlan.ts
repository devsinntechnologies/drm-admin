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
  price: number;
  description: string;
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

export const planApi = createApi({
  reducerPath: "planApi",
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: (headers) => {
      headers.set("accept", "*/*");

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
  }),
});

export const { useGetPlansQuery } = planApi;
