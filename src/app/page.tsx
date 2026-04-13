import Link from "next/link";
import { ArrowRight, ChefHat, ClipboardList, Crown, LayoutDashboard } from "lucide-react";

const roles = [
  {
    title: "Super Admin",
    subtitle: "Super-Admin",
    href: "/login",
    gradient: "from-[#ffb400] to-[#ff6200]",
    icon: Crown,
    active: true,
  },
  {
    title: "Admin User",
    subtitle: "Admin",
    href: "#",
    gradient: "from-[#a855f7] to-[#7e22ce]",
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
    gradient: "from-[#d946ef] to-[#c026d3]",
    icon: ChefHat,
    active: false,
  },
];

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f9fc] px-4 py-10">
      <section className="w-full max-w-[460px] rounded-[32px] bg-white px-6 pb-10 pt-10 shadow-[0_20px_60px_rgba(0,0,0,0.05)] sm:px-10">
        <div className="mx-auto grid h-[100px] w-[100px] place-items-center rounded-full bg-gradient-to-br from-[#7b46f4] to-[#a230ed] text-white shadow-[0_12px_24px_rgba(116,76,241,0.25)]">
          <ChefHat className="h-12 w-12" strokeWidth={2} />
        </div>

        <div className="mt-6 text-center">
          <h1 className="text-[2rem] font-semibold tracking-tight text-[#6a35ff]">Restaurant Manager</h1>
          <p className="mt-2 text-[1.1rem] text-[#6b7280]">Select your role to get started</p>
        </div>

        <div className="mt-10 space-y-3.5">
          {roles.map((role) => {
            const Icon = role.icon;

            return (
              <Link
                key={role.title}
                href={role.href}
                className={`group flex min-h-[86px] items-center justify-between rounded-[24px] bg-gradient-to-r ${role.gradient} px-6 text-white shadow-md transition duration-200 hover:scale-[1.02] hover:shadow-lg`}
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

