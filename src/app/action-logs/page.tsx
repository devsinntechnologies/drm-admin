"use client";

import { Download, Filter, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { BASE_URL } from "@/lib/constant";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ApiLog = {
  id: string;
  timestamp: string;
  userId: string | null;
  userRole: string | null;
  actionType: string;
  module: string;
  method: string;
  endpoint: string;
  statusCode: number;
  responseStatus: string;
  durationMs: number | null;
  ipAddress: string | null;
  requestPayload: unknown;
  errorMessage: string | null;
  level: string;
};

type ApiResponse = {
  data: ApiLog[];
  total: number;
  page: number;
  last_page: number;
};

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
  rawPayload: unknown;
  errorMessage: string | null;
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

const mapLogToRow = (log: ApiLog): UiRow => {
  const actionTag = inferActionTag(log.method, log.endpoint);
  const durationType: UiRow["durationType"] =
    (log.durationMs ?? 0) > 1000
      ? "slow"
      : (log.durationMs ?? 0) > 500
        ? "warning"
        : "normal";

  return {
    id: log.id,
    when: formatWhen(log.timestamp),
    who: log.userRole ?? "Unknown user",
    user: log.userId ?? "anonymous",
    action: actionTag,
    actionTag,
    section: log.module?.split("?")[0] || "unknown",
    result: log.responseStatus === "success" ? "Succeeded" : "Failed",
    resultSub: log.errorMessage ?? "",
    duration: log.durationMs ? `${log.durationMs}ms` : "-",
    durationType,
    requestId: log.id,
    method: log.method,
    endpoint: log.endpoint,
    ipAddress: log.ipAddress ?? "-",
    statusCode: log.statusCode,
    timestamp: log.timestamp,
    rawPayload: log.requestPayload,
    errorMessage: log.errorMessage,
  };
};

const actionStyles: Record<string, string> = {
  Viewed: "bg-[#e6f4ff] text-[#1976d2]",
  "Signed in": "bg-[#ece7ff] text-[#6a4df5]",
  "Signed out": "bg-[#eef2f7] text-[#6b7280]",
  Deleted: "bg-[#ffe5e7] text-[#e11d48]",
  Updated: "bg-[#e1effe] text-[#2563eb]",
  Exported: "bg-[#ffedd5] text-[#ea580c]",
  Created: "bg-[#dcfce7] text-[#16a34a]",
};

const resultStyles: Record<string, string> = {
  Succeeded: "bg-[#dcfce7] text-[#16a34a]",
  Failed: "bg-[#fee2e2] text-[#ef4444]",
  Warning: "bg-[#ffedd5] text-[#f59e0b]",
  "In progress": "bg-[#ede9fe] text-[#7c3aed]",
};

export default function ActionLogsPage() {
  const [rows, setRows] = useState<UiRow[]>([]);
  const [selected, setSelected] = useState<UiRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadLogs = async () => {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("auth_token");
      if (!token) {
        if (isMounted) {
          setRows([]);
          setTotal(0);
          setError("No auth token found. Please login again.");
          setLoading(false);
        }
        return;
      }

      try {
        const response = await fetch(`${BASE_URL}/log-system?page=${page}`, {
          method: "GET",
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Unable to load logs (${response.status}).`);
        }

        const payload = (await response.json()) as ApiResponse;
        if (!isMounted) return;

        setRows((payload.data ?? []).map(mapLogToRow));
        setTotal(payload.total ?? payload.data?.length ?? 0);
        setLastPage(payload.last_page ?? 1);
      } catch (err) {
        if (!isMounted) return;
        setRows([]);
        setTotal(0);
        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadLogs();
    return () => {
      isMounted = false;
    };
  }, [page]);

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

  const startIndex = filteredRows.length === 0 ? 0 : 1;
  const endIndex = filteredRows.length;

  return (
    <section className="mx-auto max-w-7xl">
      <div className="mb-4 grid gap-3 rounded-3xl border border-white bg-[linear-gradient(120deg,rgba(255,255,255,0.9),rgba(224,242,254,0.74))] px-4 py-4 shadow-[0_12px_28px_rgba(10,17,31,0.1)] lg:grid-cols-[1fr_auto_auto_auto] lg:items-center">
        <div className="flex w-full items-center gap-3 rounded-xl border border-[#dde5f0] bg-[#f8fbff] px-3 py-2 text-sm text-[#6b7280]">
          <Search className="h-4 w-4" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search logs..."
            className="w-full bg-transparent outline-none"
          />
        </div>
        <button className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-[#d7e1ed] bg-white px-3 text-sm font-semibold text-[#1f2937] hover:bg-[#f8fbff]">
          <Filter className="h-4 w-4" /> Filters
        </button>
        <span className="rounded-xl border border-[#d7e1ed] bg-white px-3 py-2 text-center text-sm font-medium text-[#667085]">{total} records</span>
        <button className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-[#d7e1ed] bg-white px-3 text-sm font-semibold text-[#1f2937] hover:bg-[#f8fbff]">
          <Download className="h-4 w-4" /> Export
        </button>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <article className="rounded-2xl border border-[#dbe7f4] bg-white/85 px-4 py-3 shadow-[0_8px_18px_rgba(10,17,31,0.06)]">
          <p className="text-xs font-medium text-[#64748b]">Succeeded</p>
          <p className="mt-1 text-2xl font-semibold text-[#15803d]">{summary.succeeded}</p>
        </article>
        <article className="rounded-2xl border border-[#f7d8dc] bg-white/85 px-4 py-3 shadow-[0_8px_18px_rgba(10,17,31,0.06)]">
          <p className="text-xs font-medium text-[#64748b]">Failed</p>
          <p className="mt-1 text-2xl font-semibold text-[#dc2626]">{summary.failed}</p>
        </article>
        <article className="rounded-2xl border border-[#fde6bf] bg-white/85 px-4 py-3 shadow-[0_8px_18px_rgba(10,17,31,0.06)]">
          <p className="text-xs font-medium text-[#64748b]">Slow Requests</p>
          <p className="mt-1 text-2xl font-semibold text-[#d97706]">{summary.slow}</p>
        </article>
      </div>

      <div className="overflow-hidden rounded-3xl border border-[#e4ebf4] bg-white/90 shadow-[0_10px_24px_rgba(10,17,31,0.1)]">
        <Table className="text-sm">
          <TableHeader>
            <TableRow className="border-b border-[#dce7f3] bg-linear-to-r from-[#f8fbff] to-[#eef6ff] text-left hover:bg-linear-to-r hover:from-[#f8fbff] hover:to-[#eef6ff]">
              {["When", "Who", "Action", "Section", "Result", "Duration", ""].map((label) => (
                <TableHead key={label} className="px-4 py-3 text-xs font-semibold tracking-[0.08em] text-[#334155] uppercase">
                  {label}
                  {label === "When" || label === "Duration" ? "  ↑↓" : ""}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={7} className="px-4 py-8 text-center text-[#667085]">Loading logs...</TableCell>
              </TableRow>
            ) : error ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={7} className="px-4 py-8 text-center text-[#ef4444]">{error}</TableCell>
              </TableRow>
            ) : filteredRows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={7} className="px-4 py-8 text-center text-[#667085]">No logs found.</TableCell>
              </TableRow>
            ) : filteredRows.map((row) => (
              <TableRow
                key={row.id}
                className="group cursor-pointer border-b border-[#e4edf7] odd:bg-white even:bg-[#f7fbff] transition-colors hover:bg-[#ecf5ff]"
                onClick={() => setSelected(row)}
              >
                <TableCell className="whitespace-nowrap px-4 py-3.5 font-medium text-[#0f172a]">{row.when}</TableCell>
                <TableCell className="px-4 py-3.5">
                  <div className="font-semibold text-[#0f172a]">{row.who}</div>
                  <div className="text-xs text-[#98a2b3]">{row.user}</div>
                </TableCell>
                <TableCell className="px-4 py-3.5">
                  <span className={`inline-flex rounded-lg px-2 py-1 text-xs font-semibold ${getActionStyle(row.actionTag)}`}>{row.action}</span>
                  <div className="text-xs text-[#98a2b3]">{row.section}</div>
                </TableCell>
                <TableCell className="px-4 py-3.5 font-medium text-[#334155]">{row.section}</TableCell>
                <TableCell className="px-4 py-3.5">
                  <span className={`inline-flex rounded-lg px-2 py-1 text-xs font-semibold ${getResultStyle(row.result)}`}>{row.result}</span>
                  {row.resultSub ? <div className="text-xs text-[#ef4444]">{row.resultSub}</div> : null}
                </TableCell>
                <TableCell className={`px-4 py-3.5 font-semibold ${row.durationType === "slow" ? "text-[#ef4444]" : row.durationType === "warning" ? "text-[#f59e0b]" : "text-[#0f172a]"}`}>
                  {row.duration}
                </TableCell>
                <TableCell className="px-4 py-3.5 text-right">
                  <span className="inline-flex items-center rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-2.5 py-1 text-xs font-semibold text-[#155e75] transition group-hover:border-[#7dd3fc] group-hover:bg-[#e0f2fe]">
                    View →
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-2xl border border-[#e2e8f0] bg-white/75 px-3 py-2 text-sm text-[#667085]">
        <span>Showing {startIndex}-{endIndex} of {query ? filteredRows.length : total}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page <= 1 || loading}
            className="grid h-8 w-8 place-items-center rounded-xl border border-[#e5e7eb] disabled:opacity-50"
          >
            ‹
          </button>
          {Array.from({ length: Math.min(lastPage, 7) }, (_, index) => index + 1).map((n) => (
            <button
              key={n}
              onClick={() => setPage(n)}
              className={`grid h-8 w-8 place-items-center rounded-xl border border-[#e5e7eb] ${n === page ? "bg-[#5f66f4] text-white" : "bg-white"}`}
            >
              {n}
            </button>
          ))}
          <button
            onClick={() => setPage((prev) => Math.min(lastPage, prev + 1))}
            disabled={page >= lastPage || loading}
            className="grid h-8 w-8 place-items-center rounded-xl border border-[#e5e7eb] disabled:opacity-50"
          >
            ›
          </button>
        </div>
      </div>

      {selected ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/35 p-4 backdrop-blur-[1px]">
          <div className="w-full max-w-130 rounded-3xl border border-white bg-[linear-gradient(160deg,rgba(255,255,255,0.98),rgba(240,249,255,0.94))] p-6 shadow-[0_24px_60px_rgba(15,23,42,0.25)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`inline-flex rounded-lg px-2 py-1 text-xs font-semibold ${getActionStyle(selected.actionTag)}`}>{selected.action}</span>
                <span className="inline-flex rounded-lg bg-[#eef2f7] px-2 py-1 text-xs font-semibold text-[#111827]">{selected.section}</span>
              </div>
              <button onClick={() => setSelected(null)} className="grid h-8 w-8 place-items-center rounded-full border border-[#d7e1ed] bg-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 flex items-center gap-3 text-sm text-[#667085]">
              <span className={`inline-flex rounded-lg px-2 py-1 text-xs font-semibold ${selected.result === "Succeeded" ? "bg-[#dcfce7] text-[#16a34a]" : "bg-[#fee2e2] text-[#ef4444]"}`}>
                {selected.statusCode}
              </span>
              <span>{selected.requestId}</span>
              <span className="text-[#98a2b3]">{selected.method} {selected.endpoint}</span>
            </div>

            <div className="mt-4 text-sm font-semibold text-[#667085]">Request details</div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                { label: "Request ID", value: selected.requestId },
                { label: "When", value: new Date(selected.timestamp).toLocaleString() },
                { label: "Who", value: `${selected.who} (${selected.user})` },
                { label: "IP address", value: selected.ipAddress },
                { label: "Duration", value: selected.duration },
                { label: "Section", value: selected.section },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-[#e2e8f0] bg-white/80 px-4 py-3">
                  <div className="text-xs text-[#98a2b3]">{item.label}</div>
                  <div className="mt-1 text-sm font-semibold text-[#111827]">{item.value}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-3">
              {[
                { label: "Request payload", count: typeof selected.rawPayload === "object" && selected.rawPayload !== null ? `${Object.keys(selected.rawPayload as Record<string, unknown>).length} keys` : "raw" },
                { label: "Error details", count: selected.errorMessage ? "available" : "none" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-2xl border border-[#e2e8f0] bg-white/80 px-4 py-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-[#667085]">›</span>
                    <span className="font-semibold text-[#344054]">{item.label}</span>
                    <span className="rounded-full bg-[#eef2f7] px-2 py-0.5 text-xs font-semibold text-[#344054]">{item.count}</span>
                  </div>
                  <button
                    onClick={() => {
                      const value = item.label === "Request payload" ? selected.rawPayload : selected.errorMessage;
                      void navigator.clipboard.writeText(JSON.stringify(value, null, 2));
                    }}
                    className="text-xs font-semibold text-[#155e75]"
                  >
                    Copy
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <div className="text-xs text-[#98a2b3]">Device / browser</div>
              <div className="mt-2 rounded-2xl border border-[#e2e8f0] bg-white/80 px-4 py-3 text-sm text-[#667085]">
                N/A
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-[#98a2b3]">{selected.requestId} • {selected.section}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    void navigator.clipboard.writeText(JSON.stringify(selected, null, 2));
                  }}
                  className="rounded-xl border border-[#d7e1ed] bg-white px-3 py-2 text-sm font-semibold"
                >
                  Copy raw
                </button>
                <button onClick={() => setSelected(null)} className="rounded-xl border border-[#d7e1ed] bg-white px-3 py-2 text-sm font-semibold">Close</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
