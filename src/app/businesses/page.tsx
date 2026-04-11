"use client";

import Image from "next/image";
import {
  Building2,
  ChevronDown,
  Mail,
  MapPin,
  Phone,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { useMemo, useState } from "react";

type BusinessItem = {
  name: string;
  owner: string;
  email: string;
  phone: string;
  address: string;
  revenue: string;
  orders: string;
  users: string;
  active: boolean;
  status: "Active" | "Inactive" | "Expired";
  plan: "Enterprise" | "Premium" | "Basic";
  background: string;
  thumb: string;
};

const businesses: BusinessItem[] = [
  {
    name: "The Golden Spoon",
    owner: "John Smith",
    email: "john@goldenspoon.com",
    phone: "+1234567890",
    address: "123 Main St, New York, NY 10001",
    revenue: "$125K",
    orders: "1250",
    users: "12",
    active: true,
    status: "Active",
    plan: "Enterprise",
    background: "/business/pic1.jpeg",
    thumb: "/business/pic1.jpeg",
  },
  {
    name: "Pasta Palace",
    owner: "Maria Rossi",
    email: "maria@pastapalace.com",
    phone: "+1234567891",
    address: "456 Italian Ave, Chicago, IL 60601",
    revenue: "$89K",
    orders: "890",
    users: "8",
    active: true,
    status: "Active",
    plan: "Premium",
    background: "/business/pic2.jpeg",
    thumb: "/business/pic2.jpeg",
  },
  {
    name: "Burger Haven",
    owner: "Mike Johnson",
    email: "mike@burgerhaven.com",
    phone: "+1234567892",
    address: "789 Burger Blvd, Los Angeles, CA 90001",
    revenue: "$45K",
    orders: "650",
    users: "5",
    active: true,
    status: "Active",
    plan: "Basic",
    background: "/business/pic3.jpeg",
    thumb: "/business/pic3.jpeg",
  },
  {
    name: "Sushi World",
    owner: "Kenji Tanaka",
    email: "kenji@sushiworld.com",
    phone: "+1234567893",
    address: "321 Ocean Dr, Miami, FL 33139",
    revenue: "$67K",
    orders: "520",
    users: "6",
    active: false,
    status: "Expired",
    plan: "Premium",
    background: "/business/pic4.jpeg",
    thumb: "/business/pic4.jpeg",
  },
  {
    name: "Taco Fiesta",
    owner: "Carlos Rodriguez",
    email: "carlos@tacofiesta.com",
    phone: "+1234567894",
    address: "555 Salsa St, Austin, TX 78701",
    revenue: "$32K",
    orders: "380",
    users: "4",
    active: false,
    status: "Inactive",
    plan: "Basic",
    background: "/business/pic5.jpeg",
    thumb: "/business/pic5.jpeg",
  },
];

const planColor: Record<BusinessItem["plan"], string> = {
  Enterprise: "bg-[#ff8a00]",
  Premium: "bg-[#9c47f5]",
  Basic: "bg-[#3788f8]",
};

export default function BusinessesPage() {
  const [statusOpen, setStatusOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"All Status" | BusinessItem["status"]>("All Status");
  const [planFilter, setPlanFilter] = useState<"All Plans" | BusinessItem["plan"]>("All Plans");

  const filteredBusinesses = useMemo(() => {
    return businesses.filter((item) => {
      const statusOk = statusFilter === "All Status" ? true : item.status === statusFilter;
      const planOk = planFilter === "All Plans" ? true : item.plan === planFilter;
      return statusOk && planOk;
    });
  }, [statusFilter, planFilter]);

  const scrollToFirstMatch = (nextStatus: typeof statusFilter, nextPlan: typeof planFilter) => {
    const target = businesses.find((item) => {
      const statusOk = nextStatus === "All Status" ? true : item.status === nextStatus;
      const planOk = nextPlan === "All Plans" ? true : item.plan === nextPlan;
      return statusOk && planOk;
    });
    if (target) {
      const el = document.getElementById(`business-${target.name.replace(/\s+/g, "-").toLowerCase()}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <AdminShell activeTab="businesses">
      <section className="mx-auto mb-5 flex max-w-[1180px] items-center justify-between gap-4 rounded-3xl bg-white px-6 py-5 shadow-[0_8px_28px_rgba(7,16,34,0.09)]">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#5b62f5] text-white">
            <Building2 className="h-6 w-6" strokeWidth={1.8} />
          </div>
          <div>
            <h2 className="text-lg font-semibold lg:text-2xl">Business Management</h2>
            <p className="text-sm text-[#657084] lg:text-base">5 businesses</p>
          </div>
        </div>
        <button type="button" className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-[#5e5df2] to-[#8f20f5] px-5 text-sm font-semibold text-white">
          <Plus className="h-4 w-4" />
          Add Business
        </button>
      </section>

      <section className="mx-auto mb-5 grid max-w-[1180px] grid-cols-1 gap-3 rounded-3xl bg-white p-4 shadow-[0_8px_28px_rgba(7,16,34,0.09)] lg:grid-cols-3">
        <div className="flex h-11 items-center rounded-xl bg-[#f0f1f5] px-4 text-sm text-[#677084]">Search businesses...</div>
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setStatusOpen((v) => !v);
              setPlanOpen(false);
            }}
            className="flex h-11 w-full items-center justify-between rounded-xl bg-[#f0f1f5] px-4 text-sm text-[#677084]"
          >
            {statusFilter} <ChevronDown className="h-4 w-4" />
          </button>
          {statusOpen && (
            <div className="absolute left-0 top-[52px] z-20 w-full rounded-xl border border-[#e2e5ee] bg-white p-2 shadow-[0_12px_30px_rgba(15,23,42,0.12)]">
              {["All Status", "Active", "Inactive", "Expired"].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    const nextStatus = item as typeof statusFilter;
                    setStatusFilter(nextStatus);
                    setStatusOpen(false);
                    scrollToFirstMatch(nextStatus, planFilter);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${
                    statusFilter === item ? "bg-[#eef0f6] font-semibold" : "hover:bg-[#f3f5f9]"
                  }`}
                >
                  {item}
                  {statusFilter === item && <span>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setPlanOpen((v) => !v);
              setStatusOpen(false);
            }}
            className="flex h-11 w-full items-center justify-between rounded-xl bg-[#f0f1f5] px-4 text-sm text-[#677084]"
          >
            {planFilter} <ChevronDown className="h-4 w-4" />
          </button>
          {planOpen && (
            <div className="absolute left-0 top-[52px] z-20 w-full rounded-xl border border-[#e2e5ee] bg-white p-2 shadow-[0_12px_30px_rgba(15,23,42,0.12)]">
              {["All Plans", "Basic", "Premium", "Enterprise"].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    const nextPlan = item as typeof planFilter;
                    setPlanFilter(nextPlan);
                    setPlanOpen(false);
                    scrollToFirstMatch(statusFilter, nextPlan);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${
                    planFilter === item ? "bg-[#eef0f6] font-semibold" : "hover:bg-[#f3f5f9]"
                  }`}
                >
                  {item}
                  {planFilter === item && <span>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto grid max-w-[1180px] grid-cols-1 gap-5 lg:grid-cols-3">
        {filteredBusinesses.map((business) => (
          <article
            key={business.name}
            id={`business-${business.name.replace(/\\s+/g, "-").toLowerCase()}`}
            className="overflow-hidden rounded-3xl bg-white shadow-[0_8px_24px_rgba(10,17,31,0.1)]"
          >
            <div className="relative h-36 overflow-hidden">
              <Image
                src={business.background}
                alt={`${business.name} background`}
                fill
                sizes="(max-width: 1024px) 100vw, (max-width: 1536px) 50vw, 33vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-[rgba(104,39,255,0.48)] to-[rgba(149,45,242,0.78)]" />
              <div className="absolute right-4 top-3 z-[2] flex gap-2">
                <span className={`inline-flex h-7 items-center rounded-xl px-3 text-xs font-bold text-white ${business.status === "Active" ? "bg-[#07c357]" : business.status === "Inactive" ? "bg-[#7d8593]" : "bg-[#ff3649]"}`}>
                  {business.status}
                </span>
                <span className={`inline-flex h-7 items-center rounded-xl px-3 text-xs font-bold text-white ${planColor[business.plan]}`}>
                  {business.plan}
                </span>
              </div>
              <div className="absolute bottom-3 left-4 z-[2] h-14 w-14 overflow-hidden rounded-xl border-4 border-white bg-[#d4dae6]">
                <Image src={business.thumb} alt={`${business.name} logo`} fill sizes="56px" className="object-cover" />
              </div>
            </div>

            <div className="p-5">
              <h3 className="text-lg font-semibold">{business.name}</h3>
              <p className="mt-1 text-sm text-[#616b80]">{business.owner}</p>

              <div className="mt-3 space-y-2 text-sm text-[#4c5568]">
                <p className="flex items-center gap-2"><Mail className="h-4 w-4" /> {business.email}</p>
                <p className="flex items-center gap-2"><Phone className="h-4 w-4" /> {business.phone}</p>
                <p className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {business.address}</p>
              </div>

              <div className="mt-4 grid grid-cols-3 rounded-xl bg-[#f5f6fa] p-3 text-center">
                <div>
                  <strong className="text-lg text-[#06ad53]">{business.revenue}</strong>
                  <p className="text-xs text-[#616b80]">Revenue</p>
                </div>
                <div>
                  <strong className="text-lg text-[#2063ec]">{business.orders}</strong>
                  <p className="text-xs text-[#616b80]">Orders</p>
                </div>
                <div>
                  <strong className="text-lg text-[#8925f8]">{business.users}</strong>
                  <p className="text-xs text-[#616b80]">Users</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2 lg:grid-cols-[1fr_1fr_auto]">
                <button type="button" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border-2 border-[#d3d7e0] bg-white text-sm font-semibold">
                  <Pencil className="h-4 w-4" /> Edit
                </button>
                <button
                  type="button"
                  className={`inline-flex h-10 items-center justify-center rounded-xl border-2 text-sm font-semibold ${
                    business.status === "Active" ? "border-[#ff9097] text-[#f2202f]" : "border-[#67db94] text-[#0ca94f]"
                  }`}
                >
                  {business.status === "Active" ? "Deactivate" : "Activate"}
                </button>
                <button type="button" className="inline-flex h-10 items-center justify-center rounded-xl border-2 border-[#ff9097] px-4 text-sm text-[#f2202f]">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>
    </AdminShell>
  );
}
