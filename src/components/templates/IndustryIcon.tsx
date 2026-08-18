import {
  BookOpen,
  Car,
  CircleDot,
  Coffee,
  Cpu,
  Factory,
  Gem,
  Pill,
  ShoppingBag,
  ShoppingCart,
  Sofa,
  Sparkles,
  Store,
  Shirt,
  Cake,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, LucideIcon> = {
  store: Store,
  pill: Pill,
  utensils: UtensilsCrossed,
  shirt: Shirt,
  sparkles: Sparkles,
  cake: Cake,
  cpu: Cpu,
  gem: Gem,
  toy: ShoppingBag,
  coffee: Coffee,
  sofa: Sofa,
  "shopping-cart": ShoppingCart,
  factory: Factory,
  car: Car,
  book: BookOpen,
  snooker: CircleDot,
};

export function IndustryIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = ICON_MAP[name] ?? Store;
  return <Icon className={cn("h-6 w-6", className)} strokeWidth={1.8} />;
}
