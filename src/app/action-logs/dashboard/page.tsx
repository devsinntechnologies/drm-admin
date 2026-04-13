import { AlertTriangle, LineChart, PieChart } from "lucide-react";

const failures = [
  { id: 1, endpoint: "POST /api/auth/refresh", value: "4 (15%)", width: "15%" },
  { id: 2, endpoint: "GET /api/payments", value: "3 (11%)", width: "11%" },
  { id: 3, endpoint: "DELETE /api/products/:id", value: "2 (7%)", width: "7%" },
  { id: 4, endpoint: "POST /api/orders", value: "2 (7%)", width: "7%" },
  { id: 5, endpoint: "PUT /api/users/:id", value: "2 (7%)", width: "7%" },
];

const yAxis = ["200", "150", "100", "50", "0"];
const xAxis = [
  "12:25 AM",
  "02:25 AM",
  "04:25 AM",
  "06:25 AM",
  "08:25 AM",
  "10:25 AM",
  "12:25 PM",
  "02:25 PM",
  "04:25 PM",
  "06:25 PM",
  "08:25 PM",
  "11:25 PM",
];

export default function ActionLogsDashboardPage() {
  return (
    <>
      <section className="mx-auto mb-4 grid max-w-[1280px] grid-cols-1 gap-4 xl:grid-cols-2">
        <article className="rounded-2xl border border-[#ffb4b9] bg-[#fff2f3] px-4 py-3 text-[#ef2231]">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="h-4 w-4" /> High failure rate
          </div>
          <p className="mt-1 text-xs">13.5% of requests are failing, above the 10% threshold</p>
        </article>
        <article className="rounded-2xl border border-[#f1ca72] bg-[#fff9e8] px-4 py-3 text-[#d26b00]">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="h-4 w-4" /> Slow responses
          </div>
          <p className="mt-1 text-xs">11 requests took over 2 seconds</p>
        </article>
      </section>

      <section className="mx-auto mb-5 grid max-w-[1280px] grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { title: "Total Requests", value: "200", sub: "All Businesses", bg: "from-[#9041f8] to-[#5052f8]", icon: "⚡" },
          { title: "Failure Rate", value: "13.5%", sub: "27 failed requests", bg: "from-[#ff2f5a] to-[#ec007c]", icon: "⚠" },
          { title: "Active Users", value: "6", sub: "Unique users", bg: "from-[#2f88f1] to-[#1490c7]", icon: "👥" },
          { title: "Avg Response", value: "600ms", sub: "Average execution time", bg: "from-[#06c364] to-[#05a765]", icon: "⏱" },
        ].map((item) => (
          <article key={item.title} className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${item.bg} p-4 text-white shadow-[0_10px_22px_rgba(28,48,94,0.18)]`}>
            <div className="absolute right-4 top-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 text-lg">
              {item.icon}
            </div>
            <h4 className="text-sm font-medium">{item.title}</h4>
            <p className="mt-4 text-3xl font-semibold leading-none">{item.value}</p>
            <p className="mt-2 text-xs text-white/90">{item.sub}</p>
          </article>
        ))}
      </section>

      <section className="mx-auto mb-5 grid max-w-[1280px] grid-cols-1 gap-5 xl:grid-cols-[1.8fr_1fr]">
        <article className="overflow-hidden rounded-[32px] bg-white shadow-[0_10px_30px_rgba(10,17,31,0.1)]">
          <div className="flex min-h-[86px] items-center gap-4 border-b border-[#dfe4ee] bg-gradient-to-r from-[#eef2ff] to-[#fff4f8] px-7 py-6">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-[#5b62f5] to-[#7a43f4] text-white shadow-[0_12px_24px_rgba(91,98,245,0.25)]">
              <LineChart className="h-6 w-6" strokeWidth={1.8} />
            </div>
            <div>
              <h3 className="text-[1.1rem] font-bold text-[#1a2030]">Request Activity</h3>
              <p className="text-[0.95rem] text-[#6b7280]">Last 24 hours</p>
            </div>
          </div>

          <div className="px-5 pb-8 pt-7 sm:px-7">
            <div className="grid grid-cols-[48px_1fr] gap-3">
              <div className="flex h-[320px] flex-col justify-between pb-8 text-right text-[0.85rem] text-[#94a3b8]">
                {yAxis.map((value) => (
                  <span key={value}>{value}</span>
                ))}
              </div>

              <div>
                <div className="relative h-[320px] overflow-hidden">
                  <div className="absolute inset-0 grid grid-cols-12 grid-rows-4">
                    {Array.from({ length: 48 }).map((_, index) => (
                      <div key={index} className="border border-dashed border-[#d8e0ee] odd:border-r-0 odd:border-t-0 even:border-l-0 even:border-b-0" />
                    ))}
                  </div>

                  <div className="absolute inset-y-0 left-0 w-px bg-[#aab5c9]" />
                  <div className="absolute bottom-0 left-0 right-0 h-px bg-[#aab5c9]" />

                  <svg viewBox="0 0 1000 320" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
                    <path d="M0 131 C30 55, 60 0, 90 55 S150 160, 180 119 S240 0, 270 119 S330 85, 360 177 S420 37, 450 68 S510 293, 540 174 S600 169, 630 161 S690 90, 720 119 S780 0, 810 66 S870 170, 900 128 S960 34, 1000 238" fill="none" stroke="#6366f1" strokeWidth="4" strokeLinecap="round" />
                    <path d="M0 157 C30 85, 60 34, 90 85 S150 174, 180 96 S240 187, 270 140 S330 110, 360 221 S420 94, 450 89 S510 310, 540 191 S600 204, 630 191 S690 123, 720 132 S780 47, 810 93 S870 196, 900 149 S960 110, 1000 251" fill="none" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />
                    <path d="M0 304 C30 272, 60 272, 90 289 S150 323, 180 289 S240 300, 270 289 S330 326, 360 289 S420 308, 450 315 S510 321, 540 308 S600 293, 630 300 S690 332, 720 289 S780 308, 810 306 S870 310, 900 319 S960 291, 1000 311" fill="none" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                </div>

                <div className="mt-3 grid grid-cols-6 gap-x-3 gap-y-2 text-center text-[0.8rem] text-[#94a3b8] sm:grid-cols-12">
                  {xAxis.map((time) => (
                    <span key={time}>{time}</span>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-[0.95rem] font-medium">
                  <span className="text-[#6366f1]">◦ All</span>
                  <span className="text-[#10b981]">◦ Success</span>
                  <span className="text-[#ef4444]">◦ Failed</span>
                </div>
              </div>
            </div>
          </div>
        </article>

        <article className="overflow-hidden rounded-[32px] bg-white shadow-[0_10px_30px_rgba(10,17,31,0.1)]">
          <div className="flex min-h-[86px] items-center gap-4 border-b border-[#eadff0] bg-gradient-to-r from-[#f5ecff] to-[#fff0f5] px-7 py-6">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-[#8d3cf2] to-[#c13ef0] text-white shadow-[0_12px_24px_rgba(157,61,241,0.24)]">
              <PieChart className="h-6 w-6" strokeWidth={1.8} />
            </div>
            <div>
              <h3 className="text-[1.1rem] font-bold text-[#1a2030]">Outcomes</h3>
              <p className="text-[0.95rem] text-[#6b7280]">Status distribution</p>
            </div>
          </div>

          <div className="px-7 py-8">
            <div className="flex flex-col items-center">
              <div className="h-[220px] w-[220px] rounded-full bg-[conic-gradient(#1db985_0deg_190deg,#f54040_190deg_262deg,#f59e0b_262deg_318deg,#5f63ea_318deg_360deg)] p-9">
                <div className="h-full w-full rounded-full bg-white" />
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-[0.95rem] font-medium text-[#475467]">
                <span className="inline-flex items-center gap-2"><span className="h-4 w-4 rounded-full bg-[#1db985]" />Success 110</span>
                <span className="inline-flex items-center gap-2"><span className="h-4 w-4 rounded-full bg-[#f54040]" />Failed 36</span>
                <span className="inline-flex items-center gap-2"><span className="h-4 w-4 rounded-full bg-[#f59e0b]" />Warning 28</span>
                <span className="inline-flex items-center gap-2"><span className="h-4 w-4 rounded-full bg-[#5f63ea]" />Processing 26</span>
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="mx-auto mb-5 max-w-[1280px] overflow-hidden rounded-3xl bg-white shadow-[0_7px_22px_rgba(10,17,31,0.08)]">
        <div className="flex min-h-16 items-center gap-3 bg-[#fff2f3] px-6 py-4">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#ff2f5a] text-white">
            <AlertTriangle className="h-5 w-5" strokeWidth={1.8} />
          </div>
          <div>
            <h3 className="text-base font-bold">Most Common Failures</h3>
            <p className="text-xs text-[#606a7f]">Top failing endpoints</p>
          </div>
        </div>
        <div className="grid gap-4 p-6">
          {failures.map((failure) => (
            <div key={failure.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-[#fde0e3] text-xs font-bold text-[#ea303f]">{failure.id}</span>
              <span className="text-sm font-medium">{failure.endpoint}</span>
              <span className="text-xs text-[#667085]">{failure.value}</span>
              <div className="col-start-2 h-2 overflow-hidden rounded-full bg-[#e8eaf0]">
                <span className="block h-full bg-[#ff2f45]" style={{ width: failure.width }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-[1280px] grid-cols-1 gap-4 lg:grid-cols-3">
        {[
          { title: "Incoming Logs", value: "517", total: "1000", level: "Normal", levelClass: "bg-[#dfe4ff] text-[#4f5be7]", width: "52%", bar: "#5f66f4" },
          { title: "Active Workers", value: "16", total: "20", level: "High", levelClass: "bg-[#dff7e8] text-[#129d56]", width: "80%", bar: "#10b981" },
          { title: "Pending Items", value: "1", total: "10", level: "Normal", levelClass: "bg-[#fff2d5] text-[#c47300]", width: "10%", bar: "#f59e0b" },
        ].map((s) => (
          <article key={s.title} className="rounded-3xl bg-white p-4 shadow-[0_8px_24px_rgba(10,17,31,0.09)]">
            <div className="flex items-center justify-between">
              <h4 className="text-sm text-[#4d586d]">{s.title}</h4>
              <span className={`inline-flex h-7 items-center rounded-full px-3 text-xs font-bold ${s.levelClass}`}>{s.level}</span>
            </div>
            <p className="mt-2 text-2xl font-semibold">{s.value} <span className="text-xs text-[#99A1B2]">/ {s.total}</span></p>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#e6e9ef]"><span className="block h-full" style={{ width: s.width, background: s.bar }} /></div>
          </article>
        ))}
      </section>
    </>
  );
}
