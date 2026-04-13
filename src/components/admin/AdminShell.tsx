import Link from "next/link";
import { Activity, Building2, Cloud, Crown, CreditCard, LogOut } from "lucide-react";

type TabKey = "dashboard" | "businesses" | "subscriptions" | "action-logs";

type AdminShellProps = {
  activeTab: TabKey;
  children: React.ReactNode;
};

const tabs: Array<{ key: TabKey; label: string; href: string; icon: React.ReactNode }> = [
  {
    key: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    icon: <Crown className="h-5 w-5" />,
  },
  {
    key: "businesses",
    label: "Businesses",
    href: "/businesses",
    icon: <Building2 className="h-5 w-5" />,
  },
  {
    key: "subscriptions",
    label: "Subscriptions",
    href: "/subscriptions",
    icon: <CreditCard className="h-5 w-5" />,
  },
  {
    key: "action-logs",
    label: "Action Logs",
    href: "/action-logs",
    icon: <Activity className="h-5 w-5" />,
  },
];

export default function AdminShell({ activeTab, children }: AdminShellProps) {
  return (
    <div className="min-h-screen ">
      <header className="relative overflow-hidden border-b border-[#dbe4ef] bg-[#f8fbff] px-4 py-4 md:px-8 lg:px-14">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_90%_0%,rgba(14,165,233,0.14),transparent_38%),radial-gradient(circle_at_0%_100%,rgba(15,118,110,0.12),transparent_42%)]" />
        <div className="relative mx-auto flex w-full max-w-7xl items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3 md:gap-4">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(145deg,#0f172a,#155e75)] text-cyan-50 shadow-[0_12px_24px_rgba(15,23,42,0.28)] md:h-12 md:w-12 lg:h-14 lg:w-14">
              <Cloud className="h-6 w-6" strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold leading-tight text-[#0f172a] md:text-xl lg:text-2xl">Restaurant Manager</h1>
              <p className="truncate text-xs font-medium leading-tight text-[#58657a] md:text-sm">Super Admin Portal</p>
            </div>
          </div>
          <Link
            href="/"
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border border-[#cfd9e6] bg-white px-4 text-sm font-semibold text-[#0f172a] shadow-[0_8px_16px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:bg-[#f4f8fc]"
          >
            <LogOut className="h-4.5 w-4.5" strokeWidth={2} />
            Logout
          </Link>
        </div>
      </header>


      <main className="px-4 pb-8 pt-6 md:px-8 lg:px-14 lg:pb-11">
        <nav className="mx-auto mb-8 flex w-full max-w-7xl gap-2 overflow-x-auto rounded-3xl border border-white bg-[rgba(255,255,255,0.85)] p-2 shadow-[0_16px_32px_rgba(15,23,42,0.08)] backdrop-blur-sm">
          {tabs.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <Link
                key={tab.key}
                href={tab.href}
                className={`inline-flex h-11 min-w-42 items-center justify-center gap-3 rounded-2xl px-5 text-sm font-semibold transition lg:min-w-56 ${
                  active
                   ? "bg-linear-to-r from-[#0f172a] to-[#0f766e] text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.18),0_10px_20px_rgba(15,23,42,0.24)]"
                    : "text-[#202635]"
                }`}
              >
                <span className={active ? "text-white" : "text-[#202635]"}>{tab.icon}</span>
                <span className={active ? "text-white" : "text-[#202635]"}>{tab.label}</span>
              </Link>
            );
          })}
        </nav>
        {children}
      </main>
    </div>
  );
}
