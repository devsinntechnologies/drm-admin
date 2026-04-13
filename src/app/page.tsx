import Link from "next/link";
import { ArrowRight, ChefHat, ClipboardList, Crown, LayoutDashboard } from "lucide-react";

const roles = [
  {
    title: "Super Admin",
    subtitle: "Super-Admin",
    href: "/login",
    gradient: "from-[#ffbf00] via-[#ff8a00] to-[#ff5b00]",
    icon: Crown,
    active: true,
  },
  {
    title: "Admin User",
    subtitle: "Admin",
    href: "#",
    gradient: "from-[#5860f5] via-[#7b45f4] to-[#b610f1]",
    icon: LayoutDashboard,
    active: false,
  },
  {
    title: "John Waiter",
    subtitle: "Waiter",
    href: "#",
    gradient: "from-[#3291ff] via-[#4769f3] to-[#563ff1]",
    icon: ClipboardList,
    active: false,
  },
  {
    title: "Chef Mike",
    subtitle: "Kitchen",
    href: "#",
    gradient: "from-[#b13ef2] via-[#d536ca] to-[#ef0079]",
    icon: ChefHat,
    active: false,
  },
];

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#eef2ff_0%,_#f6f7ff_52%,_#f3f4ff_100%)] px-4 py-10">
      <section className="w-full max-w-[640px] rounded-[34px] bg-white px-6 pb-8 pt-10 shadow-[0_30px_70px_rgba(68,76,122,0.16)] sm:px-10">
        <div className="mx-auto grid h-[116px] w-[116px] place-items-center rounded-full bg-gradient-to-br from-[#5960f5] to-[#9624f6] text-white shadow-[0_18px_36px_rgba(116,76,241,0.3)]">
          <ChefHat className="h-14 w-14" strokeWidth={2.2} />
        </div>

        <div className="mt-8 text-center">
          <h1 className="text-[2.2rem] font-semibold tracking-[-0.03em] text-[#623ff2] sm:text-[3rem]">Restaurant Manager</h1>
          <p className="mt-3 text-lg text-[#72778d] sm:text-[1.8rem]">Select your role to get started</p>
        </div>

        <div className="mt-12 space-y-4">
          {roles.map((role) => {
            const Icon = role.icon;

            return role.active ? (
              <Link
                key={role.title}
                href={role.href}
                className={`group flex min-h-[94px] items-center justify-between rounded-[20px] bg-gradient-to-r ${role.gradient} px-5 text-white shadow-[0_14px_28px_rgba(85,73,233,0.18)] transition duration-200 hover:scale-[1.02] hover:shadow-[0_22px_38px_rgba(85,73,233,0.25)]`}
              >
                <div className="flex items-center gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10">
                    <Icon className="h-7 w-7" strokeWidth={2.2} />
                  </div>
                  <div>
                    <h2 className="text-[1.7rem] font-semibold leading-tight">{role.title}</h2>
                    <p className="text-[1.15rem] font-medium text-white/90">{role.subtitle}</p>
                  </div>
                </div>
                <ArrowRight className="h-9 w-9 transition group-hover:translate-x-1" strokeWidth={2.1} />
              </Link>
            ) : (
              <div
                key={role.title}
                className={`group flex min-h-[94px] items-center justify-between rounded-[20px] bg-gradient-to-r ${role.gradient} px-5 text-white/95 shadow-[0_14px_28px_rgba(85,73,233,0.12)] transition duration-200 hover:scale-[1.01]`}
              >
                <div className="flex items-center gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10">
                    <Icon className="h-7 w-7" strokeWidth={2.2} />
                  </div>
                  <div>
                    <h2 className="text-[1.7rem] font-semibold leading-tight">{role.title}</h2>
                    <p className="text-[1.15rem] font-medium text-white/90">{role.subtitle}</p>
                  </div>
                </div>
                <ArrowRight className="h-9 w-9 opacity-90" strokeWidth={2.1} />
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
