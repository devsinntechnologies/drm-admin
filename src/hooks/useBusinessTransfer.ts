"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { BASE_URL } from "@/lib/constant";
import { buildApiUrl } from "@/lib/api";
import { getStoredAuthToken, normalizeErrorMessage } from "@/lib/utils";
import { DIGINIZAM_CLIENT, DIGINIZAM_CLIENT_HEADER } from "@/lib/diginizam-client";

export type TransferSectionId =
  | "profile"
  | "template"
  | "staff"
  | "catalog"
  | "assets"
  | "restaurant_ops"
  | "orders_invoices"
  | "retail"
  | "pharmacy"
  | "stock"
  | "expenses"
  | "tickets"
  | "website";

export type TransferSectionInfo = {
  id: TransferSectionId;
  label: string;
  description: string;
  count: number;
};

export type TransferSectionsResponse = {
  businessId: string;
  industryId: string | null;
  family: string | null;
  sections: TransferSectionInfo[];
  defaults: TransferSectionId[];
};

export type TransferImportResult = {
  targetBusinessId: string;
  imported: Record<string, number>;
  skippedStaff: Array<{ email: string; reason: string }>;
  warnings: string[];
  remappedIds: number;
};

export function useBusinessTransfer(businessId: string) {
  const [sectionsLoading, setSectionsLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [sectionsData, setSectionsData] = useState<TransferSectionsResponse | null>(null);

  const loadSections = useCallback(async () => {
    if (!businessId) return null;
    setSectionsLoading(true);
    try {
      const data = await apiClient.get<TransferSectionsResponse>(
        `/business-transfer/${businessId}/sections`,
      );
      setSectionsData(data);
      return data;
    } catch (error) {
      toast.error(normalizeErrorMessage(error, "Failed to load export sections"));
      return null;
    } finally {
      setSectionsLoading(false);
    }
  }, [businessId]);

  const exportZip = useCallback(
    async (sections: TransferSectionId[]) => {
      if (!businessId) return;
      setExporting(true);
      try {
        const token = getStoredAuthToken();
        const response = await fetch(
          buildApiUrl(`/business-transfer/${businessId}/export`),
          {
            method: "POST",
            headers: {
              accept: "application/zip",
              "content-type": "application/json",
              [DIGINIZAM_CLIENT_HEADER]: DIGINIZAM_CLIENT,
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ sections }),
          },
        );
        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new ApiClientError(
            normalizeErrorMessage(payload, `Export failed (${response.status})`),
            response.status,
            payload,
          );
        }
        const blob = await response.blob();
        const disposition = response.headers.get("content-disposition") || "";
        const match = /filename="?([^"]+)"?/i.exec(disposition);
        const filename = match?.[1] || `business-export-${Date.now()}.zip`;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        toast.success("Export downloaded");
      } catch (error) {
        toast.error(normalizeErrorMessage(error, "Export failed"));
        throw error;
      } finally {
        setExporting(false);
      }
    },
    [businessId],
  );

  const importZip = useCallback(
    async (file: File, sections?: TransferSectionId[]) => {
      if (!businessId) return null;
      setImporting(true);
      try {
        const form = new FormData();
        form.append("file", file);
        if (sections?.length) {
          form.append("sections", JSON.stringify(sections));
        }
        const result = await apiClient.upload<TransferImportResult>(
          `/business-transfer/${businessId}/import`,
          form,
        );
        const skipped = result.skippedStaff?.length ?? 0;
        toast.success(
          skipped
            ? `Import finished. ${skipped} staff email(s) skipped.`
            : "Import finished",
        );
        return result;
      } catch (error) {
        toast.error(normalizeErrorMessage(error, "Import failed"));
        throw error;
      } finally {
        setImporting(false);
      }
    },
    [businessId],
  );

  return {
    sectionsData,
    sectionsLoading,
    exporting,
    importing,
    loadSections,
    exportZip,
    importZip,
    apiBase: BASE_URL,
  };
}
