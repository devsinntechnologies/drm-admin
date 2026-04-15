"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  ClipboardList,
  Package,
  DollarSign,
  Users,
} from "lucide-react";

const tabs = [
  { label: "Dashboard", href: "/business-admin", icon: LayoutGrid },
  { label: "Orders", href: "/business-admin/orders", icon: ClipboardList },
  { label: "Products", href: "/business-admin/products", icon: Package },
  { label: "Tables", href: "/business-admin/tables", icon: LayoutGrid },
  { label: "Invoices", href: "/business-admin/invoices", icon: DollarSign },
  { label: "Users", href: "/business-admin/users", icon: Users },
];

export default function TabNav() {
  const pathname = usePathname();

  return (
    <nav className="bg-white px-4 md:px-8 py-3">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between overflow-x-auto bg-[#f3f4f6] p-1 rounded-2xl scrollbar-hide">
          {tabs.map(({ label, href, icon: Icon }) => {
            const isActive =
              href === "/"
                ? pathname === "/" || pathname === "/dashboard"
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-1 justify-center items-center gap-2 px-5 py-2 rounded-xl text-[14px] whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? "bg-white text-gray-900 font-semibold shadow-sm"
                    : "text-gray-500 hover:text-gray-900 font-medium"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-gray-900" : "text-gray-500"}`} strokeWidth={isActive ? 2.5 : 2} />
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
