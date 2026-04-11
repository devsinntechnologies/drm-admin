import Link from "next/link";
import { Building2, Cloud, CreditCard, LayoutDashboard, LogOut } from "lucide-react";

type TabKey = "dashboard" | "businesses" | "subscriptions" | "action-logs";

type AdminShellProps = {
  activeTab: TabKey;
  children: React.ReactNode;
};

const tabs: Array<{ key: TabKey; label: string; href: string; icon: React.ReactNode }> = [
  {
    key: "dashboard",
    label: "Dashboard",
    href: "/",
    icon: <LayoutDashboard className="h-5 w-5" />,
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
        <button
          type="button"
          className="inline-flex h-9 shrink-0 items-center gap-2 rounded-xl bg-white/15 px-4 text-sm font-semibold text-slate-50 md:h-10 md:text-base lg:h-[44px] lg:rounded-2xl lg:px-5 lg:text-base"
        >
          <LogOut className="h-4 w-4 lg:h-6 lg:w-6" strokeWidth={2} />
          Logout
        </button>
      </header>

      <main className="px-4 pb-8 pt-5 md:px-8 lg:px-14 lg:pb-11 lg:pt-7">
        <nav className="mb-6 flex gap-2 overflow-x-auto rounded-2xl bg-[#e6e6eb] p-1.5">
          {tabs.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <Link
                key={tab.key}
                href={tab.href}
                className={`inline-flex h-10 min-w-[150px] items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition lg:h-[46px] lg:min-w-[200px] lg:text-base ${
                  active
                    ? "bg-white shadow-[0_2px_10px_rgba(16,24,40,0.12)]"
                    : "text-[#2b2f3a]"
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
