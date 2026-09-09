import { apiClient } from "@/lib/api-client";

export type PrintJobType = "INVOICE" | "TEST_INVOICE" | "KITCHEN_TICKET";
export type PrintJobStatus =
  | "PENDING"
  | "PRINTING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export type PrintJob = {
  id: string;
  businessId: string;
  printerId: string | null;
  printerName: string | null;
  jobType: PrintJobType;
  referenceNumber: string | null;
  referenceId: string | null;
  status: PrintJobStatus;
  payload: Record<string, unknown>;
  lastError: string | null;
  attempts: number;
  createdAt: string;
  updatedAt: string;
};

export type PrintJobsPayload = {
  jobs: PrintJob[];
};

export type CreatePrintJobInput = {
  jobType: PrintJobType;
  payload: Record<string, unknown>;
  printerId?: string;
  printerName?: string;
  referenceNumber?: string;
  referenceId?: string;
  deviceId?: string;
};

export function buildDigiNizamTestInvoicePayload(branding?: {
  businessName?: string | null;
  address?: string | null;
  contactPhone?: string | null;
}) {
  const now = new Date();
  return {
    uuid: "test-print",
    invoiceNumber: `TEST-${now.getTime() % 100000}`,
    orderNumber: "TEST-ORDER",
    orderId: "test-order",
    businessName: branding?.businessName?.trim() || "DigiNizam",
    businessAddress: branding?.address?.trim() || "Test Address",
    businessPhone: branding?.contactPhone?.trim() || "0000-0000000",
    totalPrice: "250.00",
    deliveryCharges: "0",
    packagingPrice: "0",
    status: "paid",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    Items: [
      {
        productname: "DigiNizam Test Item",
        quantity: 1,
        price: "150.00",
        total: 150,
      },
      {
        productname: "Sample Product",
        quantity: 2,
        price: "50.00",
        total: 100,
      },
    ],
    printOrderType: "Test Print",
    printTableName: "DigiNizam",
  };
}

export async function listPrintJobs(
  token: string | null | undefined,
  businessId?: string | null,
  options?: { status?: string; limit?: number },
) {
  const params = new URLSearchParams();
  if (options?.status) params.set("status", options.status);
  if (options?.limit) params.set("limit", String(options.limit));
  const qs = params.toString();
  return apiClient.get<PrintJobsPayload>(
    `/print-jobs${qs ? `?${qs}` : ""}`,
    token,
    businessId,
  );
}

export async function createPrintJob(
  token: string | null | undefined,
  businessId: string | null | undefined,
  input: CreatePrintJobInput,
) {
  return apiClient.post<PrintJob>("/print-jobs", input, token, businessId);
}

export async function deletePrintJob(
  token: string | null | undefined,
  businessId: string | null | undefined,
  jobId: string,
) {
  return apiClient.delete<{ message: string }>(`/print-jobs/${jobId}`, token, businessId);
}

export function invoiceRecordToPrintPayload(invoice: Record<string, unknown>) {
  return {
    ...invoice,
    Items: (invoice.Items as unknown[]) ?? (invoice.items as unknown[]) ?? [],
  };
}
