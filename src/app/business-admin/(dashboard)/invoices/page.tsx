"use client";

import { useState } from "react";
import {
  FileText,
  TrendingUp,
  Clock,
  Download,
  Search,
  CreditCard,
  Calendar,
  CheckCircle,
  XCircle,
} from "lucide-react";

type Invoice = {
  id: string;
  table: string;
  date: string;
  paymentMethod: "Card" | "Cash" | "Online";
  amount: number;
  items: number;
  status: "Paid" | "Pending" | "Cancelled";
};

const initialInvoices: Invoice[] = [
  {
    id: "inv1776234419224",
    table: "Table 12",
    date: "Apr 14, 2026",
    paymentMethod: "Card",
    amount: 48.97,
    items: 2,
    status: "Pending",
  },
  {
    id: "inv1776234419100",
    table: "Patio 3",
    date: "Apr 14, 2026",
    paymentMethod: "Cash",
    amount: 36.95,
    items: 3,
    status: "Paid",
  },
  {
    id: "inv1776234418890",
    table: "Table 5",
    date: "Apr 13, 2026",
    paymentMethod: "Card",
    amount: 34.97,
    items: 2,
    status: "Pending",
  },
  {
    id: "inv1776234418750",
    table: "VIP Booth 1",
    date: "Apr 13, 2026",
    paymentMethod: "Online",
    amount: 126.50,
    items: 6,
    status: "Paid",
  },
  {
    id: "inv1776234418600",
    table: "Bar Counter 1",
    date: "Apr 12, 2026",
    paymentMethod: "Card",
    amount: 18.99,
    items: 1,
    status: "Cancelled",
  },
];

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [search, setSearch] = useState("");

  const totalRevenue = invoices
    .filter((i) => i.status === "Paid")
    .reduce((s, i) => s + i.amount, 0);

  const pendingAmount = invoices
    .filter((i) => i.status === "Pending")
    .reduce((s, i) => s + i.amount, 0);

  const pendingCount = invoices.filter((i) => i.status === "Pending").length;
  const paidCount = invoices.filter((i) => i.status === "Paid").length;

  const filtered = invoices.filter(
    (i) =>
      i.id.toLowerCase().includes(search.toLowerCase()) ||
      i.table.toLowerCase().includes(search.toLowerCase())
  );

  const markPaid = (id: string) => {
    setInvoices((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: "Paid" } : i))
    );
  };

  const cancelInvoice = (id: string) => {
    setInvoices((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: "Cancelled" } : i))
    );
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#eef2ff] rounded-xl flex items-center justify-center">
          <FileText className="w-5 h-5 text-[#3b82f6]" />
        </div>
        <div>
          <h2 className="font-bold text-[18px] text-gray-800 tracking-tight leading-tight">
            Invoices
          </h2>
          <p className="text-[13px] text-gray-400 font-medium">Track revenue</p>
        </div>
      </div>

      {/* Stats Cards — 3 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Revenue */}
        <div className="bg-[#f0fdf4] rounded-2xl p-5 border border-green-100 flex items-center gap-4">
          <div className="w-10 h-10 bg-[#00c853] rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-sm shadow-green-200">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide">
              Total Revenue
            </p>
            <p className="text-[24px] font-extrabold text-gray-800 leading-tight">
              ${totalRevenue.toFixed(2)}
            </p>
            <p className="text-[12px] text-gray-400 font-medium">{paidCount} paid</p>
          </div>
        </div>

        {/* Pending Payments */}
        <div className="bg-[#fff7ed] rounded-2xl p-5 border border-orange-100 flex items-center gap-4">
          <div className="w-10 h-10 bg-[#ff6b00] rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-sm shadow-orange-200">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide">
              Pending Payments
            </p>
            <p className="text-[24px] font-extrabold text-gray-800 leading-tight">
              ${pendingAmount.toFixed(2)}
            </p>
            <p className="text-[12px] text-gray-400 font-medium">{pendingCount} pending</p>
          </div>
        </div>

        {/* Total Invoices */}
        <div className="bg-[#eef2ff] rounded-2xl p-5 border border-blue-100 flex items-center gap-4">
          <div className="w-10 h-10 bg-[#3b82f6] rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-sm shadow-blue-200">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide">
              Total Invoices
            </p>
            <p className="text-[24px] font-extrabold text-gray-800 leading-tight">
              {invoices.length}
            </p>
            <p className="text-[12px] text-gray-400 font-medium">All time</p>
          </div>
        </div>
      </div>

      {/* All Invoices Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Card Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-400" />
            <span className="font-bold text-[15px] text-gray-800">All Invoices</span>
          </div>
          <button className="flex items-center gap-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-gray-50">
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-2.5 border border-transparent focus-within:border-[#3b82f6] focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
            <Search className="w-[15px] h-[15px] text-gray-400 flex-shrink-0" strokeWidth={2.5} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoices by ID or customer..."
              className="outline-none text-[13px] text-gray-700 w-full bg-transparent placeholder-gray-400"
            />
          </div>
        </div>

        {/* Table — scrollable on mobile */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-6 py-3.5 text-[12px] font-bold text-gray-500 uppercase tracking-wide">
                  Invoice ID
                </th>
                <th className="text-left px-4 py-3.5 text-[12px] font-bold text-gray-500 uppercase tracking-wide">
                  Table
                </th>
                <th className="text-left px-4 py-3.5 text-[12px] font-bold text-gray-500 uppercase tracking-wide">
                  Date
                </th>
                <th className="text-left px-4 py-3.5 text-[12px] font-bold text-gray-500 uppercase tracking-wide">
                  Payment Method
                </th>
                <th className="text-left px-4 py-3.5 text-[12px] font-bold text-gray-500 uppercase tracking-wide">
                  Amount
                </th>
                <th className="text-left px-4 py-3.5 text-[12px] font-bold text-gray-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="text-right px-6 py-3.5 text-[12px] font-bold text-gray-500 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length > 0 ? (
                filtered.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-gray-50/60 transition-colors group"
                  >
                    {/* Invoice ID */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-[#eef2ff] rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText className="w-3.5 h-3.5 text-[#3b82f6]" />
                        </div>
                        <span className="font-semibold text-[13px] text-gray-700 font-mono">
                          {inv.id}
                        </span>
                      </div>
                    </td>

                    {/* Table */}
                    <td className="px-4 py-4 text-[13px] font-semibold text-gray-700">
                      {inv.table}
                    </td>

                    {/* Date */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 text-[13px] text-gray-600">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {inv.date}
                      </div>
                    </td>

                    {/* Payment Method */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 text-[13px] text-gray-600">
                        <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                        {inv.paymentMethod}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-4">
                      <p className="text-[14px] font-bold text-[#3b82f6]">
                        ${inv.amount.toFixed(2)}
                      </p>
                      <p className="text-[11px] text-gray-400">{inv.items} items</p>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      {inv.status === "Paid" && (
                        <span className="inline-flex items-center gap-1 bg-[#f0fdf4] text-[#00c853] border border-green-200 text-[12px] font-bold px-3 py-1 rounded-full">
                          Paid
                        </span>
                      )}
                      {inv.status === "Pending" && (
                        <span className="inline-flex items-center gap-1 bg-[#fff7ed] text-[#ff6b00] border border-orange-200 text-[12px] font-bold px-3 py-1 rounded-full">
                          Pending
                        </span>
                      )}
                      {inv.status === "Cancelled" && (
                        <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-500 border border-gray-200 text-[12px] font-bold px-3 py-1 rounded-full">
                          Cancelled
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {inv.status === "Pending" && (
                          <>
                            <button
                              onClick={() => markPaid(inv.id)}
                              className="flex items-center gap-1.5 bg-[#00c853] hover:bg-[#00b047] text-white text-[12px] font-bold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Mark Paid
                            </button>
                            <button
                              onClick={() => cancelInvoice(inv.id)}
                              className="flex items-center gap-1.5 bg-white hover:bg-red-50 text-[#ff3b30] text-[12px] font-bold px-3 py-1.5 rounded-lg border border-[#ff3b30]/30 hover:border-[#ff3b30] transition-colors"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Cancel
                            </button>
                          </>
                        )}
                        {inv.status === "Paid" && (
                          <button className="flex items-center gap-1.5 border border-gray-200 text-gray-500 hover:bg-gray-50 text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-colors">
                            <Download className="w-3.5 h-3.5" />
                            Download
                          </button>
                        )}
                        {inv.status === "Cancelled" && (
                          <span className="text-[12px] text-gray-400 font-medium">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-400">
                    <Search className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">No invoices found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
