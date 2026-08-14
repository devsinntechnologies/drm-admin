import Link from "next/link";
import { ArrowRight, ChefHat, ClipboardList, Crown, LayoutDashboard } from "lucide-react";
import Image from "next/image";
const roles = [
  {
    title: "Super Admin",
    subtitle: "Super-Admin",
    role: "super_admin",
    color: "#001840",
    icon: Crown,
  },
  {
    title: "Business Admin",
    subtitle: "Admin",
    role: "business_admin",
    color: "#002a6e",
    icon: LayoutDashboard,
  },
  {
    title: "John Waiter",
    subtitle: "Waiter",
    role: "waiter",
    color: "#0050F8",
    icon: ClipboardList,
  },
  {
    title: "Chef Mike",
    subtitle: "Kitchen",
    role: "kitchen",
    color: "#001840",
    icon: ChefHat,
  },
];

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="portal-surface w-full max-w-115 rounded-4xl px-6 pb-10 pt-10 sm:px-10">
        <div className="mx-auto grid w-full max-w-[280px] place-items-center">
          <Image
            src="/logo-full.png"
            alt="DigiNizam"
            width={280}
            height={62}
            className="h-auto w-full object-contain"
            priority
          />
        </div>

        <div className="mt-6 text-center">
          {/* <h1 className="text-[2rem] font-semibold tracking-tight text-[#0f172a]">Restaurant Manager</h1> */}
          <p className="mt-2 text-[1.1rem] text-[#5b657a]">Select your role to get started</p>
        </div>

        <div className="mt-10 space-y-3.5">
          {roles.map((role) => {
            const Icon = role.icon;
            const href = `/login?role=${encodeURIComponent(role.role)}&title=${encodeURIComponent(role.title)}&subtitle=${encodeURIComponent(role.subtitle)}`;

            return (
              <Link
                key={role.title}
                href={href}
                className="group flex min-h-21.5 items-center justify-between rounded-xl px-6 text-[#ffffff] transition duration-200 hover:-translate-y-0.5"
                style={{ backgroundColor: role.color }}
              >
                <div className="flex items-center gap-4">
                  <div className="grid h-11 w-11 place-items-center rounded-[14px] bg-white/20">
                    <Icon className="h-6 w-6 text-[#ffffff]" strokeWidth={2.2} />
                  </div>
                  <div>
                    <h2 className="text-[1.2rem] font-semibold leading-tight text-[#ffffff]">{role.title}</h2>
                    <p className="mt-0.5 text-[0.9rem] font-medium text-[#ffffff]/90">{role.subtitle}</p>
                  </div>
                </div>
                <ArrowRight className="h-6 w-6 text-[#ffffff] transition group-hover:translate-x-1" strokeWidth={2} />
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}

