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
    <div className="min-h-screen bg-[#edf0f5] text-[#111827]">
      <header className="flex min-h-[78px] items-center justify-between gap-3 bg-gradient-to-r from-[#4a4bf6] to-[#8c13ff] px-4 py-2 shadow-[0_6px_24px_rgba(77,31,181,0.25)] md:px-8 lg:h-[88px] lg:px-14 lg:py-0">
        <div className="flex min-w-0 items-center gap-3 md:gap-4">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/15 text-cyan-50 md:h-12 md:w-12 lg:h-[60px] lg:w-[60px]">
            <Cloud className="h-6 w-6 lg:h-7 lg:w-7" strokeWidth={1.8} />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold leading-tight text-slate-50 md:text-xl lg:text-2xl">Restaurant Manager</h1>
            <p className="truncate text-xs font-medium leading-tight text-[#d7ddff] md:text-sm lg:text-base">Super Admin • SUPER-ADMIN</p>
          </div>
        </div>
        <Link
          href="/"
          className="inline-flex h-9 shrink-0 items-center gap-2 rounded-xl bg-white/20 px-4 text-sm font-medium !text-white transition hover:bg-white/30 md:h-10 lg:h-[40px] lg:px-4"
        >
          <LogOut className="h-[18px] w-[18px] !text-white" strokeWidth={2} />
          Logout
        </Link>
      </header>


      <main className="px-4 pb-8 pt-5 md:px-8 lg:px-14 lg:pb-11 lg:pt-7">
        <nav className="mb-7 flex gap-2 overflow-x-auto rounded-[28px] bg-[#e9e9ef] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
          {tabs.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <Link
                key={tab.key}
                href={tab.href}
                className={`inline-flex h-11 min-w-[170px] items-center justify-center gap-3 rounded-full px-5 text-sm font-semibold transition lg:h-[46px] lg:min-w-[240px] lg:text-[0.98rem] ${
                  active
                    ? "bg-white text-[#161c2d] shadow-[0_3px_12px_rgba(16,24,40,0.1)]"
                    : "text-[#202635]"
                }`}
              >
                {tab.icon}
                {tab.label}
              </Link>
            );
          })}
        </nav>
        {children}
      </main>
    </div>
  );
}
