import { Activity, AlertTriangle, ChevronDown, LineChart, RefreshCcw, PieChart } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";

const failures = [
  { id: 1, endpoint: "GET /api/settings", value: "5 (15%)", width: "15%" },
  { id: 2, endpoint: "DELETE /api/products/:id", value: "3 (9%)", width: "9%" },
  { id: 3, endpoint: "GET /api/products", value: "3 (9%)", width: "9%" },
  { id: 4, endpoint: "PUT /api/settings", value: "3 (9%)", width: "9%" },
  { id: 5, endpoint: "PUT /api/webhooks/:id", value: "2 (6%)", width: "6%" },
];

export default function ActionLogsPage() {
  return (
    <AdminShell activeTab="action-logs">
      <section className="mb-5 flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-[0_8px_28px_rgba(7,16,34,0.09)] lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#5b62f5] text-white">
            <Activity className="h-6 w-6" strokeWidth={1.8} />
          </div>
          <div>
            <h2 className="text-3xl font-semibold lg:text-5xl">Action Logs</h2>
            <p className="text-xl text-[#657084] lg:text-3xl">Monitor system activity across businesses</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex h-12 min-w-[210px] items-center justify-between rounded-xl bg-[#f0f1f5] px-4 text-lg text-[#677084] lg:h-[66px] lg:text-3xl">
            All Businesses <ChevronDown className="h-4 w-4 lg:h-6 lg:w-6" />
          </div>
          <button type="button" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-[#d8dce4] bg-white px-5 text-lg font-semibold lg:h-[66px] lg:text-3xl">
            <RefreshCcw className="h-4 w-4 lg:h-6 lg:w-6" /> Refresh
          </button>
        </div>
      </section>

      <section className="mb-5 flex flex-col gap-3 rounded-3xl bg-white p-3 shadow-[0_8px_24px_rgba(10,17,31,0.1)] lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <button className="h-12 rounded-xl bg-gradient-to-r from-[#5f66f4] to-[#8f1ef5] px-4 text-base font-semibold text-white shadow-[0_8px_18px_rgba(102,55,211,0.32)] lg:h-[62px] lg:text-3xl">Dashboard</button>
          <button className="h-12 rounded-xl px-4 text-base text-[#4f5a6f] lg:h-[62px] lg:text-3xl">Activity Log</button>
          <button className="h-12 rounded-xl px-4 text-base text-[#4f5a6f] lg:h-[62px] lg:text-3xl">Issues & Failures</button>
        </div>
        <span className="text-sm font-semibold text-[#98a1b1] lg:text-3xl">Updated 3:30:08 AM</span>
      </section>

      <section className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <article className="rounded-3xl border-2 border-[#ffb4b9] bg-[#fff2f3] p-5 text-[#ef2231]">
          <h4 className="text-2xl font-semibold lg:text-4xl">High failure rate</h4>
          <p className="mt-2 text-lg lg:text-3xl">16.5% of requests are failing, above the 10% threshold</p>
        </article>
        <article className="rounded-3xl border-2 border-[#f1ca72] bg-[#fff9e8] p-5 text-[#d26b00]">
          <h4 className="text-2xl font-semibold lg:text-4xl">Slow responses</h4>
          <p className="mt-2 text-lg lg:text-3xl">20 requests took over 2 seconds</p>
        </article>
      </section>

      <section className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { title: "Total Requests", value: "200", sub: "All Businesses", bg: "from-[#9041f8] to-[#5052f8]" },
          { title: "Failure Rate", value: "16.5%", sub: "33 failed requests", bg: "from-[#ff2f5a] to-[#ec007c]" },
          { title: "Active Users", value: "6", sub: "Unique users", bg: "from-[#2f88f1] to-[#1490c7]" },
          { title: "Avg Response", value: "699ms", sub: "Average execution time", bg: "from-[#06c364] to-[#05a765]" },
        ].map((item) => (
          <article key={item.title} className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${item.bg} p-6 text-white shadow-[0_14px_32px_rgba(28,48,94,0.22)]`}>
            <div className="absolute -right-3 -top-2 h-28 w-28 rounded-3xl bg-white/15" />
            <h4 className="relative z-[1] text-xl font-medium lg:text-3xl">{item.title}</h4>
            <p className="relative z-[1] mt-6 text-4xl font-semibold leading-none lg:mt-8 lg:text-5xl">{item.value}</p>
            <p className="relative z-[1] mt-3 text-lg text-white/90 lg:text-2xl">{item.sub}</p>
          </article>
        ))}
      </section>

      <section className="mb-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
        <article className="overflow-hidden rounded-3xl bg-white shadow-[0_7px_22px_rgba(10,17,31,0.08)]">
          <div className="flex min-h-24 items-center gap-4 bg-gradient-to-r from-[#e6e8f7] to-[#ece6f0] px-6 py-5 lg:px-8">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#3a7eed] text-white">
              <LineChart className="h-6 w-6" strokeWidth={1.8} />
            </div>
            <div>
              <h3 className="text-2xl font-bold lg:text-[1.7rem]">Request Activity</h3>
              <p className="text-lg font-medium text-[#606a7f] lg:text-2xl">Last 24 hours</p>
            </div>
          </div>
          <div className="p-5 lg:p-6">
            <div className="relative mt-2 h-[290px] border-b-2 border-l-2 border-[#8f96a6] bg-[linear-gradient(to_right,#d6dbe7_1px,transparent_1px),linear-gradient(to_top,#d6dbe7_1px,transparent_1px)] bg-[size:12.5%_100%,100%_20%] lg:h-[370px]">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" className="absolute inset-0 h-full w-full">
                <polyline fill="none" stroke="#5a63f2" strokeWidth="0.8" points="0,20 4,62 8,54 13,27 17,56 21,76 26,70 31,32 35,22 40,53 45,58 49,26 53,22 57,71 62,60 66,50 70,62 74,40 78,55 83,68 87,23 92,26 96,56 100,38" />
                <polyline fill="none" stroke="#0db96b" strokeWidth="0.8" points="0,26 4,68 8,60 13,35 17,58 21,75 26,72 31,38 35,28 40,54 45,64 49,30 53,27 57,72 62,63 66,54 70,69 74,55 78,65 83,74 87,28 92,29 96,62 100,49" />
                <polyline fill="none" stroke="#ef4444" strokeWidth="0.8" points="0,98 4,98 8,99 13,92 17,97 21,99 26,94 31,92 35,94 40,98 45,97 49,99 53,93 57,98 62,93 66,97 70,92 74,89 78,92 83,94 87,95 92,99 96,96 100,94" />
              </svg>
            </div>
            <div className="mt-3 flex justify-center gap-4 text-lg lg:text-4xl">
              <span className="text-[#5a63f2]">◦ All</span>
              <span className="text-[#0db96b]">◦ Success</span>
              <span className="text-[#ef4444]">◦ Failed</span>
            </div>
          </div>
        </article>

        <article className="overflow-hidden rounded-3xl bg-white shadow-[0_7px_22px_rgba(10,17,31,0.08)]">
          <div className="flex min-h-24 items-center gap-4 bg-gradient-to-r from-[#e6e8f7] to-[#ece6f0] px-6 py-5 lg:px-8">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#9d3df1] text-white">
              <PieChart className="h-6 w-6" strokeWidth={1.8} />
            </div>
            <div>
              <h3 className="text-2xl font-bold lg:text-[1.7rem]">Outcomes</h3>
              <p className="text-lg font-medium text-[#606a7f] lg:text-2xl">Status distribution</p>
            </div>
          </div>
          <div className="grid grid-cols-1 items-center gap-6 px-6 py-8 lg:grid-cols-[240px_1fr] lg:px-8">
            <div className="mx-auto h-52 w-52 rounded-full bg-[conic-gradient(#12b981_0deg_180deg,#ef4444_180deg_245deg,#f59e0b_245deg_300deg,#6366f1_300deg_360deg)] p-8">
              <div className="h-full w-full rounded-full bg-white" />
            </div>
            <ul className="space-y-2 text-lg lg:text-3xl">
              <li><span className="mr-2 inline-block h-4 w-4 rounded-full bg-[#12b981]" />Success 101</li>
              <li><span className="mr-2 inline-block h-4 w-4 rounded-full bg-[#ef4444]" />Failed 33</li>
              <li><span className="mr-2 inline-block h-4 w-4 rounded-full bg-[#f59e0b]" />Warning 32</li>
              <li><span className="mr-2 inline-block h-4 w-4 rounded-full bg-[#6366f1]" />Processing 34</li>
            </ul>
          </div>
        </article>
      </section>

      <section className="overflow-hidden rounded-3xl bg-white shadow-[0_7px_22px_rgba(10,17,31,0.08)]">
        <div className="flex min-h-24 items-center gap-4 bg-[#f7f1e8] px-6 py-5 lg:px-8">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#ff2f5a] text-white">
            <AlertTriangle className="h-6 w-6" strokeWidth={1.8} />
          </div>
          <div>
            <h3 className="text-2xl font-bold lg:text-[1.7rem]">Most Common Failures</h3>
            <p className="text-lg font-medium text-[#606a7f] lg:text-2xl">Top failing endpoints</p>
          </div>
        </div>
        <div className="grid gap-4 p-6">
          {failures.map((failure) => (
            <div key={failure.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[#fde0e3] text-sm font-bold text-[#ea303f]">{failure.id}</span>
              <span className="text-lg font-medium lg:text-4xl">{failure.endpoint}</span>
              <span className="text-lg text-[#667085] lg:text-3xl">{failure.value}</span>
              <div className="col-start-2 h-2.5 overflow-hidden rounded-full bg-[#e8eaf0]">
                <span className="block h-full bg-[#ff2f45]" style={{ width: failure.width }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {[
          { title: "Incoming Logs", value: "704", total: "1000", level: "Normal", levelClass: "bg-[#dfe4ff] text-[#4f5be7]", width: "70%", bar: "#5f66f4" },
          { title: "Active Workers", value: "18", total: "20", level: "High", levelClass: "bg-[#dff7e8] text-[#129d56]", width: "90%", bar: "#10b981" },
          { title: "Pending Items", value: "2", total: "10", level: "Normal", levelClass: "bg-[#fff2d5] text-[#c47300]", width: "20%", bar: "#f59e0b" },
        ].map((s) => (
          <article key={s.title} className="rounded-3xl bg-white p-5 shadow-[0_8px_24px_rgba(10,17,31,0.09)]">
            <div className="flex items-center justify-between">
              <h4 className="text-2xl text-[#4d586d] lg:text-3xl">{s.title}</h4>
              <span className={`inline-flex h-8 items-center rounded-full px-3 text-sm font-bold lg:text-xl ${s.levelClass}`}>{s.level}</span>
            </div>
            <p className="mt-3 text-5xl font-semibold">{s.value} <span className="text-2xl text-[#99A1B2]">/ {s.total}</span></p>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-[#e6e9ef]"><span className="block h-full" style={{ width: s.width, background: s.bar }} /></div>
          </article>
        ))}
      </section>
    </AdminShell>
  );
}
