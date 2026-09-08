"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiClient } from "@/lib/api-client";

export type FbrFeature = {
  id: string;
  label: string;
  description: string;
  requiredForLivePosting: boolean;
  available: boolean;
  reason: string | null;
};

export type FbrStatus = {
  enabled: boolean;
  environment: "sandbox" | "production";
  ready: boolean;
  blockers: string[];
  endpoints: { validate: string; post: string };
  features: FbrFeature[];
  stats: {
    apiCalls: number;
    apiSuccess: number;
    apiFailed: number;
    invoicesPosted: number;
    invoicesPending: number;
    invoicesFailed: number;
  };
};

export type FbrApiCall = {
  id: string;
  submissionId?: string | null;
  environment: string;
  action: string;
  method: string;
  url: string;
  httpStatus?: number | null;
  success: boolean;
  durationMs: number;
  errorMessage?: string | null;
  createdAt: string;
};

export type FbrSubmission = {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  environment: string;
  status: string;
  attemptCount: number;
  fbrInvoiceNumber?: string | null;
  lastError?: string | null;
  createdAt: string;
  updatedAt: string;
};

export function useFbrActivity(businessId: string | null) {
  const { token } = useAuth();
  const [status, setStatus] = useState<FbrStatus | null>(null);
  const [calls, setCalls] = useState<FbrApiCall[]>([]);
  const [submissions, setSubmissions] = useState<FbrSubmission[]>([]);
  const [callFilter, setCallFilter] = useState<"all" | "success" | "failed">("all");
  const [loading, setLoading] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!token || !businessId) return;
    setLoading(true);
    setError(null);
    try {
      const successQuery =
        callFilter === "all" ? "" : `success=${callFilter === "success"}`;
      const [nextStatus, nextCalls, nextSubs] = await Promise.all([
        apiClient.get<FbrStatus>("/fbr/status", token, businessId),
        apiClient.get<FbrApiCall[]>(
          `/fbr/calls?limit=40${successQuery ? `&${successQuery}` : ""}`,
          token,
          businessId,
        ),
        apiClient.get<FbrSubmission[]>("/fbr/submissions?limit=40", token, businessId),
      ]);
      setStatus(nextStatus);
      setCalls(Array.isArray(nextCalls) ? nextCalls : []);
      setSubmissions(Array.isArray(nextSubs) ? nextSubs : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load FBR activity");
    } finally {
      setLoading(false);
    }
  }, [token, businessId, callFilter]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const retry = useCallback(
    async (id: string) => {
      if (!token || !businessId) return;
      setRetryingId(id);
      try {
        await apiClient.post(`/fbr/submissions/${id}/retry`, {}, token, businessId);
        await refetch();
      } finally {
        setRetryingId(null);
      }
    },
    [token, businessId, refetch],
  );

  return {
    status,
    calls,
    submissions,
    callFilter,
    setCallFilter,
    loading,
    retryingId,
    error,
    refetch,
    retry,
  };
}
