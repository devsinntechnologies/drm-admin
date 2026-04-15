"use client";

import { useState } from "react";
import Image from "next/image";
import { Utensils, Search, ChevronDown, AlertTriangle } from "lucide-react";

export type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  img: string;
  stock?: number;
};

const products: Product[] = [
  { id: 1, name: "Margherita Pizza", category: "Main Course", price: 12.99, img: "/dashboard/pic2.png" },
  { id: 2, name: "Caesar Salad", category: "Appetizer", price: 8.99, img: "/dashboard/pic1.png" },
  { id: 3, name: "Grilled Salmon", category: "Main Course", price: 18.99, img: "/dashboard/pic4.png" },
  { id: 4, name: "Chocolate Cake", category: "Dessert", price: 6.99, img: "/dashboard/pic3.png", stock: 8 },
  { id: 5, name: "Pasta Carbonara", category: "Main Course", price: 14.99, img: "/dashboard/pic1.png" },
  { id: 6, name: "Garlic Bread", category: "Appetizer", price: 4.99, img: "/dashboard/pic6.png" },
  { id: 7, name: "Tiramisu", category: "Dessert", price: 7.99, img: "/dashboard/pic5.png" },
  { id: 8, name: "Chicken Wings", category: "Appetizer", price: 10.99, img: "/dashboard/pic6.png", stock: 6 },
];

const tables = [
  "Table 1 • 2 seats",
  "Table 2 • 2 seats",
  "Table 3 • 4 seats",
  "Table 4 • 4 seats",
  "Table 5 • 4 seats",
  "Table 6 • 4 seats",
  "Table 7 • 6 seats",
  "Table 8 • 6 seats",
];

const categoryTabs = [
  { id: "All", label: "All" },
  { id: "Main Course", label: "Main Course" },
  { id: "Appetizer", label: "Appetizer" },
  { id: "Dessert", label: "Dessert" },
];

type Props = {
  onAddToCart: (product: Product) => void;
};

export default function NewOrder({ onAddToCart }: Props) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState("Choose a table...");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Select Table Section */}
      <div className="bg-[#f4f7fe] rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-[#3b82f6] rounded-xl flex items-center justify-center text-white shadow-sm shadow-blue-200">
            <Utensils className="w-5 h-5" />
          </div>
          <span className="font-semibold text-gray-800">Select Table</span>
        </div>
        <div className="relative">
          <div 
            className="w-full bg-white border border-gray-200/60 rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors shadow-sm"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <span className={`text-sm ${selectedTable === "Choose a table..." ? "text-gray-400" : "text-gray-800 font-medium"}`}>
              {selectedTable}
            </span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
          </div>

          {/* Custom Dropdown */}
          {isDropdownOpen && (
            <div className="absolute top-12 left-0 right-0 bg-white border border-gray-100 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto py-2 animate-in fade-in slide-in-from-top-2 duration-200">
              {tables.map(t => (
                <div 
                  key={t} 
                  className="px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer font-medium transition-colors"
                  onClick={() => { setSelectedTable(t); setIsDropdownOpen(false); }}
                >
                  {t}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Menu Section */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        {/* Menu Header */}
        <div className="mb-4">
          <h3 className="font-bold text-[17px] text-gray-800 tracking-tight">Menu Items</h3>
          <p className="text-[13px] font-medium text-gray-400 mt-0.5">{filteredProducts.length} items available</p>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2.5 bg-[#f4f5f7] rounded-xl px-4 py-3 border border-transparent hover:border-gray-200 focus-within:border-[#3b82f6] focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
          <Search className="w-[18px] h-[18px] text-gray-400" strokeWidth={2.5} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search menu items..."
            className="bg-transparent outline-none text-[15px] text-gray-700 w-full placeholder-gray-400 font-medium"
          />
        </div>

        {/* Categories */}
        <div className="flex flex-wrap items-center gap-2.5 pt-5 pb-5">
          {categoryTabs.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-4 lg:px-5 py-2 rounded-xl text-[13px] font-bold shadow-sm transition-all ${
                  isActive
                    ? "bg-[#ff4500] text-white hover:shadow-md hover:-translate-y-0.5"
                    : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {cat.id === "Main Course" && <Utensils className="w-[14px] h-[14px]" />}
                {cat.id === "Appetizer" && (
                  <div className={`w-[14px] h-[14px] rounded-full border-[1.5px] items-center justify-center flex text-[7px] ${isActive ? "border-white" : "border-gray-500"}`}>
                    ☕
                  </div>
                )}
                {cat.id === "Dessert" && <span className="text-[11px]">✨</span>}
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredProducts.map((p) => (
              <div 
                key={p.id} 
                onClick={() => onAddToCart(p)}
                className="relative rounded-2xl overflow-hidden group shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="relative w-full h-40">
                  <Image
                    src={p.img}
                    alt={p.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  {/* Stock Badge */}
                  {p.stock && (
                    <div className="absolute top-2 right-2 bg-[#ff6b00] text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {p.stock} left
                    </div>
                  )}
                  
                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 flex justify-between items-end">
                    <div>
                      <h4 className="text-white font-bold text-[15px] leading-tight drop-shadow-sm">{p.name}</h4>
                      <p className="text-gray-200 text-xs mt-0.5 opacity-90">{p.category}</p>
                    </div>
                    <div className="bg-[#ff4500] text-white font-bold text-sm px-2.5 py-1 rounded-lg shadow-sm">
                      ${p.price.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-gray-400">
            <Search className="w-8 h-8 mx-auto mb-3 text-gray-300" />
            <p>No items found for this category or search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
