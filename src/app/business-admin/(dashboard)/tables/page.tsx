"use client";

import { useState } from "react";
import Image from "next/image";
import {
  LayoutGrid,
  Search,
  Plus,
  Minus,
  Pencil,
  Trash2,
  Users,
  TrendingUp,
  Star,
} from "lucide-react";

type Table = {
  id: number;
  tableId: string;
  name: string;
  seats: number;
  row: number; // which image row (0-indexed)
};

// 20 tables, 5 rows of 4, each row shares same image
const allTables: Table[] = [
  // Row 0 — table1.png (2-seat outdoor)
  { id: 1,  tableId: "t1",     name: "Table 1",       seats: 2, row: 0 },
  { id: 2,  tableId: "t2",     name: "Table 2",       seats: 2, row: 0 },
  { id: 3,  tableId: "t3",     name: "Table 3",       seats: 4, row: 0 },
  { id: 4,  tableId: "t4",     name: "Table 4",       seats: 4, row: 0 },

  // Row 1 — table2.png (4-seat indoor)
  { id: 5,  tableId: "t5",     name: "Table 5",       seats: 4, row: 1 },
  { id: 6,  tableId: "t6",     name: "Table 6",       seats: 4, row: 1 },
  { id: 7,  tableId: "t7",     name: "Table 7",       seats: 6, row: 1 },
  { id: 8,  tableId: "t8",     name: "Table 8",       seats: 6, row: 1 },

  // Row 2 — table3.png (6-seat indoor warm)
  { id: 9,  tableId: "t9",     name: "Table 9",       seats: 8, row: 2 },
  { id: 10, tableId: "t10",    name: "Table 10",      seats: 8, row: 2 },
  { id: 11, tableId: "t11",    name: "Table 11",      seats: 2, row: 2 },
  { id: 12, tableId: "t12",    name: "Table 12",      seats: 4, row: 2 },

  // Row 3 — table4.png (VIP / Patio)
  { id: 13, tableId: "t13",    name: "Table 13",      seats: 6, row: 3 },
  { id: 14, tableId: "t14",    name: "Table 14",      seats: 8, row: 3 },
  { id: 15, tableId: "vip1",   name: "VIP Booth 1",   seats: 6, row: 3 },
  { id: 16, tableId: "vip2",   name: "VIP Booth 2",   seats: 8, row: 3 },

  // Row 4 — table5.png (outdoor patio / bar)
  { id: 17, tableId: "patio1", name: "Patio 1",       seats: 4, row: 4 },
  { id: 18, tableId: "patio2", name: "Patio 2",       seats: 4, row: 4 },
  { id: 19, tableId: "patio3", name: "Patio 3",       seats: 6, row: 4 },
  { id: 20, tableId: "bar1",   name: "Bar Counter 1", seats: 1, row: 4 },
];

// images per row
const rowImages = [
  "/tables/table1.png",
  "/tables/table2.png",
  "/tables/table3.png",
  "/tables/table4.png",
  "/tables/table5.png",
];

function getSeatsBadge(seats: number) {
  if (seats <= 2) return "bg-[#3b82f6]";
  if (seats <= 4) return "bg-[#00c853]";
  if (seats <= 6) return "bg-[#ff6b00]";
  return "bg-[#7c3aed]";
}

function getCapacityLabel(seats: number): { label: string; color: string; pct: number } {
  if (seats <= 2) return { label: "Small", color: "text-[#3b82f6]", pct: 20 };
  if (seats <= 4) return { label: "Medium", color: "text-[#7c3aed]", pct: 45 };
  if (seats <= 6) return { label: "Large", color: "text-[#7c3aed]", pct: 70 };
  return { label: "Extra Large", color: "text-[#7c3aed]", pct: 95 };
}

function getCapacityFilter(seats: number): string {
  if (seats <= 2) return "1-2";
  if (seats <= 4) return "3-4";
  if (seats <= 6) return "5-6";
  return "7+";
}

const COLS = 4;

export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>(allTables);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const totalTables = tables.length;
  const totalCapacity = tables.reduce((s, t) => s + t.seats, 0);
  const avgCapacity = totalTables > 0 ? (totalCapacity / totalTables).toFixed(1) : "0";
  const vipTables = tables.filter((t) => t.name.toLowerCase().includes("vip")).length;

  const filterCounts: Record<string, number> = {
    All: tables.length,
    "1-2": tables.filter((t) => t.seats <= 2).length,
    "3-4": tables.filter((t) => t.seats >= 3 && t.seats <= 4).length,
    "5-6": tables.filter((t) => t.seats >= 5 && t.seats <= 6).length,
    "7+": tables.filter((t) => t.seats >= 7).length,
  };

  const filtered = tables.filter((t) => {
    const matchName = t.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "All" || getCapacityFilter(t.seats) === filter;
    return matchName && matchFilter;
  });

  // group into rows of COLS
  const rows: Table[][] = [];
  for (let i = 0; i < filtered.length; i += COLS) {
    rows.push(filtered.slice(i, i + COLS));
  }

  const adjustSeats = (id: number, delta: number) => {
    setTables((prev) =>
      prev.map((t) => (t.id === id ? { ...t, seats: Math.max(1, t.seats + delta) } : t))
    );
  };

  const deleteTable = (id: number) => {
    setTables((prev) => prev.filter((t) => t.id !== id));
  };

  const filterTabs = [
    { id: "All", label: `All (${filterCounts["All"]})` },
    { id: "1-2", label: `1-2 (${filterCounts["1-2"]})` },
    { id: "3-4", label: `3-4 (${filterCounts["3-4"]})` },
    { id: "5-6", label: `5-6 (${filterCounts["5-6"]})` },
    { id: "7+",  label: `7+ (${filterCounts["7+"]})` },
  ];

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#3b82f6] rounded-xl flex items-center justify-center text-white shadow-sm shadow-blue-200">
            <LayoutGrid className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-[18px] text-gray-800 tracking-tight leading-tight">
              Restaurant Tables
            </h2>
            <p className="text-[13px] text-gray-400 font-medium">Manage seating arrangements</p>
          </div>
        </div>
        <button className="flex items-center gap-1.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white px-5 py-2.5 rounded-xl text-[14px] font-bold shadow-sm shadow-blue-200 transition-all hover:shadow-md hover:-translate-y-0.5">
          <Plus className="w-4 h-4" />
          Add Table
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#eef2ff] rounded-2xl p-4 flex items-center gap-3 border border-blue-100">
          <div className="w-10 h-10 bg-[#3b82f6] rounded-xl flex items-center justify-center text-white flex-shrink-0">
            <LayoutGrid className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide">Total Tables</p>
            <p className="text-[26px] font-extrabold text-gray-800 leading-tight">{totalTables}</p>
          </div>
        </div>

        <div className="bg-[#f0fdf4] rounded-2xl p-4 flex items-center gap-3 border border-green-100">
          <div className="w-10 h-10 bg-[#00c853] rounded-xl flex items-center justify-center text-white flex-shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide">Total Capacity</p>
            <p className="text-[26px] font-extrabold text-gray-800 leading-tight">{totalCapacity}</p>
          </div>
        </div>

        <div className="bg-[#fdf4ff] rounded-2xl p-4 flex items-center gap-3 border border-purple-100">
          <div className="w-10 h-10 bg-[#7c3aed] rounded-xl flex items-center justify-center text-white flex-shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide">Avg Capacity</p>
            <p className="text-[26px] font-extrabold text-gray-800 leading-tight">{avgCapacity}</p>
          </div>
        </div>

        <div className="bg-[#fff7ed] rounded-2xl p-4 flex items-center gap-3 border border-orange-100">
          <div className="w-10 h-10 bg-[#ff6b00] rounded-xl flex items-center justify-center text-white flex-shrink-0">
            <Star className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide">VIP Tables</p>
            <p className="text-[26px] font-extrabold text-gray-800 leading-tight">{vipTables}</p>
          </div>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 w-full md:w-72 shadow-sm hover:border-gray-300 focus-within:border-[#3b82f6] focus-within:ring-4 focus-within:ring-blue-500/10 transition-all flex-shrink-0">
          <Search className="w-[15px] h-[15px] text-gray-400 flex-shrink-0" strokeWidth={2.5} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tables..."
            className="outline-none text-[13px] text-gray-700 w-full bg-transparent placeholder-gray-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {filterTabs.map((tab) => {
            const isActive = filter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-[#3b82f6] text-white shadow-sm"
                    : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {tab.id !== "All" && <Users className="w-3 h-3" />}
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tables Grid — row-by-row so each row shares same image */}
      <div className="pb-10 space-y-5">
        {rows.map((row, rowIdx) => {
          // find the original row index for image
          const firstTable = row[0];
          const rowImage = rowImages[firstTable.row % rowImages.length];

          return (
            <div key={rowIdx} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {row.map((table) => {
                const cap = getCapacityLabel(table.seats);
                const seatsBg = getSeatsBadge(table.seats);
                const isHovered = hoveredId === table.id;

                return (
                  <div
                    key={table.id}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 flex flex-col"
                    onMouseEnter={() => setHoveredId(table.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    {/* Image */}
                    <div className="relative h-44 overflow-hidden">
                      <Image
                        src={rowImage}
                        alt={table.name}
                        fill
                        className={`object-cover transition-transform duration-300 ${isHovered ? "scale-105" : "scale-100"}`}
                      />

                      {/* Seats badge — top left */}
                      <div className={`absolute top-3 left-3 flex items-center gap-1.5 ${seatsBg} text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm`}>
                        <Users className="w-3 h-3" />
                        {table.seats} {table.seats === 1 ? "Seat" : "Seats"}
                      </div>

                      {/* Table badge — top right */}
                      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-[#3b82f6] text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                        <LayoutGrid className="w-3 h-3" />
                        Table
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 flex flex-col gap-3 flex-1">
                      {/* Name */}
                      <h3 className="font-bold text-[16px] text-gray-800 tracking-tight leading-tight">
                        {table.name}
                      </h3>

                      {/* Seats + ID row */}
                      <div className="flex items-end justify-between">
                        <div>
                          <span className={`text-[24px] font-extrabold leading-none ${seatsBg.replace("bg-", "text-")}`}>
                            {table.seats}
                          </span>
                          <p className="text-[11px] text-gray-400 font-medium">people</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[13px] font-bold text-gray-600">ID: {table.tableId}</p>
                          <p className="text-[11px] text-gray-400">table number</p>
                        </div>
                      </div>

                      {/* Capacity Level */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[12px] font-semibold text-gray-500">Capacity Level</span>
                          <span className={`text-[12px] font-bold ${cap.color}`}>{cap.label}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-1.5 rounded-full bg-[#7c3aed] transition-all duration-500"
                            style={{ width: `${cap.pct}%` }}
                          />
                        </div>
                      </div>

                      {/* Quick Adjust */}
                      <div className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
                        <button
                          onClick={() => adjustSeats(table.id, -1)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-colors shadow-sm"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <div className="text-center">
                          <p className="text-[11px] font-semibold text-gray-500">Quick Adjust</p>
                          <p className="text-[10px] text-gray-400">±1 seat</p>
                        </div>
                        <button
                          onClick={() => adjustSeats(table.id, 1)}
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
                          onClick={() => deleteTable(table.id)}
                          className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-[#fff5f5] text-gray-500 hover:text-[#ff3b30] font-bold text-[13px] py-2.5 rounded-xl border border-gray-200 hover:border-[#ffcdd2] transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="py-20 text-center text-gray-400">
            <Search className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No tables found.</p>
            <p className="text-sm mt-1">Try adjusting your search or filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
