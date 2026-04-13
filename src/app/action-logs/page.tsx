"use client";

import { Download, Filter, Search, X } from "lucide-react";
import { useState } from "react";

const rows = [
  { when: "Apr 12, 10:13 PM", who: "emma.davis", user: "usr_010", action: "Viewed", actionTag: "Viewed", section: "Webhooks", result: "Failed", resultSub: "Resource not found", duration: "1.2s Slow", durationType: "slow", requestId: "log_00089", method: "GET", endpoint: "/api/webhooks" },
  { when: "Apr 12, 10:04 PM", who: "james.brown", user: "usr_016", action: "Signed in", actionTag: "Signed in", section: "Products", result: "Succeeded", resultSub: "", duration: "817ms", durationType: "normal", requestId: "log_00088", method: "GET", endpoint: "/api/products" },
  { when: "Apr 12, 9:47 PM", who: "lisa.wang", user: "usr_004", action: "Viewed", actionTag: "Viewed", section: "Payments", result: "Succeeded", resultSub: "", duration: "338ms", durationType: "normal", requestId: "log_00087", method: "GET", endpoint: "/api/payments" },
  { when: "Apr 12, 9:44 PM", who: "sarah.chen", user: "usr_011", action: "Deleted", actionTag: "Deleted", section: "Reports", result: "In progress", resultSub: "", duration: "97ms", durationType: "normal", requestId: "log_00086", method: "DELETE", endpoint: "/api/reports" },
  { when: "Apr 12, 9:41 PM", who: "lisa.wang", user: "usr_012", action: "Updated", actionTag: "Updated", section: "Webhooks", result: "Succeeded", resultSub: "", duration: "210ms", durationType: "normal", requestId: "log_00085", method: "PUT", endpoint: "/api/webhooks" },
  { when: "Apr 12, 9:28 PM", who: "emma.davis", user: "usr_012", action: "Signed out", actionTag: "Signed out", section: "Settings", result: "Succeeded", resultSub: "", duration: "541ms", durationType: "normal", requestId: "log_00084", method: "POST", endpoint: "/api/logout" },
  { when: "Apr 12, 9:04 PM", who: "lisa.wang", user: "usr_002", action: "Deleted", actionTag: "Deleted", section: "Payments", result: "Succeeded", resultSub: "", duration: "447ms", durationType: "normal", requestId: "log_00083", method: "DELETE", endpoint: "/api/payments" },
  { when: "Apr 12, 8:47 PM", who: "mike.wilson", user: "usr_013", action: "Signed in", actionTag: "Signed in", section: "Reports", result: "Warning", resultSub: "", duration: "302ms", durationType: "warning", requestId: "log_00082", method: "POST", endpoint: "/api/reports" },
  { when: "Apr 12, 8:22 PM", who: "sarah.chen", user: "usr_020", action: "Exported", actionTag: "Exported", section: "Payments", result: "Succeeded", resultSub: "", duration: "723ms", durationType: "normal", requestId: "log_00081", method: "GET", endpoint: "/api/payments/export" },
  { when: "Apr 12, 7:48 PM", who: "alex.johnson", user: "usr_013", action: "Created", actionTag: "Created", section: "Settings", result: "Warning", resultSub: "", duration: "396ms", durationType: "warning", requestId: "log_00080", method: "POST", endpoint: "/api/settings" },
  { when: "Apr 12, 7:27 PM", who: "mike.wilson", user: "usr_002", action: "Deleted", actionTag: "Deleted", section: "Payments", result: "Failed", resultSub: "Internal server error — d...", duration: "2.6s Slow", durationType: "slow", requestId: "log_00079", method: "DELETE", endpoint: "/api/payments" },
  { when: "Apr 12, 7:15 PM", who: "sarah.chen", user: "usr_002", action: "Signed in", actionTag: "Signed in", section: "Payments", result: "Succeeded", resultSub: "", duration: "304ms", durationType: "normal", requestId: "log_00078", method: "POST", endpoint: "/api/payments" },
  { when: "Apr 12, 7:08 PM", who: "mike.wilson", user: "usr_006", action: "Viewed", actionTag: "Viewed", section: "Orders", result: "Warning", resultSub: "", duration: "484ms", durationType: "warning", requestId: "log_00077", method: "GET", endpoint: "/api/orders" },
  { when: "Apr 12, 7:01 PM", who: "emma.davis", user: "usr_006", action: "Deleted", actionTag: "Deleted", section: "Settings", result: "Succeeded", resultSub: "", duration: "293ms", durationType: "normal", requestId: "log_00076", method: "DELETE", endpoint: "/api/settings" },
  { when: "Apr 12, 6:46 PM", who: "mike.wilson", user: "usr_016", action: "Updated", actionTag: "Updated", section: "Webhooks", result: "Succeeded", resultSub: "", duration: "769ms", durationType: "normal", requestId: "log_00075", method: "PUT", endpoint: "/api/webhooks" },
];

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
  const [selected, setSelected] = useState<typeof rows[number] | null>(null);

  return (
    <section className="mx-auto max-w-[1280px]">
      <div className="mb-4 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-[0_8px_24px_rgba(10,17,31,0.1)]">
        <div className="flex w-full items-center gap-3 rounded-xl bg-[#f4f5f7] px-3 py-2 text-sm text-[#6b7280]">
          <Search className="h-4 w-4" />
          Search logs...
        </div>
        <button className="inline-flex h-9 items-center gap-2 rounded-xl border-2 border-[#e5e7eb] bg-white px-3 text-sm font-semibold">
          <Filter className="h-4 w-4" /> Filters
        </button>
        <span className="text-sm text-[#667085]">200 records</span>
        <button className="inline-flex h-9 items-center gap-2 rounded-xl border-2 border-[#e5e7eb] bg-white px-3 text-sm font-semibold">
          <Download className="h-4 w-4" /> Export
        </button>
      </div>

      <div className="overflow-hidden rounded-3xl bg-white shadow-[0_8px_24px_rgba(10,17,31,0.1)]">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#e5e7eb] text-left">
              {["When", "Who", "Action", "Section", "Result", "Duration", ""].map((label) => (
                <th key={label} className="px-4 py-3 font-semibold">
                  {label}
                  {label === "When" || label === "Duration" ? "  ↑↓" : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.when}-${row.user}`} className="cursor-pointer border-b border-[#edf0f5]" onClick={() => setSelected(row)}>
                <td className="whitespace-nowrap px-4 py-3">{row.when}</td>
                <td className="px-4 py-3">
                  <div className="font-semibold text-[#111827]">{row.who}</div>
                  <div className="text-xs text-[#98a2b3]">{row.user}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-lg px-2 py-1 text-xs font-semibold ${actionStyles[row.actionTag]}`}>{row.action}</span>
                  <div className="text-xs text-[#98a2b3]">{row.section}</div>
                </td>
                <td className="px-4 py-3 text-[#475467]">{row.section}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-lg px-2 py-1 text-xs font-semibold ${resultStyles[row.result]}`}>{row.result}</span>
                  {row.resultSub ? <div className="text-xs text-[#ef4444]">{row.resultSub}</div> : null}
                </td>
                <td className={`px-4 py-3 ${row.durationType === "slow" ? "text-[#ef4444]" : row.durationType === "warning" ? "text-[#f59e0b]" : "text-[#111827]"}`}>
                  {row.duration}
                </td>
                <td className="px-4 py-3 text-right text-[#6a4df5]">View →</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-[#667085]">
        <span>Showing 1–15 of 200</span>
        <div className="flex items-center gap-2">
          <button className="grid h-8 w-8 place-items-center rounded-xl border border-[#e5e7eb]">‹</button>
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <button key={n} className={`grid h-8 w-8 place-items-center rounded-xl border border-[#e5e7eb] ${n === 1 ? "bg-[#5f66f4] text-white" : "bg-white"}`}>
              {n}
            </button>
          ))}
          <button className="grid h-8 w-8 place-items-center rounded-xl border border-[#e5e7eb]">›</button>
        </div>
      </div>

      {selected ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30 p-4">
          <div className="w-full max-w-[520px] rounded-3xl bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.25)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`inline-flex rounded-lg px-2 py-1 text-xs font-semibold ${actionStyles[selected.actionTag]}`}>{selected.action}</span>
                <span className="inline-flex rounded-lg bg-[#eef2f7] px-2 py-1 text-xs font-semibold text-[#111827]">{selected.section}</span>
              </div>
              <button onClick={() => setSelected(null)} className="grid h-8 w-8 place-items-center rounded-full border border-[#e5e7eb]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 flex items-center gap-3 text-sm text-[#667085]">
              <span className="inline-flex rounded-lg bg-[#dcfce7] px-2 py-1 text-xs font-semibold text-[#16a34a]">204</span>
              <span>{selected.requestId}</span>
              <span className="text-[#98a2b3]">{selected.method} {selected.endpoint}</span>
            </div>

            <div className="mt-4 text-sm font-semibold text-[#667085]">Request details</div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                { label: "Request ID", value: selected.requestId },
                { label: "When", value: selected.when.replace("Apr", "4/11/2026,") },
                { label: "Who", value: `${selected.who} (${selected.user})` },
                { label: "IP address", value: "77.61.157.130" },
                { label: "Duration", value: selected.duration },
                { label: "Section", value: selected.section },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl bg-[#f8fafc] px-4 py-3">
                  <div className="text-xs text-[#98a2b3]">{item.label}</div>
                  <div className="mt-1 text-sm font-semibold text-[#111827]">{item.value}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-3">
              {[
                { label: "What came back", count: "2 keys" },
                { label: "Request headers (technical)", count: "3 keys" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-2xl border border-[#e5e7eb] px-4 py-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-[#667085]">›</span>
                    <span className="font-semibold text-[#344054]">{item.label}</span>
                    <span className="rounded-full bg-[#eef2f7] px-2 py-0.5 text-xs font-semibold text-[#344054]">{item.count}</span>
                  </div>
                  <button className="text-xs font-semibold text-[#5f66f4]">Copy</button>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <div className="text-xs text-[#98a2b3]">Device / browser</div>
              <div className="mt-2 rounded-2xl bg-[#f8fafc] px-4 py-3 text-sm text-[#667085]">
                Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-[#98a2b3]">{selected.requestId} • {selected.section}</span>
              <div className="flex items-center gap-2">
                <button className="rounded-xl border border-[#e5e7eb] px-3 py-2 text-sm font-semibold">Copy raw</button>
                <button onClick={() => setSelected(null)} className="rounded-xl border border-[#e5e7eb] px-3 py-2 text-sm font-semibold">Close</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
