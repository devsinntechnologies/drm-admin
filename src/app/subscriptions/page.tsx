import Image from "next/image";
import { ChevronDown, CreditCard } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";

const rows = [
  {
    name: "The Golden Spoon",
    owner: "John Smith",
    image: "/business/pic1.jpeg",
    plan: "Enterprise",
    status: "Active",
    expires: "365 days",
    revenue: "$125.0K",
  },
  {
    name: "Pasta Palace",
    owner: "Maria Rossi",
    image: "/business/pic2.jpeg",
    plan: "Premium",
    status: "Active",
    expires: "183 days",
    revenue: "$89.0K",
  },
  {
    name: "Burger Haven",
    owner: "Mike Johnson",
    image: "/business/pic3.jpeg",
    plan: "Basic",
    status: "Active",
    expires: "92 days",
    revenue: "$45.0K",
  },
  {
    name: "Sushi World",
    owner: "Kenji Tanaka",
    image: "/business/pic4.jpeg",
    plan: "Premium",
    status: "Expired",
    expires: "Expired",
    revenue: "$67.0K",
  },
  {
    name: "Taco Fiesta",
    owner: "Carlos Rodriguez",
    image: "/business/pic5.jpeg",
    plan: "Basic",
    status: "Inactive",
    expires: "60 days",
    revenue: "$32.0K",
  },
];

export default function SubscriptionsPage() {
  return (
    <AdminShell activeTab="subscriptions">
      <section className="mx-auto mb-5 flex max-w-[1180px] items-center gap-4 rounded-3xl bg-white px-6 py-5 shadow-[0_8px_28px_rgba(7,16,34,0.09)]">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#9d3df1] text-white">
          <CreditCard className="h-6 w-6" strokeWidth={1.8} />
        </div>
        <div>
          <h2 className="text-lg font-semibold lg:text-2xl">Subscription Management</h2>
          <p className="text-sm text-[#657084] lg:text-base">Manage plans and billing</p>
        </div>
      </section>

      <div className="mx-auto max-w-[1180px] overflow-x-auto rounded-3xl bg-white shadow-[0_8px_24px_rgba(10,17,31,0.1)]">
        <table className="w-full min-w-[980px] border-collapse">
          <thead>
            <tr className="border-b border-[#e2e5ee] text-left text-sm">
              {[
                "Business",
                "Current Plan",
                "Status",
                "Expires In",
                "Revenue",
                "Actions",
              ].map((label) => (
                <th key={label} className="px-4 py-4 font-semibold text-[#111827]">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.name} className="border-b border-[#e8eaf0] text-sm">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 overflow-hidden rounded-xl bg-[#d7dbe4]">
                      <Image src={row.image} alt={row.name} width={48} height={48} className="h-full w-full object-cover" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#111827]">{row.name}</p>
                      <p className="text-xs text-[#677085]">{row.owner}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className="inline-flex h-10 min-w-[140px] items-center justify-between rounded-xl bg-[#f0f1f5] px-4">
                    {row.plan} <ChevronDown className="h-4 w-4" />
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className="inline-flex h-10 min-w-[140px] items-center justify-between rounded-xl bg-[#f0f1f5] px-4">
                    {row.status} <ChevronDown className="h-4 w-4" />
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className={`inline-flex h-8 items-center rounded-full px-3 text-xs font-bold text-white ${row.expires === "Expired" ? "bg-[#ff3749]" : "bg-[#0bc35a]"}`}>
                    {row.expires}
                  </span>
                </td>
                <td className="px-4 py-4 font-semibold text-[#06ab54]">{row.revenue}</td>
                <td className="px-4 py-4">
                  <div className="inline-flex gap-2">
                    {["+3M", "+6M", "+12M"].map((btn) => (
                      <button key={btn} type="button" className="h-9 min-w-[64px] rounded-xl border-2 border-[#d8dce4] px-3 text-xs font-semibold">
                        {btn}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
