"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Factory,
  Loader2,
  Package,
  Plus,
  Send,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import {
  PortalPageHeader,
  FormField,
  portalInputClass,
  portalPanelClass,
  portalBtnPrimaryClass,
  portalBtnSecondaryClass,
} from "@/components/admin/PortalPage";
import { NumberInput } from "@/components/common/NumberInput";
import { useProducts } from "@/hooks/useProducts";
import { useRetailResource } from "@/hooks/useRetailResource";
import { apiClient } from "@/lib/api-client";
import { asList } from "@/lib/api";
import { getStoredAuthToken } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useActiveBusinessId } from "@/hooks/useActiveBusinessId";

type ProcessType = { id: string; name: string; code: string };
type Supplier = { id: string; name: string };

type BatchRow = {
  id: string;
  batchNumber: string;
  productId: string;
  article?: string | null;
  color?: string | null;
  design?: string | null;
  status: string;
  plannedQuantity: number;
  unitLabel?: string;
  jobs?: JobRow[];
};

type JobRow = {
  id: string;
  jobNumber: string;
  batchNumber?: string;
  processName?: string;
  supplierId?: string;
  status: string;
  issuedQuantity: number;
  receivedQuantity: number;
  pendingQuantity: number;
  dueDate?: string | null;
  productionBatchId?: string;
};

type VendorStockRow = {
  vendorName: string;
  jobNumber: string;
  jobId?: string;
  batchNumber?: string;
  process?: string;
  pendingQuantity: number;
};

type Summary = {
  activeProductionBatches?: number;
  jobsPendingReceipt?: number;
  jobsOverdue?: number;
};

export function ProductionJobWorkWorkspace() {
  const { token: reduxToken } = useAuth();
  const businessId = useActiveBusinessId();
  const token = reduxToken || getStoredAuthToken();
  const { products } = useProducts({ limit: 300 });
  const { items: suppliers } = useRetailResource<Supplier>("/retail/suppliers");

  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [vendorStock, setVendorStock] = useState<VendorStockRow[]>([]);
  const [processTypes, setProcessTypes] = useState<ProcessType[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [tab, setTab] = useState<"jobs" | "batches" | "vendors" | "costs">("jobs");

  const [showBatchForm, setShowBatchForm] = useState(false);
  const [batchProductId, setBatchProductId] = useState("");
  const [batchArticle, setBatchArticle] = useState("");
  const [batchDesign, setBatchDesign] = useState("");
  const [batchColor, setBatchColor] = useState("");
  const [batchPlanned, setBatchPlanned] = useState(100);
  const [batchUnit, setBatchUnit] = useState("meter");

  const [showJobForm, setShowJobForm] = useState(false);
  const [jobBatchId, setJobBatchId] = useState("");
  const [jobProcessId, setJobProcessId] = useState("");
  const [jobSupplierId, setJobSupplierId] = useState("");
  const [jobDueDate, setJobDueDate] = useState("");
  const [jobRate, setJobRate] = useState(0);

  const [issueProductId, setIssueProductId] = useState("");
  const [issueVariantId, setIssueVariantId] = useState("");
  const [issueQty, setIssueQty] = useState(1);
  const [receiveAccepted, setReceiveAccepted] = useState(0);
  const [receiveRejected, setReceiveRejected] = useState(0);
  const [receiveWastage, setReceiveWastage] = useState(0);
  const [finishVariantId, setFinishVariantId] = useState("");
  const [finishQty, setFinishQty] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const selectedJob = useMemo(
    () => jobs.find((j) => j.id === selectedJobId) ?? null,
    [jobs, selectedJobId],
  );

  const selectedBatch = useMemo(
    () => batches.find((b) => b.id === selectedBatchId) ?? null,
    [batches, selectedBatchId],
  );

  const batchProductVariants = useMemo(() => {
    if (!selectedBatch?.productId) return [];
    return products.find((p) => p.id === selectedBatch.productId)?.variants ?? [];
  }, [products, selectedBatch?.productId]);

  const productVariants = useMemo(() => {
    const p = products.find((x) => x.id === issueProductId);
    return p?.variants ?? [];
  }, [products, issueProductId]);

  const load = useCallback(async () => {
    if (!token || !businessId) return;
    setLoading(true);
    try {
      const [sumRes, batchRes, jobRes, vendorRes, procRes] = await Promise.all([
        apiClient.get<Summary>("/production-job-work/dashboard/summary", token, businessId),
        apiClient.get<unknown>("/production-job-work/batches?limit=50", token, businessId),
        apiClient.get<unknown>("/production-job-work/jobs?limit=50", token, businessId),
        apiClient.get<unknown>(
          "/production-job-work/reports/stock-with-vendors",
          token,
          businessId,
        ),
        apiClient.get<unknown>("/production-job-work/process-types", token, businessId),
      ]);
      setSummary(sumRes ?? null);
      setBatches(asList<BatchRow>(batchRes));
      setJobs(asList<JobRow>(jobRes));
      setVendorStock(asList<VendorStockRow>(vendorRes));
      const processes = asList<ProcessType>(procRes);
      setProcessTypes(processes);
      if (processes.length === 0) {
        toast.message("No process types yet — saving defaults…");
        const retry = await apiClient.get<unknown>(
          "/production-job-work/process-types",
          token,
          businessId,
        );
        setProcessTypes(asList<ProcessType>(retry));
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to load production data");
    } finally {
      setLoading(false);
    }
  }, [token, businessId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (jobs.length === 1 && !selectedJobId) {
      setSelectedJobId(jobs[0].id);
    }
  }, [jobs, selectedJobId]);

  const createBatch = async () => {
    if (!batchProductId) {
      toast.error("Select a product / style");
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post(
        "/production-job-work/batches",
        {
          productId: batchProductId,
          article: batchArticle || undefined,
          design: batchDesign || undefined,
          color: batchColor || undefined,
          plannedQuantity: batchPlanned,
          unitLabel: batchUnit,
        },
        token,
        businessId,
      );
      toast.success("Production batch created");
      setShowBatchForm(false);
      await load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Could not create batch");
    } finally {
      setSubmitting(false);
    }
  };

  const createJob = async () => {
    if (!jobBatchId || !jobProcessId || !jobSupplierId) {
      toast.error("Batch, process, and vendor are required");
      return;
    }
    if (processTypes.length === 0) {
      toast.error("Process list is empty — refresh the page or enable Production & Job Work");
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post(
        "/production-job-work/jobs",
        {
          productionBatchId: jobBatchId,
          processTypeId: jobProcessId,
          supplierId: jobSupplierId,
          dueDate: jobDueDate || undefined,
          rate: jobRate,
        },
        token,
        businessId,
      );
      toast.success("Job work created");
      setShowJobForm(false);
      await load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Could not create job");
    } finally {
      setSubmitting(false);
    }
  };

  const issueMaterial = async () => {
    if (!selectedJobId) {
      toast.error("Select a job row in the table first");
      return;
    }
    if (!issueProductId) {
      toast.error("Select material product");
      return;
    }
    if (issueQty <= 0) {
      toast.error("Enter issue quantity greater than 0");
      return;
    }
    if (productVariants.length > 0 && !issueVariantId) {
      toast.error("Select a variant (this product has sizes/packs)");
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post(
        `/production-job-work/jobs/${selectedJobId}/issue`,
        {
          productId: issueProductId,
          variantId: issueVariantId || undefined,
          quantity: issueQty,
        },
        token,
        businessId,
      );
      toast.success("Material issued — warehouse stock updated");
      setIssueQty(1);
      await load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Issue failed");
    } finally {
      setSubmitting(false);
    }
  };

  const receiveMaterial = async () => {
    if (!selectedJobId || !selectedJob) return;
    const total = receiveAccepted + receiveRejected + receiveWastage;
    if (total <= 0) {
      toast.error("Enter received quantities");
      return;
    }
    if ((selectedJob.issuedQuantity ?? 0) <= 0) {
      toast.error("Pehle Issue from warehouse karein — Sent abhi 0 hai.");
      return;
    }
    const pending = selectedJob.pendingQuantity ?? 0;
    if (pending <= 0) {
      toast.error("Vendor ke paas pending maal nahi — pehle issue karein ya sab receive ho chuka hai.");
      return;
    }
    if (total > pending + 0.0001) {
      toast.error(`Sirf ${pending} pending hai — receive total is se zyada nahi ho sakta.`);
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post(
        `/production-job-work/jobs/${selectedJobId}/receive`,
        {
          acceptedQuantity: receiveAccepted,
          rejectedQuantity: receiveRejected,
          wastageQuantity: receiveWastage,
        },
        token,
        businessId,
      );
      toast.success("Receipt recorded");
      setReceiveAccepted(0);
      setReceiveRejected(0);
      setReceiveWastage(0);
      await load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Receive failed");
    } finally {
      setSubmitting(false);
    }
  };

  const postFinished = async () => {
    if (!selectedBatchId || !finishVariantId || finishQty <= 0) {
      toast.error("Select batch and variant quantity for finished goods");
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post(
        `/production-job-work/batches/${selectedBatchId}/finished-output`,
        { lines: [{ variantId: finishVariantId, quantity: finishQty }] },
        token,
        businessId,
      );
      toast.success("Finished stock posted to inventory");
      setFinishQty(0);
      await load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Could not post finished output");
    } finally {
      setSubmitting(false);
    }
  };

  const openBatchDetail = async (id: string) => {
    setSelectedBatchId(id);
    if (!token || !businessId) return;
    try {
      const detail = await apiClient.get<BatchRow>(
        `/production-job-work/batches/${id}`,
        token,
        businessId,
      );
      setBatches((prev) => prev.map((b) => (b.id === id ? { ...b, ...detail } : b)));
    } catch {
      /* keep list row */
    }
  };

  if (!businessId) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950">
        <p className="font-semibold">Select a business to continue</p>
        <p className="mt-2 text-amber-900/80">
          Open this module from a business workspace (with <code className="text-xs">?businessId=…</code> in the
          URL) or pick a business under Super Admin → Businesses.
        </p>
      </div>
    );
  }

  return (
    <>
      <PortalPageHeader
        icon={Factory}
        title="Production & Job Work"
        subtitle="Batches, vendor job work, material issue/receive, and stock with karigars."
      />

      {summary && (
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">Active batches</p>
            <p className="text-2xl font-semibold">{summary.activeProductionBatches ?? 0}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">Jobs pending receipt</p>
            <p className="text-2xl font-semibold">{summary.jobsPendingReceipt ?? 0}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">Overdue jobs</p>
            <p className="text-2xl font-semibold text-amber-700">{summary.jobsOverdue ?? 0}</p>
          </div>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(["jobs", "batches", "vendors"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-md px-3 py-1.5 text-sm ${
              tab === key ? "bg-primary text-primary-foreground" : "bg-muted"
            }`}
          >
            {key === "jobs" ? "Job work" : key === "batches" ? "Batches" : "Vendor stock"}
          </button>
        ))}
        <button type="button" onClick={() => void load()} className={portalBtnSecondaryClass}>
          Refresh
        </button>
        <button
          type="button"
          onClick={() => {
            setShowBatchForm((v) => !v);
            setShowJobForm(false);
          }}
          className={portalBtnPrimaryClass}
        >
          <Plus className="mr-1 inline h-4 w-4" /> New batch
        </button>
        <button
          type="button"
          onClick={() => {
            setShowJobForm((v) => !v);
            setShowBatchForm(false);
            if (batches[0]) setJobBatchId(batches[0].id);
          }}
          className={portalBtnPrimaryClass}
        >
          <Plus className="mr-1 inline h-4 w-4" /> New job
        </button>
      </div>

      {showBatchForm && (
        <div className={`${portalPanelClass} mb-6 space-y-3`}>
          <h3 className="font-semibold">Create production batch</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <FormField label="Product / style">
              <select
                className={portalInputClass}
                value={batchProductId}
                onChange={(e) => setBatchProductId(e.target.value)}
              >
                <option value="">Select product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Planned quantity">
              <NumberInput value={batchPlanned} onChange={setBatchPlanned} min={0} />
            </FormField>
            <FormField label="Article">
              <input className={portalInputClass} value={batchArticle} onChange={(e) => setBatchArticle(e.target.value)} />
            </FormField>
            <FormField label="Design">
              <input className={portalInputClass} value={batchDesign} onChange={(e) => setBatchDesign(e.target.value)} />
            </FormField>
            <FormField label="Color">
              <input className={portalInputClass} value={batchColor} onChange={(e) => setBatchColor(e.target.value)} />
            </FormField>
            <FormField label="Unit">
              <input className={portalInputClass} value={batchUnit} onChange={(e) => setBatchUnit(e.target.value)} />
            </FormField>
          </div>
          <button type="button" disabled={submitting} onClick={() => void createBatch()} className={portalBtnPrimaryClass}>
            {submitting ? <Loader2 className="inline h-4 w-4 animate-spin" /> : "Save batch"}
          </button>
        </div>
      )}

      {showJobForm && (
        <div className={`${portalPanelClass} mb-6 space-y-3`}>
          <h3 className="font-semibold">Create job work</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <FormField label="Batch">
              <select className={portalInputClass} value={jobBatchId} onChange={(e) => setJobBatchId(e.target.value)}>
                <option value="">Select batch</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.batchNumber} {b.article ? `· ${b.article}` : ""}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Process">
              <select className={portalInputClass} value={jobProcessId} onChange={(e) => setJobProcessId(e.target.value)}>
                <option value="">Select process</option>
                {processTypes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              {processTypes.length === 0 ? (
                <p className="mt-1 text-xs text-amber-700">
                  Processes load from the server (Embroidery, Cutting, etc.). Click Refresh above or check that
                  Production module is enabled.
                </p>
              ) : null}
            </FormField>
            <FormField label="Vendor / worker">
              <select className={portalInputClass} value={jobSupplierId} onChange={(e) => setJobSupplierId(e.target.value)}>
                <option value="">Select supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Rate (per unit)">
              <NumberInput value={jobRate} onChange={setJobRate} min={0} />
            </FormField>
            <FormField label="Due date">
              <input type="date" className={portalInputClass} value={jobDueDate} onChange={(e) => setJobDueDate(e.target.value)} />
            </FormField>
          </div>
          <button type="button" disabled={submitting} onClick={() => void createJob()} className={portalBtnPrimaryClass}>
            Save job
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : tab === "batches" ? (
            <div className="overflow-x-auto rounded-lg border">
              <table className="min-w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left">Batch</th>
                    <th className="px-3 py-2 text-left">Article</th>
                    <th className="px-3 py-2 text-right">Planned</th>
                    <th className="px-3 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map((b) => (
                    <tr
                      key={b.id}
                      className={`cursor-pointer border-t hover:bg-muted/30 ${selectedBatchId === b.id ? "bg-muted/40" : ""}`}
                      onClick={() => void openBatchDetail(b.id)}
                    >
                      <td className="px-3 py-2 font-medium">{b.batchNumber}</td>
                      <td className="px-3 py-2">{b.article ?? "—"}</td>
                      <td className="px-3 py-2 text-right">
                        {b.plannedQuantity} {b.unitLabel ?? ""}
                      </td>
                      <td className="px-3 py-2 capitalize">{b.status.replace(/_/g, " ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : tab === "vendors" ? (
            <div className="overflow-x-auto rounded-lg border">
              <table className="min-w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left">Vendor</th>
                    <th className="px-3 py-2 text-left">Job</th>
                    <th className="px-3 py-2 text-left">Process</th>
                    <th className="px-3 py-2 text-right">Pending</th>
                  </tr>
                </thead>
                <tbody>
                  {vendorStock.map((row, i) => (
                    <tr
                      key={`${row.jobNumber}-${i}`}
                      className="cursor-pointer border-t hover:bg-muted/30"
                      onClick={() => row.jobId && setSelectedJobId(row.jobId)}
                    >
                      <td className="px-3 py-2">{row.vendorName}</td>
                      <td className="px-3 py-2">{row.jobNumber}</td>
                      <td className="px-3 py-2">{row.process ?? "—"}</td>
                      <td className="px-3 py-2 text-right font-semibold text-amber-700">
                        {row.pendingQuantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="min-w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left">Job</th>
                    <th className="px-3 py-2 text-left">Process</th>
                    <th className="px-3 py-2 text-right">Sent</th>
                    <th className="px-3 py-2 text-right">Received</th>
                    <th className="px-3 py-2 text-right">Pending</th>
                    <th className="px-3 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((j) => (
                    <tr
                      key={j.id}
                      className={`cursor-pointer border-t hover:bg-muted/30 ${selectedJobId === j.id ? "bg-muted/40" : ""}`}
                      onClick={() => setSelectedJobId(j.id)}
                    >
                      <td className="px-3 py-2 font-medium">{j.jobNumber}</td>
                      <td className="px-3 py-2">{j.processName ?? "—"}</td>
                      <td className="px-3 py-2 text-right">{j.issuedQuantity}</td>
                      <td className="px-3 py-2 text-right">{j.receivedQuantity}</td>
                      <td className="px-3 py-2 text-right font-semibold text-amber-700">{j.pendingQuantity}</td>
                      <td className="px-3 py-2 capitalize">{j.status.replace(/_/g, " ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className={`${portalPanelClass} space-y-4`}>
          <h3 className="flex items-center gap-2 font-semibold">
            <Package className="h-4 w-4" /> Selected job
          </h3>
          {!selectedJob ? (
            <p className="text-sm text-muted-foreground">Select a job to issue or receive material.</p>
          ) : (
            <>
              <div className="text-sm">
                <p className="font-medium">{selectedJob.jobNumber}</p>
                <p className="text-muted-foreground">{selectedJob.processName}</p>
                <p className="mt-2">
                  Sent <strong>{selectedJob.issuedQuantity}</strong> · Received{" "}
                  <strong>{selectedJob.receivedQuantity}</strong> · Pending{" "}
                  <strong className="text-amber-700">{selectedJob.pendingQuantity}</strong>
                </p>
              </div>

              <div className="space-y-2 border-t pt-3">
                <p className="flex items-center gap-1 text-xs font-semibold uppercase text-muted-foreground">
                  <Send className="h-3 w-3" /> Issue material
                </p>
                <select
                  className={portalInputClass}
                  value={issueProductId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setIssueProductId(id);
                    const p = products.find((x) => x.id === id);
                    const vars = p?.variants ?? [];
                    if (vars.length === 1) {
                      setIssueVariantId(vars[0].id);
                    } else {
                      setIssueVariantId("");
                    }
                  }}
                >
                  <option value="">Material product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {productVariants.length > 0 && (
                  <select
                    className={portalInputClass}
                    value={issueVariantId}
                    onChange={(e) => setIssueVariantId(e.target.value)}
                    required
                  >
                    <option value="">Select variant (required)</option>
                    {productVariants.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name ?? v.id} · stock {v.inStock ?? 0}
                      </option>
                    ))}
                  </select>
                )}
                <FormField label="Issue quantity">
                  <NumberInput value={issueQty} onChange={setIssueQty} min={1} />
                </FormField>
                <button type="button" disabled={submitting} onClick={() => void issueMaterial()} className={portalBtnPrimaryClass}>
                  Issue from warehouse
                </button>
              </div>

              <div className="space-y-2 border-t pt-3">
                <p className="flex items-center gap-1 text-xs font-semibold uppercase text-muted-foreground">
                  <Truck className="h-3 w-3" /> Receive from vendor
                </p>
                <FormField label="Good qty">
                  <NumberInput value={receiveAccepted} onChange={setReceiveAccepted} min={0} />
                </FormField>
                <FormField label="Rejected">
                  <NumberInput value={receiveRejected} onChange={setReceiveRejected} min={0} />
                </FormField>
                <FormField label="Wastage">
                  <NumberInput value={receiveWastage} onChange={setReceiveWastage} min={0} />
                </FormField>
                {(selectedJob?.issuedQuantity ?? 0) <= 0 ? (
                  <p className="text-xs text-amber-700">
                    Step 1: Issue material first (Sent is 0). Then record receipt.
                  </p>
                ) : null}
                <button type="button" disabled={submitting} onClick={() => void receiveMaterial()} className={portalBtnPrimaryClass}>
                  Record receipt
                </button>
              </div>
            </>
          )}

          {selectedBatch && (
            <div className="space-y-2 border-t pt-3 text-sm">
              <p className="font-medium text-foreground">Batch {selectedBatch.batchNumber}</p>
              <p className="text-muted-foreground">
                {selectedBatch.jobs?.length ?? 0} job(s) on this batch
              </p>
              {batchProductVariants.length > 0 && (
                <>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    Post finished goods
                  </p>
                  <select
                    className={portalInputClass}
                    value={finishVariantId}
                    onChange={(e) => setFinishVariantId(e.target.value)}
                  >
                    <option value="">Size / variant</option>
                    {batchProductVariants.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name ?? v.id}
                      </option>
                    ))}
                  </select>
                  <NumberInput value={finishQty} onChange={setFinishQty} min={0} />
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => void postFinished()}
                    className={portalBtnSecondaryClass}
                  >
                    Add to sellable stock
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
