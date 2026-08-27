import {
  ChefHat,
  ClipboardList,
  LayoutDashboard,
  Package,
  Receipt,
  ShoppingCart,
  Table2,
  Users,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import type { ModuleId } from "@/templates/types";

const ICONS: Partial<Record<ModuleId, LucideIcon>> = {
  dashboard: LayoutDashboard,
  menu: Package,
  products: Package,
  orders: ShoppingCart,
  kitchen: ChefHat,
  sales: Receipt,
  tables: Table2,
  staff: Users,
  inventory: Warehouse,
};

export function SoftwareModuleIcon({
  moduleId,
  className,
}: {
  moduleId: string;
  className?: string;
}) {
  const Icon = ICONS[moduleId as ModuleId] ?? ClipboardList;
  return <Icon className={className} />;
}
