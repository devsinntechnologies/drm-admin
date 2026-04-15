"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Package,
  AlertTriangle,
  DollarSign,
  Utensils,
  Search,
  Plus,
  Minus,
  Pencil,
  Trash2,
} from "lucide-react";

type Product = {
  id: number;
  name: string;
  category: "Main Course" | "Appetizer" | "Dessert" | "Beverage";
  price: number;
  stock: number;
  img: string;
  isLowStock?: boolean;
};

const initialProducts: Product[] = [
  { id: 1, name: "Margherita Pizza", category: "Main Course", price: 12.99, stock: 25, img: "/dashboard/pic2.png" },
  { id: 2, name: "Caesar Salad", category: "Appetizer", price: 8.99, stock: 30, img: "/dashboard/pic1.png" },
  { id: 3, name: "Grilled Salmon", category: "Main Course", price: 18.99, stock: 15, img: "/dashboard/pic4.png" },
  { id: 4, name: "Chocolate Cake", category: "Dessert", price: 6.99, stock: 8, img: "/dashboard/pic3.png", isLowStock: true },
  { id: 5, name: "Pasta Carbonara", category: "Main Course", price: 14.99, stock: 20, img: "/dashboard/pic1.png" },
  { id: 6, name: "Garlic Bread", category: "Appetizer", price: 4.99, stock: 35, img: "/dashboard/pic6.png" },
  { id: 7, name: "Tiramisu", category: "Dessert", price: 7.99, stock: 12, img: "/dashboard/pic5.png" },
  { id: 8, name: "Chicken Wings", category: "Appetizer", price: 10.99, stock: 6, img: "/dashboard/pic6.png", isLowStock: true },
];

const categoryConfig: Record<string, { color: string; label: string }> = {
  "Main Course": { color: "bg-[#ff4500]", label: "Main Course" },
  "Appetizer": { color: "bg-[#00c853]", label: "Appetizer" },
  "Dessert": { color: "bg-[#e91e8c]", label: "Dessert" },
  "Beverage": { color: "bg-gray-400", label: "Beverage" },
};

const LOW_STOCK_THRESHOLD = 10;

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const categoryCounts = {
    All: products.length,
    Appetizer: products.filter((p) => p.category === "Appetizer").length,
    "Main Course": products.filter((p) => p.category === "Main Course").length,
    Dessert: products.filter((p) => p.category === "Dessert").length,
    Beverage: products.filter((p) => p.category === "Beverage").length,
  };

  const totalItems = products.length;
  const lowStockCount = products.filter((p) => p.stock <= LOW_STOCK_THRESHOLD).length;
  const stockValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);
  const categoriesCount = new Set(products.map((p) => p.category)).size;

  const filteredProducts = products.filter((p) => {
    const matchCat = selectedCategory === "All" || p.category === selectedCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const adjustStock = (id: number, delta: number) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, stock: Math.max(0, p.stock + delta) } : p
      )
    );
  };

  const deleteProduct = (id: number) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const categoryTabs = [
    { id: "All", label: `All (${categoryCounts.All})`, icon: null },
    { id: "Appetizer", label: `Appetizer (${categoryCounts.Appetizer})`, icon: "🍴" },
    { id: "Main Course", label: `Main Course (${categoryCounts["Main Course"]})`, icon: "🍽" },
    { id: "Dessert", label: `Dessert (${categoryCounts.Dessert})`, icon: "✨" },
    { id: "Beverage", label: `Beverage (${categoryCounts.Beverage})`, icon: "🥤" },
  ];

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#3b82f6] rounded-xl flex items-center justify-center text-white shadow-sm shadow-blue-200">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-[18px] text-gray-800 tracking-tight leading-tight">Menu Items</h2>
            <p className="text-[13px] text-gray-400 font-medium">Manage products &amp; stock</p>
          </div>
        </div>
        <button className="flex items-center gap-1.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white px-5 py-2.5 rounded-xl text-[14px] font-bold shadow-sm shadow-blue-200 transition-all hover:shadow-md hover:-translate-y-0.5">
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#eef2ff] rounded-2xl p-4 flex items-center gap-3 border border-blue-100">
          <div className="w-10 h-10 bg-[#3b82f6] rounded-xl flex items-center justify-center text-white flex-shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide">Total Items</p>
            <p className="text-[26px] font-extrabold text-gray-800 leading-tight">{totalItems}</p>
          </div>
        </div>

        <div className="bg-[#fff1f2] rounded-2xl p-4 flex items-center gap-3 border border-red-100">
          <div className="w-10 h-10 bg-[#ff3b30] rounded-xl flex items-center justify-center text-white flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide">Low Stock</p>
            <p className="text-[26px] font-extrabold text-gray-800 leading-tight">{lowStockCount}</p>
          </div>
        </div>

        <div className="bg-[#f0fdf4] rounded-2xl p-4 flex items-center gap-3 border border-green-100">
          <div className="w-10 h-10 bg-[#00c853] rounded-xl flex items-center justify-center text-white flex-shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide">Stock Value</p>
            <p className="text-[22px] font-extrabold text-gray-800 leading-tight">${Math.round(stockValue)}</p>
          </div>
        </div>

        <div className="bg-[#fdf4ff] rounded-2xl p-4 flex items-center gap-3 border border-purple-100">
          <div className="w-10 h-10 bg-[#9333ea] rounded-xl flex items-center justify-center text-white flex-shrink-0">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide">Categories</p>
            <p className="text-[26px] font-extrabold text-gray-800 leading-tight">{categoriesCount}</p>
          </div>
        </div>
      </div>

      {/* Search + Category Filters — single row */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4">
        {/* Search */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 w-full md:w-[420px] shadow-sm hover:border-gray-300 focus-within:border-[#3b82f6] focus-within:ring-4 focus-within:ring-blue-500/10 transition-all flex-shrink-0">
          <Search className="w-[15px] h-[15px] text-gray-400 flex-shrink-0" strokeWidth={2.5} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="outline-none text-[13px] text-gray-700 w-full bg-transparent placeholder-gray-400"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
          {categoryTabs.map((tab) => {
            const isActive = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
                  isActive
                    ? "bg-[#3b82f6] text-white shadow-sm"
                    : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50 hover:text-gray-700"
                }`}
              >
                {tab.id === "Appetizer" && <span className="text-[11px]">🍴</span>}
                {tab.id === "Main Course" && <Utensils className="w-3 h-3" />}
                {tab.id === "Dessert" && <span className="text-[11px]">✨</span>}
                {tab.id === "Beverage" && <span className="text-[11px]">🥤</span>}
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-10">
          {filteredProducts.map((product) => {
            const isLow = product.stock <= LOW_STOCK_THRESHOLD;
            const stockPercent = Math.min(100, (product.stock / 40) * 100);
            const isHovered = hoveredId === product.id;
            const stockValue = product.price * product.stock;
            const catStyle = categoryConfig[product.category] || categoryConfig["Main Course"];

            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 flex flex-col"
                onMouseEnter={() => setHoveredId(product.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Image */}
                <div className="relative h-44 overflow-hidden">
                  <Image
                    src={product.img}
                    alt={product.name}
                    fill
                    className={`object-cover transition-transform duration-300 ${isHovered ? "scale-105" : "scale-100"}`}
                  />

                  {/* Category Badge - top left */}
                  <div className={`absolute top-3 left-3 flex items-center gap-1.5 ${catStyle.color} text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm`}>
                    <Utensils className="w-3 h-3" />
                    {catStyle.label}
                  </div>

                  {/* Stock Count Badge - top right */}
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-[#00c853] text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                    <span>⊙</span>
                    {product.stock}
                  </div>

                  {/* Low Stock Warning Badge */}
                  {isLow && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-[#ff4500] text-white text-[11px] font-bold px-2 py-1 rounded-full shadow-sm">
                      <AlertTriangle className="w-3 h-3" />
                      Low: {product.stock}
                    </div>
                  )}

                  {/* Hover: Stock Value Tooltip */}
                  {isHovered && (
                    <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 flex items-center justify-between shadow-sm border border-gray-100 text-[13px]">
                      <span className="text-gray-500 font-medium">Stock Value</span>
                      <span className="font-bold text-[#3b82f6]">${stockValue.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-4 flex flex-col gap-3 flex-1">
                  {/* Name + Price row */}
                  <div>
                    <h3 className={`font-bold text-[16px] tracking-tight leading-tight mb-1 ${isLow ? "text-[#3b82f6]" : "text-gray-800"}`}>
                      {product.name}
                    </h3>
                    <div className="flex items-end justify-between">
                      <div>
                        <span className={`text-[22px] font-extrabold leading-none ${isLow ? "text-[#3b82f6]" : "text-[#00c853]"}`}>
                          ${product.price.toFixed(2)}
                        </span>
                        <span className="text-[11px] text-gray-400 ml-1 font-medium">per unit</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[15px] font-bold text-gray-700">{product.stock}</span>
                        <span className="text-[11px] text-gray-400 ml-1">in stock</span>
                      </div>
                    </div>
                  </div>

                  {/* Stock Level Bar */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[12px] font-semibold text-gray-500">Stock Level</span>
                      <span className={`text-[12px] font-bold ${isLow ? "text-[#ff3b30]" : "text-[#00c853]"}`}>
                        {isLow ? "Low" : "Good"}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${isLow ? "bg-[#ff3b30]" : "bg-[#00c853]"}`}
                        style={{ width: `${stockPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Quick Adjust */}
                  <div className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
                    <button
                      onClick={() => adjustStock(product.id, -5)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-colors shadow-sm"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <div className="text-center">
                      <p className="text-[11px] font-semibold text-gray-500">Quick Adjust</p>
                      <p className="text-[10px] text-gray-400">±5 units</p>
                    </div>
                    <button
                      onClick={() => adjustStock(product.id, 5)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-green-50 hover:border-green-200 hover:text-green-500 transition-colors shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Edit + Delete */}
                  <div className="flex items-center gap-2 mt-auto">
                    <button className="flex-1 flex items-center justify-center gap-2 bg-[#f0f4ff] hover:bg-[#dbe8ff] text-[#3b82f6] font-bold text-[13px] py-2.5 rounded-xl border border-[#c7d9ff] transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => deleteProduct(product.id)}
                      className="w-10 h-10 flex items-center justify-center bg-[#fff5f5] hover:bg-[#ffe0e0] text-[#ff3b30] rounded-xl border border-[#ffcdd2] transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-20 text-center text-gray-400">
          <Search className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="font-medium">No products found.</p>
          <p className="text-sm mt-1">Try adjusting your search or filter.</p>
        </div>
      )}
    </div>
  );
}
