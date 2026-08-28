"use client";

import { RefreshCcw } from "lucide-react";
import { useMemo, useState } from "react";
import {
  type ActionLogRecord,
  type ActionLogsQueryParams,
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

type BusinessActionLogsPanelProps = {
  businessId: string;
  businessName?: string;
};

const formatWhen = (timestamp: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(timestamp));

export function BusinessActionLogsPanel({
  businessId,
  businessName,
}: BusinessActionLogsPanelProps) {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"" | "success" | "failure">("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const params = useMemo<ActionLogsQueryParams>(
    () => ({
      businessId,
      page,
      limit: 50,
      status: status || undefined,
      startDate: startDate ? new Date(startDate).toISOString() : undefined,
      endDate: endDate ? new Date(endDate).toISOString() : undefined,
      includeNormalized: false,
    }),
    [businessId, page, status, startDate, endDate],
  );

  const { data, isFetching, error, refetch } = useGetActionLogsQuery(params);
  const logs = data?.data ?? [];
  const totalPages = data?.pagination.totalPages ?? 1;

  return (
    <section className="space-y-4 rounded-xl border border-[#e2e8f0] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[#0f172a]">Activity logs</h2>
          <p className="mt-1 text-sm text-[#64748b]">
            API actions for {businessName ?? "this business"}. Filter by date or status.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 rounded-lg border border-[#e2e8f0] px-3 py-2 text-sm font-semibold text-[#0f172a]"
        >
          <RefreshCcw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <label className="text-sm">
          <span className="mb-1 block text-xs font-semibold uppercase text-[#94a3b8]">From</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-[#e2e8f0] px-3 py-2"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs font-semibold uppercase text-[#94a3b8]">To</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-[#e2e8f0] px-3 py-2"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs font-semibold uppercase text-[#94a3b8]">Status</span>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as "" | "success" | "failure");
              setPage(1);
            }}
            className="rounded-lg border border-[#e2e8f0] px-3 py-2"
          >
            <option value="">All</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
          </select>
        </label>
      </div>

      {error ? (
        <p className="rounded-lg border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#dc2626]">
          Could not load logs for this business.
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-[#e2e8f0]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Endpoint</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-sm text-[#64748b]">
                  {isFetching ? "Loading logs…" : "No logs found for the selected filters."}
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log: ActionLogRecord) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap text-sm">{formatWhen(log.timestamp)}</TableCell>
                  <TableCell className="text-sm">{log.username ?? log.userRole ?? "—"}</TableCell>
                  <TableCell className="text-sm">{log.actionDescription ?? log.actionType}</TableCell>
                  <TableCell className="max-w-xs truncate text-xs font-mono">{log.method} {log.endpoint}</TableCell>
                  <TableCell>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        log.responseStatus === "success"
                          ? "bg-[#dcfce7] text-[#16a34a]"
                          : "bg-[#fee2e2] text-[#ef4444]"
                      }`}
                    >
                      {log.statusCode}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-[#64748b]">
        <span>
          Page {page} of {totalPages} · {data?.pagination.total ?? 0} total
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1 || isFetching}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-[#e2e8f0] px-3 py-1.5 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={page >= totalPages || isFetching}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-[#e2e8f0] px-3 py-1.5 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
