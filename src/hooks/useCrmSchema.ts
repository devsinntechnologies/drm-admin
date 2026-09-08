"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useActiveBusinessId } from "@/hooks/useActiveBusinessId";
import { apiClient } from "@/lib/api-client";
import type {
  CrmCardLayout,
  CrmModuleId,
  CrmModuleInfo,
  CrmModuleSchema,
  PublicCrmField,
} from "@/lib/crm";

type UpsertCrmSchemaPayload = {
  moduleId: CrmModuleId;
  fields: Array<
    Partial<PublicCrmField> & {
      label: string;
      type: PublicCrmField["type"];
    }
  >;
  cardLayout?: CrmCardLayout;
};

export function useCrmSchema(moduleId: CrmModuleId, businessIdOverride?: string | null) {
  const { token } = useAuth();
  const activeBusinessId = useActiveBusinessId();
  const businessId = businessIdOverride || activeBusinessId;

  const [schema, setSchema] = useState<CrmModuleSchema | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!token || !businessId || !moduleId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<CrmModuleSchema>(
        `/crm/schema?moduleId=${encodeURIComponent(moduleId)}`,
        token,
        businessId,
      );
      setSchema(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load custom fields");
    } finally {
      setLoading(false);
    }
  }, [token, businessId, moduleId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const save = useCallback(
    async (payload: UpsertCrmSchemaPayload) => {
      if (!token || !businessId) {
        throw new Error("No business selected");
      }
      setSaving(true);
      try {
        const data = await apiClient.put<CrmModuleSchema>(
          "/crm/schema",
          payload,
          token,
          businessId,
        );
        setSchema(data);
        return data;
      } finally {
        setSaving(false);
      }
    },
    [token, businessId],
  );

  return { schema, loading, saving, error, refetch, save, businessId };
}

export function useCrmModules(businessIdOverride?: string | null) {
  const { token } = useAuth();
  const activeBusinessId = useActiveBusinessId();
  const businessId = businessIdOverride || activeBusinessId;
  const [modules, setModules] = useState<CrmModuleInfo[]>([]);

  const refetch = useCallback(async () => {
    if (!token || !businessId) return;
    try {
      const data = await apiClient.get<CrmModuleInfo[]>("/crm/modules", token, businessId);
      setModules(Array.isArray(data) ? data : []);
    } catch {
      setModules([]);
    }
  }, [token, businessId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { modules, businessId };
}
