import Link from "next/link";
import { ArrowRight, ChefHat, ClipboardList, Crown, LayoutDashboard } from "lucide-react";

const roles = [
  {
    title: "Super Admin",
    subtitle: "Super-Admin",
    href: "/login",
    gradient: "from-[#f59e0b] to-[#ea580c]",
    icon: Crown,
    active: true,
  },
  {
    title: "Admin User",
    subtitle: "Admin",
    href: "#",
    gradient: "from-[#0f766e] to-[#0ea5a4]",
    icon: LayoutDashboard,
    active: false,
  },
  {
    title: "John Waiter",
    subtitle: "Waiter",
    href: "#",
    gradient: "from-[#3b82f6] to-[#2563eb]",
    icon: ClipboardList,
    active: false,
  },
  {
    title: "Chef Mike",
    subtitle: "Kitchen",
    href: "#",
    gradient: "from-[#1d4ed8] to-[#0ea5e9]",
    icon: ChefHat,
    active: false,
  },
];

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="portal-surface w-full max-w-115 rounded-4xl px-6 pb-10 pt-10 sm:px-10">
        <div className="mx-auto grid h-25 w-25 place-items-center rounded-full bg-linear-to-br from-[#0f172a] to-[#0f766e] text-white shadow-[0_16px_30px_rgba(15,23,42,0.32)]">
          <ChefHat className="h-12 w-12" strokeWidth={2} />
        </div>

        <div className="mt-6 text-center">
          <h1 className="text-[2rem] font-semibold tracking-tight text-[#0f172a]">Restaurant Manager</h1>
          <p className="mt-2 text-[1.1rem] text-[#5b657a]">Select your role to get started</p>
        </div>

        <div className="mt-10 space-y-3.5">
          {roles.map((role) => {
            const Icon = role.icon;

            return (
              <Link
                key={role.title}
                href={role.href}
                className={`group flex min-h-21.5 items-center justify-between rounded-3xl bg-linear-to-r ${role.gradient} px-6 text-white shadow-[0_12px_20px_rgba(15,23,42,0.22)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_28px_rgba(15,23,42,0.26)]`}
              >
                <div className="flex items-center gap-4">
                  <div className="grid h-11 w-11 place-items-center rounded-[14px] bg-white/20">
                    <Icon className="h-6 w-6 text-white" strokeWidth={2.2} />
                  </div>
                  <div>
                    <h2 className="text-[1.2rem] font-semibold leading-tight text-white">{role.title}</h2>
                    <p className="mt-0.5 text-[0.9rem] font-medium text-white/90">{role.subtitle}</p>
                  </div>
                </div>
                <ArrowRight className="h-6 w-6 text-white transition group-hover:translate-x-1" strokeWidth={2} />
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}

