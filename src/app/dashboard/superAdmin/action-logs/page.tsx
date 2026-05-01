"use client";

import { CalendarDays, Download, Filter, RefreshCcw, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  type ActionLogRecord,
  type ActionLogsQueryParams,
  type LogStatus,
  useGetActionLogsQuery,
} from "@/hooks/useActionLogs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type UiRow = {
  id: string;
  when: string;
  who: string;
  user: string;
  action: string;
  actionTag: string;
  section: string;
  result: string;
  resultSub: string;
  duration: string;
  durationType: "normal" | "warning" | "slow";
  requestId: string;
  method: string;
  endpoint: string;
  ipAddress: string;
  statusCode: number;
  timestamp: string;
  browser: string;
  rawRequestHeaders: Record<string, unknown> | null;
  rawRequestPayload: unknown;
  rawResponsePayload: unknown;
  rawNormalized: unknown;
  userDetails: {
    id: string;
    username: string;
    role: string;
    businessId: string;
  };
  errorMessage: string | null;
};

type FilterState = {
  userId: string;
  username: string;
  actionType: string;
  module: string;
  status: "" | LogStatus;
  startDate: string;
  endDate: string;
  limit: number;
  includeNormalized: boolean;
};

const DEFAULT_LIMIT = 50;

const INITIAL_FILTERS: FilterState = {
  userId: "",
  username: "",
  actionType: "",
  module: "",
  status: "",
  startDate: "",
  endDate: "",
  limit: DEFAULT_LIMIT,
  includeNormalized: true,
};

const formatWhen = (timestamp: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(timestamp));

const inferActionTag = (method: string, endpoint: string) => {
  const upperMethod = method.toUpperCase();
  const lowerEndpoint = endpoint.toLowerCase();

  if (upperMethod === "POST" && lowerEndpoint.includes("/login")) return "Signed in";
  if (upperMethod === "POST" && lowerEndpoint.includes("/logout")) return "Signed out";
  if (upperMethod === "GET") return "Viewed";
  if (upperMethod === "POST") return "Created";
  if (upperMethod === "PUT" || upperMethod === "PATCH") return "Updated";
  if (upperMethod === "DELETE") return "Deleted";
  return "Viewed";
};

const mapLogToRow = (log: ActionLogRecord): UiRow => {
  const actionTag = log.actionDescription ?? inferActionTag(log.method, log.endpoint);
  const durationType: UiRow["durationType"] =
    (log.durationMs ?? 0) > 1000 ? "slow" : (log.durationMs ?? 0) > 500 ? "warning" : "normal";

  return {
    id: log.id,
    when: formatWhen(log.timestamp),
    who: log.username ?? log.userRole ?? "Unknown user",
    user: log.userId ?? "anonymous",
    action: actionTag,
    actionTag,
    section: log.section ?? log.module?.split("?")[0] ?? "unknown",
    result: log.responseStatus === "success" ? "Succeeded" : "Failed",
    resultSub: log.errorMessage ?? "",
    duration: log.durationMs ? `${log.durationMs}ms` : "-",
    durationType,
    requestId: log.requestId ?? log.id,
    method: log.method,
    endpoint: log.endpoint,
    ipAddress: log.ipAddress ?? "-",
    statusCode: log.statusCode,
    timestamp: log.timestamp,
    browser: log.requestUserAgent ?? "N/A",
    rawRequestHeaders: log.requestHeaders ?? null,
    rawRequestPayload: log.requestPayload,
    rawResponsePayload: log.responsePayload ?? log.normalized?.response?.payload ?? null,
    rawNormalized: log.normalized,
    userDetails: {
      id: log.normalized?.user?.id ?? log.userId ?? "anonymous",
      username: log.normalized?.user?.username ?? log.username ?? "Unknown",
      role: log.normalized?.user?.role ?? log.userRole ?? "Unknown",
      businessId: log.normalized?.user?.businessId ?? log.businessId ?? "-",
    },
    errorMessage: log.errorMessage,
  };
};

const actionStyles: Record<string, string> = {
  Viewed: "bg-[#e6f4ff] text-[#1976d2]",
  "Signed in": "bg-[#dcfce7] text-[#166534]",
  "Signed out": "bg-[#f1f5f9] text-[#475569]",
  Deleted: "bg-[#ffe5e7] text-[#e11d48]",
  Updated: "bg-[#e1effe] text-[#2563eb]",
  Created: "bg-[#fff4d8] text-[#b45309]",
};

const resultStyles: Record<string, string> = {
  Succeeded: "bg-[#dcfce7] text-[#16a34a]",
  Failed: "bg-[#fee2e2] text-[#ef4444]",
};

const toIsoOrUndefined = (value: string) => {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
};

const getErrorMessage = (error: unknown) => {
  if (!error || typeof error !== "object") {
    return "Something went wrong while loading logs.";
  }

  if ("status" in error && typeof error.status === "number") {
    return `Unable to load logs (${error.status}).`;
  }

  return "Unable to load logs right now.";
};

const formatJsonValue = (value: unknown) => {
  if (value === null || value === undefined) {
    return "N/A";
  }

  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "Unable to format JSON value.";
  }
};

const copyTextToClipboard = async (text: string) => {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard.");
      return true;
    } catch {
      // Fall through to the legacy clipboard path.
    }
  }

  if (typeof document === "undefined") {
    return false;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    return document.execCommand("copy");
  } finally {
    document.body.removeChild(textarea);
  }
};

export default function ActionLogsPage() {
  const [selected, setSelected] = useState<UiRow | null>(null);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);

  const updateFilter = <Key extends keyof FilterState>(key: Key, value: FilterState[Key]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const requestParams = useMemo<ActionLogsQueryParams>(
    () => ({
      userId: filters.userId.trim() || undefined,
      username: filters.username.trim() || undefined,
      actionType: filters.actionType.trim() || undefined,
      module: filters.module.trim() || undefined,
      status: filters.status || undefined,
      startDate: toIsoOrUndefined(filters.startDate),
      endDate: toIsoOrUndefined(filters.endDate),
      page,
      limit: filters.limit,
      includeNormalized: filters.includeNormalized,
    }),
    [filters, page],
  );

  const { data, isFetching, error, refetch } = useGetActionLogsQuery(requestParams);

  const rows = useMemo(() => (data?.data ?? []).map(mapLogToRow), [data]);

  const filteredRows = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return rows;

    return rows.filter((row) =>
      [row.who, row.user, row.action, row.section, row.result, row.endpoint, row.requestId]
        .join(" ")
        .toLowerCase()
        .includes(search),
    );
  }, [rows, query]);

  const getActionStyle = (action: string) => actionStyles[action] ?? "bg-[#eef2f7] text-[#475467]";
  const getResultStyle = (result: string) => resultStyles[result] ?? "bg-[#eef2f7] text-[#475467]";

  const summary = useMemo(() => {
    const succeeded = filteredRows.filter((item) => item.result === "Succeeded").length;
    const failed = filteredRows.filter((item) => item.result === "Failed").length;
    const slow = filteredRows.filter((item) => item.durationType === "slow").length;
    return { succeeded, failed, slow };
  }, [filteredRows]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.userId) count += 1;
    if (filters.username) count += 1;
    if (filters.actionType) count += 1;
    if (filters.module) count += 1;
    if (filters.status) count += 1;
    if (filters.startDate) count += 1;
    if (filters.endDate) count += 1;
    if (filters.limit !== DEFAULT_LIMIT) count += 1;
    if (!filters.includeNormalized) count += 1;
    return count;
  }, [filters]);

  const total = data?.pagination?.total ?? 0;
  const lastPage = data?.pagination?.totalPages ?? 1;
  const startIndex = filteredRows.length === 0 ? 0 : 1;
  const endIndex = filteredRows.length;

  const resetFilters = () => {
    setFilters(INITIAL_FILTERS);
    setPage(1);
  };

  const exportVisibleRows = () => {
    const exportData = filteredRows.map((row) => ({
      requestId: row.requestId,
      when: row.timestamp,
      who: row.who,
      action: row.action,
      section: row.section,
      method: row.method,
      endpoint: row.endpoint,
      statusCode: row.statusCode,
      result: row.result,
      duration: row.duration,
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `action-logs-page-${page}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success("Logs exported successfully.");
  };

  return (
    <section className="w-full">
      <div className="mb-4 rounded-3xl border border-white bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.95),rgba(220,252,231,0.72),rgba(224,242,254,0.72))] p-4 shadow-[0_18px_36px_rgba(8,18,38,0.12)]">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[#0f172a]">
            <Filter className="h-4 w-4" />
            <h2 className="text-sm font-semibold tracking-[0.08em] uppercase">Log Filters</h2>
            <span className="rounded-lg border border-[#c7d2fe] bg-white/80 px-2 py-1 text-xs font-semibold text-[#4338ca]">
              {activeFilterCount} active
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-[#d7e1ed] bg-white px-3 text-sm font-semibold text-[#1f2937] hover:bg-[#f8fbff]"
            >
              <RefreshCcw className="h-4 w-4" /> Refresh
            </button>
            <button
              onClick={exportVisibleRows}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-[#d7e1ed] bg-white px-3 text-sm font-semibold text-[#1f2937] hover:bg-[#f8fbff]"
            >
              <Download className="h-4 w-4" /> Export
            </button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <input
            value={filters.userId}
            onChange={(event) => updateFilter("userId", event.target.value)}
            placeholder="User ID"
            className="rounded-xl border border-[#d5e0ee] bg-white/85 px-3 py-2 text-sm outline-none focus:border-[#7dd3fc]"
          />
          <input
            value={filters.username}
            onChange={(event) => updateFilter("username", event.target.value)}
            placeholder="Username"
            className="rounded-xl border border-[#d5e0ee] bg-white/85 px-3 py-2 text-sm outline-none focus:border-[#7dd3fc]"
          />
          <input
            value={filters.actionType}
            onChange={(event) => updateFilter("actionType", event.target.value)}
            placeholder="Action type (AUTH, READ...)"
            className="rounded-xl border border-[#d5e0ee] bg-white/85 px-3 py-2 text-sm outline-none focus:border-[#7dd3fc]"
          />
          <input
            value={filters.module}
            onChange={(event) => updateFilter("module", event.target.value)}
            placeholder="Module"
            className="rounded-xl border border-[#d5e0ee] bg-white/85 px-3 py-2 text-sm outline-none focus:border-[#7dd3fc]"
          />

          <select
            value={filters.status}
            onChange={(event) => updateFilter("status", event.target.value as "" | LogStatus)}
            className="rounded-xl border border-[#d5e0ee] bg-white/85 px-3 py-2 text-sm outline-none focus:border-[#7dd3fc]"
          >
            <option value="">Status: all</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
          </select>

          <label className="flex items-center gap-2 rounded-xl border border-[#d5e0ee] bg-white/85 px-3 py-2 text-sm text-[#64748b]">
            <CalendarDays className="h-4 w-4" />
            <input
              type="datetime-local"
              value={filters.startDate}
              onChange={(event) => updateFilter("startDate", event.target.value)}
              className="w-full bg-transparent outline-none"
            />
          </label>

          <label className="flex items-center gap-2 rounded-xl border border-[#d5e0ee] bg-white/85 px-3 py-2 text-sm text-[#64748b]">
            <CalendarDays className="h-4 w-4" />
            <input
              type="datetime-local"
              value={filters.endDate}
              onChange={(event) => updateFilter("endDate", event.target.value)}
              className="w-full bg-transparent outline-none"
            />
          </label>

          <div className="flex items-center gap-2">
            <select
              value={filters.limit}
              onChange={(event) => updateFilter("limit", Number(event.target.value))}
              className="h-full w-full rounded-xl border border-[#d5e0ee] bg-white/85 px-3 py-2 text-sm outline-none focus:border-[#7dd3fc]"
            >
              {[25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  Limit {n}
                </option>
              ))}
            </select>
            <label className="inline-flex h-full min-w-44 items-center justify-center gap-2 rounded-xl border border-[#d5e0ee] bg-white/85 px-3 py-2 text-sm font-medium text-[#334155]">
              <input
                type="checkbox"
                checked={filters.includeNormalized}
                onChange={(event) => updateFilter("includeNormalized", event.target.checked)}
              />
              Include normalized
            </label>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex w-full items-center gap-3 rounded-xl border border-[#dde5f0] bg-[#f8fbff] px-3 py-2 text-sm text-[#6b7280] lg:max-w-xl">
            <Search className="h-4 w-4" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search loaded rows..."
              className="w-full bg-transparent outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={resetFilters}
              className="inline-flex h-9 items-center justify-center rounded-xl border border-[#d7e1ed] bg-white px-4 text-sm font-semibold text-[#334155]"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <article className="rounded-2xl border border-[#dbe7f4] bg-white/90 px-4 py-3 shadow-[0_8px_18px_rgba(10,17,31,0.06)]">
          <p className="text-xs font-medium text-[#64748b]">Succeeded</p>
          <p className="mt-1 text-2xl font-semibold text-[#15803d]">{summary.succeeded}</p>
        </article>
        <article className="rounded-2xl border border-[#f7d8dc] bg-white/90 px-4 py-3 shadow-[0_8px_18px_rgba(10,17,31,0.06)]">
          <p className="text-xs font-medium text-[#64748b]">Failed</p>
          <p className="mt-1 text-2xl font-semibold text-[#dc2626]">{summary.failed}</p>
        </article>
        <article className="rounded-2xl border border-[#fde6bf] bg-white/90 px-4 py-3 shadow-[0_8px_18px_rgba(10,17,31,0.06)]">
          <p className="text-xs font-medium text-[#64748b]">Slow Requests</p>
          <p className="mt-1 text-2xl font-semibold text-[#d97706]">{summary.slow}</p>
        </article>
      </div>

      <div className="overflow-hidden rounded-3xl border border-[#e4ebf4] bg-white/95 shadow-[0_10px_24px_rgba(10,17,31,0.1)]">
        <Table className="text-sm">
          <TableHeader>
            <TableRow className="border-b border-[#dce7f3] bg-linear-to-r from-[#f8fbff] to-[#eef6ff] text-left hover:bg-linear-to-r hover:from-[#f8fbff] hover:to-[#eef6ff]">
              {[
                "When",
                "Who",
                "Action",
                "Section",
                "Method",
                "Result",
                "Duration",
                "",
              ].map((label) => (
                <TableHead
                  key={label}
                  className="px-4 py-3 text-xs font-semibold tracking-[0.08em] text-[#334155] uppercase"
                >
                  {label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isFetching ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={8} className="px-4 py-8 text-center text-[#667085]">
                  Loading logs...
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={8} className="px-4 py-8 text-center text-[#ef4444]">
                  {getErrorMessage(error)}
                </TableCell>
              </TableRow>
            ) : filteredRows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={8} className="px-4 py-8 text-center text-[#667085]">
                  No logs found.
                </TableCell>
              </TableRow>
            ) : (
              filteredRows.map((row) => (
                <TableRow
                  key={row.id}
                  className="group cursor-pointer border-b border-[#e4edf7] odd:bg-white even:bg-[#f7fbff] transition-colors hover:bg-[#ecf5ff]"
                  onClick={() => setSelected(row)}
                >
                  <TableCell className="whitespace-nowrap px-4 py-3.5 font-medium text-[#0f172a]">
                    {row.when}
                  </TableCell>
                  <TableCell className="px-4 py-3.5">
                    <div className="font-semibold text-[#0f172a]">{row.who}</div>
                    <div className="text-xs text-[#98a2b3]">{row.user}</div>
                  </TableCell>
                  <TableCell className="px-4 py-3.5">
                    <span
                      className={`inline-flex rounded-lg px-2 py-1 text-xs font-semibold ${getActionStyle(row.actionTag)}`}
                    >
                      {row.action}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3.5 font-medium text-[#334155]">{row.section}</TableCell>
                  <TableCell className="px-4 py-3.5 font-semibold text-[#0f172a]">{row.method}</TableCell>
                  <TableCell className="px-4 py-3.5">
                    <span
                      className={`inline-flex rounded-lg px-2 py-1 text-xs font-semibold ${getResultStyle(row.result)}`}
                    >
                      {row.result}
                    </span>
                    {row.resultSub ? <div className="text-xs text-[#ef4444]">{row.resultSub}</div> : null}
                  </TableCell>
                  <TableCell
                    className={`px-4 py-3.5 font-semibold ${
                      row.durationType === "slow"
                        ? "text-[#ef4444]"
                        : row.durationType === "warning"
                          ? "text-[#f59e0b]"
                          : "text-[#0f172a]"
                    }`}
                  >
                    {row.duration}
                  </TableCell>
                  <TableCell className="px-4 py-3.5 text-right">
                    <span className="inline-flex items-center rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-2.5 py-1 text-xs font-semibold text-[#155e75] transition group-hover:border-[#7dd3fc] group-hover:bg-[#e0f2fe]">
                      View
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-2xl border border-[#e2e8f0] bg-white/75 px-3 py-2 text-sm text-[#667085]">
        <span>
          Showing {startIndex}-{endIndex} of {query ? filteredRows.length : total}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page <= 1 || isFetching}
            className="grid h-8 w-8 place-items-center rounded-xl border border-[#e5e7eb] disabled:opacity-50"
          >
            {"<"}
          </button>
          {Array.from({ length: Math.min(lastPage, 7) }, (_, index) => index + 1).map((n) => (
            <button
              key={n}
              onClick={() => setPage(n)}
              className={`grid h-8 w-8 place-items-center rounded-xl border border-[#e5e7eb] ${
                n === page ? "bg-[#1E365B] text-[#ffffff]" : "bg-white"
              }`}
            >
              {n}
            </button>
          ))}
          <button
            onClick={() => setPage((prev) => Math.min(lastPage, prev + 1))}
            disabled={page >= lastPage || isFetching}
            className="grid h-8 w-8 place-items-center rounded-xl border border-[#e5e7eb] disabled:opacity-50"
          >
            {">"}
          </button>
        </div>
      </div>

      {selected ? (
        <div className="fixed inset-0 z-50 flex justify-end overflow-x-hidden overflow-y-auto bg-slate-950/35 p-4 backdrop-blur-[1px]">
          <div className="w-full max-w-130 max-h-[calc(100vh-2rem)] overflow-x-hidden overflow-y-auto rounded-3xl border border-white bg-[linear-gradient(160deg,rgba(255,255,255,0.98),rgba(240,249,255,0.94))] p-6 shadow-[0_24px_60px_rgba(15,23,42,0.25)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex rounded-lg px-2 py-1 text-xs font-semibold ${getActionStyle(selected.actionTag)}`}
                >
                  {selected.action}
                </span>
                <span className="inline-flex rounded-lg bg-[#eef2f7] px-2 py-1 text-xs font-semibold text-[#111827]">
                  {selected.section}
                </span>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="grid h-8 w-8 place-items-center rounded-full border border-[#d7e1ed] bg-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 flex items-center gap-3 text-sm text-[#667085]">
              <span
                className={`inline-flex rounded-lg px-2 py-1 text-xs font-semibold ${
                  selected.result === "Succeeded" ? "bg-[#dcfce7] text-[#16a34a]" : "bg-[#fee2e2] text-[#ef4444]"
                }`}
              >
                {selected.statusCode}
              </span>
              <span>{selected.requestId}</span>
              <span className="text-[#98a2b3]">
                {selected.method} {selected.endpoint}
              </span>
            </div>

            <div className="mt-4 text-sm font-semibold text-[#667085]">Request details</div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                { label: "Request ID", value: selected.requestId },
                { label: "When", value: new Date(selected.timestamp).toLocaleString() },
                { label: "User Name", value: selected.userDetails.username },
                { label: "User ID", value: selected.userDetails.id },
                { label: "User Role", value: selected.userDetails.role },
                { label: "Business ID", value: selected.userDetails.businessId },
                { label: "Section", value: selected.section },
                { label: "Error Message", value: selected.errorMessage ?? "-" },
                { label: "IP address", value: selected.ipAddress },
                { label: "Duration", value: selected.duration },
                { label: "Browser", value: selected.browser },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-[#e2e8f0] bg-white/80 px-4 py-3">
                  <div className="text-xs text-[#98a2b3]">{item.label}</div>
                  <div className="mt-1 text-sm font-semibold text-[#111827]">{item.value}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl border border-[#e2e8f0] bg-white/80 p-3">
                <div className="mb-2 text-xs font-semibold tracking-[0.08em] text-[#667085] uppercase">Request Headers</div>
                <pre className="max-h-40 overflow-x-hidden overflow-y-auto whitespace-pre-wrap wrap-break-word rounded-xl bg-[#f8fafc] p-3 text-xs text-[#334155]">
                  {formatJsonValue(selected.rawRequestHeaders)}
                </pre>
              </div>
              <div className="rounded-2xl border border-[#e2e8f0] bg-white/80 p-3">
                <div className="mb-2 text-xs font-semibold tracking-[0.08em] text-[#667085] uppercase">Request Payload</div>
                <pre className="max-h-40 overflow-x-hidden overflow-y-auto whitespace-pre-wrap wrap-break-word rounded-xl bg-[#f8fafc] p-3 text-xs text-[#334155]">
                  {formatJsonValue(selected.rawRequestPayload)}
                </pre>
              </div>
              <div className="rounded-2xl border border-[#e2e8f0] bg-white/80 p-3">
                <div className="mb-2 text-xs font-semibold tracking-[0.08em] text-[#667085] uppercase">Response Payload</div>
                <pre className="max-h-40 overflow-x-hidden overflow-y-auto whitespace-pre-wrap wrap-break-word rounded-xl bg-[#f8fafc] p-3 text-xs text-[#334155]">
                  {formatJsonValue(selected.rawResponsePayload)}
                </pre>
              </div>
              <div className="rounded-2xl border border-[#e2e8f0] bg-white/80 p-3">
                <div className="mb-2 text-xs font-semibold tracking-[0.08em] text-[#667085] uppercase">User Details</div>
                <pre className="max-h-32 overflow-x-hidden overflow-y-auto whitespace-pre-wrap wrap-break-word rounded-xl bg-[#f8fafc] p-3 text-xs text-[#334155]">
                  {formatJsonValue(selected.userDetails)}
                </pre>
              </div>
              <div className="rounded-2xl border border-[#e2e8f0] bg-white/80 p-3">
                <div className="mb-2 text-xs font-semibold tracking-[0.08em] text-[#667085] uppercase">Error Details</div>
                <pre className="max-h-32 overflow-x-hidden overflow-y-auto whitespace-pre-wrap wrap-break-word rounded-xl bg-[#f8fafc] p-3 text-xs text-[#334155]">
                  {formatJsonValue(selected.errorMessage)}
                </pre>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-[#98a2b3]">
                {selected.requestId} | {selected.section}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async (event) => {
                    event.stopPropagation();
                    await copyTextToClipboard(JSON.stringify(selected, null, 2));
                  }}
                  className="rounded-xl border border-[#d7e1ed] bg-white px-3 py-2 text-sm font-semibold"
                >
                  Copy raw
                </button>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="rounded-xl border border-[#d7e1ed] bg-white px-3 py-2 text-sm font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
