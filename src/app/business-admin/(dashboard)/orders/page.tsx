"use client";

import { useState } from "react";
import { ShoppingCart, ClipboardList } from "lucide-react";
import NewOrder from "@/components/business-admin/orders/NewOrder";
import ActiveOrders from "@/components/business-admin/orders/ActiveOrders";
import CartSidebar from "@/components/business-admin/orders/CartSidebar";

export type CartItem = {
  id: number;
  name: string;
  category: string;
  price: number;
  img: string;
  quantity: number;
};

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<"new" | "active">("new");
  const [cart, setCart] = useState<CartItem[]>([]);

  const handleAddToCart = (product: { id: number; name: string; category: string; price: number; img: string }) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (id: number, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row gap-6 items-start">
      {/* Left Column */}
      <div className={`flex-1 w-full space-y-6 transition-all duration-300 ${activeTab === 'active' ? 'max-w-5xl mx-auto' : ''}`}>
        {/* Animated Segmented Control */}
        <div className="bg-[#f4f7fe] p-1.5 rounded-2xl flex items-center border border-blue-200/70 shadow-sm relative overflow-hidden">
          <button
            onClick={() => setActiveTab("new")}
            className={`flex-1 flex justify-center items-center gap-2 py-3 rounded-xl text-[14px] font-bold transition-all duration-300 z-10 ${
              activeTab === "new"
                ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-[0_4px_12px_rgba(59,130,246,0.3)] ring-1 ring-blue-400"
                : "text-gray-600 hover:text-gray-900 hover:bg-black/5 bg-transparent"
            }`}
          >
            <ShoppingCart className={`w-[18px] h-[18px] ${activeTab === "new" ? "text-white" : "text-gray-500"}`} />
            New Order
          </button>
          
          <button
            onClick={() => setActiveTab("active")}
            className={`flex-1 flex justify-center items-center gap-2 py-3 rounded-xl text-[14px] font-bold transition-all duration-300 z-10 ${
              activeTab === "active"
                ? "bg-[#00c853] text-white shadow-[0_4px_12px_rgba(0,200,83,0.3)] ring-1 ring-green-400"
                : "text-gray-600 hover:text-gray-900 hover:bg-black/5 bg-transparent"
            }`}
          >
            <ClipboardList className={`w-[18px] h-[18px] ${activeTab === "active" ? "text-white" : "text-gray-500"}`} />
            Active Orders
            <span className="bg-[#ff3b30] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full ml-1 shadow-sm">
              3
            </span>
          </button>
        </div>

        {/* Dynamic Content Pane */}
        <div className="pb-10">
          {activeTab === "new" ? <NewOrder onAddToCart={handleAddToCart} /> : <ActiveOrders />}
        </div>
      </div>

      {/* Right Column: Sticky Cart Sidebar (Only show on New Order view) */}
      {activeTab === "new" && (
        <div className="w-full lg:w-[350px] xl:w-[380px] sticky top-6">
          <CartSidebar cart={cart} onUpdateQuantity={handleUpdateQuantity} onRemoveItem={handleRemoveItem} />
        </div>
      )}
    </div>
  );
}
