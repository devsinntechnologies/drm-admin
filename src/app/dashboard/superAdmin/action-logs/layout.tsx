"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Loading from "@/components/common/Loading";
import AdminShell from "@/components/admin/AdminShell";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Activity, AlertTriangle, BarChart3, Check, ChevronDown, RefreshCw } from "lucide-react";

const tabs = [
  { href: "/dashboard/superAdmin/action-logs/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/dashboard/superAdmin/action-logs", label: "Activity Log", icon: Activity },
  { href: "/dashboard/superAdmin/action-logs/issues-failures", label: "Issues & Failures", icon: AlertTriangle },
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
    <Suspense fallback={<Loading fullScreen />}>
      <AdminShell activeTab="action-logs">
        <div className="mb-6 flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
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

        <section className="dn-tab-bar mb-5 lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = pathname === tab.href;

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  data-active={active ? "true" : "false"}
                  className="dn-tab"
                >
                  <Icon className="h-5 w-5" strokeWidth={2.1} />
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </div>

          <span className="pr-2 text-sm font-semibold text-[#a0abc0] lg:text-[0.98rem]">Updated 11:25:47 PM</span>
        </section>

        {children}
      </AdminShell>
    </Suspense>
  );
}
