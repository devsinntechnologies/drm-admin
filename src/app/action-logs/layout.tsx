"use client";

import AdminShell from "@/components/admin/AdminShell";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Activity, AlertTriangle, BarChart3, Check, ChevronDown, RefreshCw } from "lucide-react";

const tabs = [
  { href: "/action-logs/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/action-logs", label: "Activity Log", icon: Activity },
  { href: "/action-logs/issues-failures", label: "Issues & Failures", icon: AlertTriangle },
];

const businesses = [
  "All Businesses",
  "The Golden Spoon",
  "Pasta Palace",
  "Burger Haven",
  "Sushi World",
  "Taco Fiesta",
];

export default function ActionLogsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [selectedBusiness, setSelectedBusiness] = useState("All Businesses");
  const [menuOpen, setMenuOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleRefresh() {
    setRefreshing(true);
    router.refresh();
    window.setTimeout(() => setRefreshing(false), 500);
  }

  return (
    <AdminShell activeTab="action-logs">
      <section className="mx-auto mb-6 flex max-w-7xl flex-col gap-4 rounded-3xl border border-white bg-[linear-gradient(120deg,rgba(255,255,255,0.9),rgba(236,253,245,0.76))] px-5 py-5 shadow-[0_12px_28px_rgba(15,23,42,0.1)] lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="grid h-14.5 w-14.5 shrink-0 place-items-center rounded-2xl bg-linear-to-br from-[#0f172a] to-[#1E365B] text-white shadow-[0_10px_20px_rgba(15,23,42,0.24)]">
            <Activity className="h-7 w-7" strokeWidth={1.9} />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-[1.65rem] font-semibold leading-tight text-[#181d2c] sm:text-[1.85rem]">Action Logs</h2>
            <p className="truncate text-[0.92rem] text-[#6c7890] sm:text-[0.98rem]">Monitor system activity across businesses</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="inline-flex h-12.5 min-w-63 items-center justify-between gap-4 rounded-2xl border border-[#dce6f0] bg-[#f8fbff] px-5 text-[0.94rem] font-medium text-[#202635] transition hover:bg-white"
            >
              {selectedBusiness}
              <ChevronDown className={`h-5 w-5 text-[#a0a8ba] transition ${menuOpen ? "rotate-180" : ""}`} />
            </button>

            {menuOpen ? (
              <div className="absolute right-0 top-14.5 z-20 w-full overflow-hidden rounded-2xl border border-[#e5e7ef] bg-white shadow-[0_12px_24px_rgba(15,23,42,0.14)]">
                {businesses.map((business) => {
                  const selected = selectedBusiness === business;

                  return (
                    <button
                      key={business}
                      type="button"
                      onClick={() => {
                        setSelectedBusiness(business);
                        setMenuOpen(false);
                      }}
                      className="flex w-full items-center justify-between px-5 py-4 text-left text-[0.96rem] text-[#202635] transition hover:bg-[#f8f9fc]"
                    >
                      <span>{business}</span>
                      {selected ? <Check className="h-5 w-5 text-[#6b7280]" /> : null}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex h-12.5 items-center gap-3 rounded-2xl border border-[#d8dde8] bg-white px-5 text-[0.94rem] font-semibold text-[#171d2e] transition hover:bg-[#f0f9ff]"
          >
            <RefreshCw className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`} strokeWidth={2} />
            Refresh
          </button>
        </div>
      </section>

      <section className="mx-auto mb-5 flex max-w-7xl flex-col gap-4 rounded-3xl border border-[#e2e8f0] bg-white/85 px-3 py-3 shadow-[0_10px_24px_rgba(10,17,31,0.09)] lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = pathname === tab.href;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`inline-flex h-13 items-center gap-3 rounded-[18px] px-5 text-[0.98rem] font-semibold transition ${
                  active
                    ? "bg-linear-to-r from-[#0f172a] to-[#1E365B] text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.18),0_10px_20px_rgba(15,23,42,0.24)]"
                    : "text-[#202635]"
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? "text-white" : "text-[#4d5a6f]"}`} strokeWidth={2.1} />
                <span className={active ? "text-white" : ""}>{tab.label}</span>
              </Link>
            );
          })}
        </div>

        <span className="pr-2 text-sm font-semibold text-[#a0abc0] lg:text-[0.98rem]">Updated 11:25:47 PM</span>
      </section>

      {children}
    </AdminShell>
  );
}
