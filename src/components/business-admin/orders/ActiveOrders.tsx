import Image from "next/image";
import { Utensils, Clock, Check, ChevronDown } from "lucide-react";

const activeOrders = [
  {
    id: "o1700000001",
    status: "Cooking",
    color: "orange",
    table: "Table 5",
    time: "112m",
    amount: 34.97,
    items: [
      { qty: 2, name: "Margherita Pizza", img: "/dashboard/pic2.png" },
      { qty: 1, name: "Caesar Salad", img: "/dashboard/pic1.png" },
    ],
    canComplete: false,
  },
  {
    id: "o1700000002",
    status: "Preparing",
    color: "pink",
    table: "Table 12",
    time: "122m",
    amount: 48.97,
    items: [
      { qty: 1, name: "Grilled Salmon", img: "/dashboard/pic4.png" },
      { qty: 2, name: "Pasta Carbonara", img: "/dashboard/pic1.png" },
    ],
    canComplete: true,
  },
  {
    id: "o1700000003",
    status: "Ready",
    color: "green",
    table: "Patio 3",
    time: "107m",
    amount: 34.97,
    items: [
      { qty: 3, name: "Chocolate Cake", img: "/dashboard/pic3.png" },
      { qty: 2, name: "Tiramisu", img: "/dashboard/pic5.png" },
    ],
    canComplete: true,
  },
];

const colorStyles: Record<string, { border: string; badge: string }> = {
  orange: { border: "border-l-[#ff6b00]", badge: "bg-[#ff6b00] text-white" },
  pink: { border: "border-l-[#ff1493]", badge: "bg-[#ff1493] text-white" },
  green: { border: "border-l-[#00c853]", badge: "bg-[#00c853] text-white" },
};

export default function ActiveOrders() {
  return (
    <div className="space-y-4">
      {activeOrders.map((order) => (
        <div
          key={order.id}
          className={`bg-white rounded-2xl p-5 shadow-sm border-l-4 ${colorStyles[order.color].border}`}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2 text-gray-700 font-bold">
              <Utensils className="w-4 h-4 text-gray-400" />
              <span className="text-sm tracking-wide">{order.id}</span>
              <ChevronDown className="w-4 h-4 text-gray-300 ml-1" />
            </div>
            <div className={`px-3 py-1 rounded-lg text-xs font-bold ${colorStyles[order.color].badge}`}>
              {order.status}
            </div>
          </div>

          {/* Subheader */}
          <div className="flex items-center gap-3 text-[13px] text-gray-500 mb-4">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 border border-gray-400 rounded-sm opacity-50"></div>
              {order.table}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {order.time}
            </div>
          </div>

          {/* Items */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Image
                  src={item.img}
                  alt={item.name}
                  width={32}
                  height={32}
                  className="rounded-md object-cover border border-gray-100"
                />
                <span className="text-sm font-semibold text-gray-800">
                  {item.qty}x <span className="font-medium text-gray-600">{item.name}</span>
                </span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-end justify-between pt-2">
            <div>
              <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mb-0.5">Total Amount</p>
              <p className="text-[#00c853] font-bold text-lg">${order.amount.toFixed(2)}</p>
            </div>
            <button
              className={`flex items-center gap-1.5 px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                order.canComplete
                  ? "bg-[#00c853] text-white shadow-sm hover:shadow-md"
                  : "bg-gray-100 text-gray-300 cursor-not-allowed"
              }`}
            >
              <Check className="w-4 h-4" />
              Complete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
