"use client";

import Image from "next/image";
import {
  DollarSign,
  Zap,
  Activity,
  Bell,
  ClipboardList,
  FileText,
  Award,
  BarChart2,
  Clock,
  Star,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// ── DATA CONSTANTS ─────────────────────────────────────────────────────────

const topCards = [
  {
    label: "Total Revenue",
    value: "$0.00",
    sub: "From 0 paid invoices",
    icon: DollarSign,
    gradient: "from-emerald-400 to-green-600",
    iconBg: "bg-white/20",
  },
  {
    label: "Today's Revenue",
    value: "$120.89",
    sub: "3 orders today",
    icon: Zap,
    gradient: "from-blue-500 to-violet-600",
    iconBg: "bg-white/20",
  },
  {
    label: "Active Orders",
    value: "3",
    sub: "0 completed",
    icon: Activity,
    gradient: "from-pink-500 to-purple-600",
    iconBg: "bg-white/20",
  },
  {
    label: "Low Stock Alerts",
    value: "2",
    sub: "Out of 8 products",
    icon: Bell,
    gradient: "from-orange-500 to-red-600",
    iconBg: "bg-white/20",
  },
];

const secondaryCards = [
  {
    label: "Total Orders",
    value: "3",
    sub: "All time orders",
    icon: ClipboardList,
    borderColor: "border-l-blue-500",
    iconColor: "text-blue-500",
    iconBg: "bg-blue-50",
  },
  {
    label: "Pending Invoices",
    value: "0",
    sub: "Awaiting payment",
    icon: FileText,
    borderColor: "border-l-orange-400",
    iconColor: "text-orange-400",
    iconBg: "bg-orange-50",
  },
  {
    label: "Completion Rate",
    value: "0.0%",
    sub: "Orders completed",
    icon: Award,
    borderColor: "border-l-green-500",
    iconColor: "text-green-500",
    iconBg: "bg-green-50",
  },
];

const revenueData = [
  { day: "Wed", revenue: 0 },
  { day: "Thu", revenue: 0 },
  { day: "Fri", revenue: 0 },
  { day: "Sat", revenue: 0 },
  { day: "Sun", revenue: 0 },
  { day: "Mon", revenue: 36.95 },
  { day: "Tue", revenue: 120.89 },
];

const orderStatusData = [
  { name: "New", value: 1, color: "#3b82f6" },
  { name: "Preparing", value: 1, color: "#f59e0b" },
  { name: "Ready", value: 1, color: "#8b5cf6" },
  { name: "Delivered", value: 0, color: "#10b981" },
  { name: "Complete", value: 0, color: "#9ca3af" },
];

const topProducts = [
  { rank: 1, name: "Pasta Carbonara", units: 2, revenue: 29.98, img: "/dashboard/pic1.png" },
  { rank: 2, name: "Margherita Pizza", units: 2, revenue: 25.98, img: "/dashboard/pic2.png" },
  { rank: 3, name: "Chocolate Cake", units: 3, revenue: 20.97, img: "/dashboard/pic3.png" },
  { rank: 4, name: "Grilled Salmon", units: 1, revenue: 18.99, img: "/dashboard/pic4.png" },
  { rank: 5, name: "Tiramisu", units: 2, revenue: 15.98, img: "/dashboard/pic5.png" },
];

const recentOrders = [
  { id: 1, table: "Patio 3", time: "5m ago", amount: 36.95, status: "Ready", iconColor: "bg-purple-500" },
  { id: 2, table: "Table 5", time: "10m ago", amount: 34.97, status: "New", iconColor: "bg-blue-500" },
  { id: 3, table: "Table 12", time: "20m ago", amount: 48.97, status: "Preparing", iconColor: "bg-orange-400" },
];

const lowStockItems = [
  { name: "Chocolate Cake", left: 8, price: 6.99, img: "/dashboard/pic3.png" },
  { name: "Chicken Wings", left: 6, price: 10.99, img: "/dashboard/pic6.png" },
];

const quickOverviewStats = [
  { label: "Total Products", value: "8" },
  { label: "Total Stock Units", value: "151" },
  { label: "Inventory Value", value: "$1571" },
  { label: "Avg Order Value", value: "40.30" },
];

// ── SUB-COMPONENTS ──────────────────────────────────────────────────────────

function TopStatsCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {topCards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className={`bg-gradient-to-br ${card.gradient} rounded-2xl p-5 relative overflow-hidden shadow-md`}
          >
            <div className="absolute right-3 top-3 opacity-20">
              <Icon className="w-16 h-16 text-white" />
            </div>
            <div className={`${card.iconBg} rounded-xl w-9 h-9 flex items-center justify-center mb-4`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-white/80 text-sm font-medium mb-1">{card.label}</p>
            <p className="text-white text-3xl font-bold mb-1">{card.value}</p>
            <p className="text-white/70 text-xs">{card.sub}</p>
          </div>
        );
      })}
    </div>
  );
}

function SecondaryStatsCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {secondaryCards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className={`bg-white rounded-2xl p-5 border-l-4 ${card.borderColor} shadow-sm flex items-start justify-between`}
          >
            <div>
              <p className="text-gray-500 text-sm font-medium mb-3">{card.label}</p>
              <p className="text-gray-900 text-3xl font-bold mb-1">{card.value}</p>
              <p className="text-gray-400 text-xs">{card.sub}</p>
            </div>
            <div className={`${card.iconBg} rounded-xl w-10 h-10 flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${card.iconColor}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RevenueTrendChart() {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 p-5 pb-3">
        <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center">
          <BarChart2 className="w-5 h-5 text-violet-600" />
        </div>
        <div>
          <p className="font-semibold text-gray-800 text-sm">Revenue Trend</p>
          <p className="text-gray-400 text-xs">Last 7 days performance</p>
        </div>
      </div>
      <div className="px-2 pb-4" style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} ticks={[0, 35, 70, 105, 140]} />
            <Tooltip
              contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: 12 }}
              formatter={(value: number) => [`$${value.toFixed(2)}`, "Revenue"]}
            />
            <Area type="monotone" dataKey="revenue" stroke="#7c3aed" strokeWidth={2.5} fill="url(#revenueGrad)" dot={{ r: 3, fill: "#7c3aed", strokeWidth: 0 }} activeDot={{ r: 5, fill: "#7c3aed" }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function OrderStatusDonutChart() {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 p-5 pb-3">
        <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center">
          <Clock className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <p className="font-semibold text-gray-800 text-sm">Order Status</p>
          <p className="text-gray-400 text-xs">Current order distribution</p>
        </div>
      </div>
      <div className="flex items-center justify-around px-4 pb-5 gap-4">
        <div style={{ width: 160, height: 160 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={orderStatusData.filter((d) => d.value > 0)}
                cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={3} dataKey="value" stroke="none"
              >
                {orderStatusData.filter((d) => d.value > 0).map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col gap-2 justify-center">
          {orderStatusData.map((entry) => (
            <div key={entry.name} className="flex items-center justify-between gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: entry.color }} />
                <span className="text-gray-600">{entry.name}</span>
              </div>
              <span className="font-semibold text-gray-800">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TopSellingProductsList() {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 p-5 pb-3 bg-green-50 border-b border-green-100">
        <div className="w-9 h-9 bg-green-500 rounded-xl flex items-center justify-center">
          <Star className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-semibold text-gray-800 text-sm">Top Selling Products</p>
          <p className="text-gray-400 text-xs">Best performers by revenue</p>
        </div>
      </div>
      <div className="divide-y divide-gray-50">
        {topProducts.map((p) => (
          <div key={p.rank} className="flex items-center gap-3 px-5 py-3">
            <div className="relative w-11 h-11 shrink-0">
              <div className="w-11 h-11 rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={p.img} alt={p.name} width={44} height={44} className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
              <span className="absolute -top-1 -left-1 w-5 h-5 bg-orange-400 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {p.rank}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{p.name}</p>
              <p className="text-xs text-gray-400">{p.units} units sold</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-green-500">${p.revenue.toFixed(2)}</p>
              <p className="text-xs text-gray-400">revenue</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentOrdersList() {
  const statusStyles: Record<string, string> = {
    Ready: "bg-gray-100 text-gray-700",
    New: "bg-blue-100 text-blue-700",
    Preparing: "bg-orange-100 text-orange-700",
    Delivered: "bg-green-100 text-green-700",
    Complete: "bg-purple-100 text-purple-700",
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 p-5 pb-3 bg-blue-50 border-b border-blue-100">
        <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center">
          <Clock className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-semibold text-gray-800 text-sm">Recent Orders</p>
          <p className="text-gray-400 text-xs">Latest order activity</p>
        </div>
      </div>
      <div className="divide-y divide-gray-50">
        {recentOrders.map((o) => (
          <div key={o.id} className="flex items-center gap-3 px-5 py-4">
            <div className={`w-9 h-9 ${o.iconColor} rounded-xl flex items-center justify-center shrink-0`}>
              <Clock className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800">{o.table}</p>
              <p className="text-xs text-gray-400">{o.time}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-gray-800">${o.amount.toFixed(2)}</p>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${statusStyles[o.status]}`}>
                {o.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LowStockAlertSection() {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border-l-4 border-l-orange-400">
      <div className="flex items-center gap-3 px-5 py-3 bg-orange-50 border-b border-orange-100">
        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
          <AlertTriangle className="w-4 h-4 text-orange-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-orange-600">Low Stock Products – Action Required!</p>
          <p className="text-xs text-gray-400">These items need immediate restocking</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5">
        {lowStockItems.map((item) => (
          <div key={item.name} className="flex items-center gap-3 border border-orange-200 rounded-xl p-3">
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
              <Image
                src={item.img} alt={item.name} width={48} height={48} className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">{item.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-md">
                  {item.left} left
                </span>
                <span className="text-gray-500 text-xs">${item.price.toFixed(2)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickOverviewSection() {
  return (
    <div className="bg-gradient-to-r from-violet-600 to-purple-500 rounded-2xl p-5 shadow-md">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-white/80" />
        <p className="text-white font-semibold text-sm">Quick Overview</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickOverviewStats.map((s) => (
          <div key={s.label} className="bg-white/15 rounded-xl px-4 py-3 text-center backdrop-blur-sm">
            <p className="text-white text-2xl font-bold">{s.value}</p>
            <p className="text-white/70 text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── MAIN PAGE ───────────────────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Top 4 color cards */}
      <TopStatsCards />

      {/* Secondary 3 white cards */}
      <SecondaryStatsCards />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <RevenueTrendChart />
        <OrderStatusDonutChart />
      </div>

      {/* Products + Orders Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <TopSellingProductsList />
        <RecentOrdersList />
      </div>

      {/* Low Stock Alert */}
      <LowStockAlertSection />

      {/* Quick Overview */}
      <QuickOverviewSection />
    </div>
  );
}
