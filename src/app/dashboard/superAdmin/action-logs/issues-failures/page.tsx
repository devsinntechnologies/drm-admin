import { AlertTriangle, ChevronRight } from "lucide-react";

const issues = [
  {
    title: "Product endpoint failure spike",
    detail: "POST /api/products returned 400 responses 14 times in the last hour.",
    status: "Critical",
    statusClass: "bg-[#ffe1e3] text-[#ef2231]",
  },
  {
    title: "Auth logout instability",
    detail: "Logout requests are intermittently failing with 500 errors for mobile sessions.",
    status: "High",
    statusClass: "bg-[#fff0d8] text-[#db7a00]",
  },
  {
    title: "Payment webhook timeout",
    detail: "Webhook delivery crossed the 2s threshold for 11 requests.",
    status: "Medium",
    statusClass: "bg-[#ebe6ff] text-[#6f3cf1]",
  },
];

export default function ActionLogIssuesPage() {
  return (
    <section className="w-full space-y-5">
      <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-3xl border border-[#ffb4b9] bg-[#fff2f3] px-5 py-4 text-[#ef2231]">
          <div className="flex items-center gap-3 text-base font-semibold">
            <AlertTriangle className="h-5 w-5" />
            High failure rate detected
          </div>
          <p className="mt-2 text-sm">13.5% of requests are failing, which is above the configured threshold.</p>
        </article>
        <article className="rounded-3xl border border-[#f1ca72] bg-[#fff9e8] px-5 py-4 text-[#d26b00]">
          <div className="flex items-center gap-3 text-base font-semibold">
            <AlertTriangle className="h-5 w-5" />
            Slow responses increasing
          </div>
          <p className="mt-2 text-sm">11 requests took more than 2 seconds and should be investigated.</p>
        </article>
      </div>

      <div className="rounded-3xl bg-white p-5 shadow-[0_8px_24px_rgba(10,17,31,0.1)] sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold text-[#111827]">Open issues</h3>
            <p className="text-sm text-[#667085]">Current failures and operational warnings</p>
          </div>
          <span className="rounded-full bg-[#f4f5f8] px-3 py-1 text-sm font-semibold text-[#475467]">
            {issues.length} items
          </span>
        </div>

        <div className="space-y-4">
          {issues.map((issue) => (
            <article key={issue.title} className="rounded-3xl border border-[#e7eaf0] bg-[#fbfcfe] p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h4 className="text-lg font-semibold text-[#111827]">{issue.title}</h4>
                    <span className={`rounded-full px-3 py-1 text-sm font-semibold ${issue.statusClass}`}>{issue.status}</span>
                  </div>
                  <p className="mt-2 text-sm text-[#667085]">{issue.detail}</p>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-2xl border border-[#d8dce4] bg-white px-4 py-2 text-sm font-semibold text-[#111827]"
                >
                  Review
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
