"use client";

import { Suspense, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Box,
  CircleDollarSign,
  Loader2,
  Mic,
  Package,
  Plus,
  Printer,
  RotateCcw,
  Scale,
  Search,
  Trash2,
  X,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import AdminShell from "@/components/admin/AdminShell";
import { useIngredients, Ingredient } from "@/hooks/useIngredients";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function IngredientsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const impersonatedBusinessId = searchParams.get("businessId");
  
  const { ingredients, loading, actionLoading, error, createIngredient, refetch } = useIngredients();
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    quantity: 0,
    unit: "KG",
  });

  const units = [
    { id: "KG", en: "KG", ur: "کلو" },
    { id: "Half KG", en: "Half KG", ur: "آدھا کلو" },
    { id: "Pao", en: "Pao", ur: "پاؤ" },
    { id: "Unit", en: "Unit", ur: "عدد" },
  ];

  const totalValue = useMemo(() => {
    return 0;
  }, [ingredients]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return toast.error("Ingredient name is required");
    
    try {
      await createIngredient(form);
      toast.success("Ingredient added successfully");
      setIsAddOpen(false);
      setForm({ name: "", quantity: 0, unit: "KG" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add ingredient");
    }
  };

  return (
    <AdminShell activeTab="products">
      <main className="w-full space-y-6 px-0">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="rounded-full p-2 hover:bg-gray-100 transition"
            >
              <ArrowLeft className="h-6 w-6 text-black" />
            </button>
            <h1 className="text-2xl font-bold text-[#111827]">Inventory & Ingredients</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="rounded-xl bg-[#eefdf5] p-3 text-[#16a34a] transition hover:bg-[#dcfce7]">
              <Printer className="h-5 w-5" />
            </button>
            <button
              onClick={() => refetch()}
              className="rounded-xl bg-[#fff2f2] p-3 text-[#ef4444] transition hover:bg-[#fee2e2]"
            >
              <RotateCcw className={cn("h-5 w-5", loading && "animate-spin")} />
            </button>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-[24px] border border-orange-100 bg-[#fff9f0] p-6 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm">
              <Box className="h-6 w-6 text-[#f97316]" />
            </div>
            <div>
              <p className="text-xs  font-bold uppercase tracking-wider text-gray-500">Total Items</p>
              <p className="text-2xl font-black text-[#f97316]">{ingredients.length}</p>
            </div>
          </div>

          <div className="rounded-[24px] border border-green-100 bg-[#f0fdf4] p-6 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm">
              <CircleDollarSign className="h-6 w-6 text-[#16a34a]" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Inventory Value</p>
              <p className="text-2xl font-black text-[#16a34a]">Rs. {totalValue}</p>
            </div>
          </div>
        </div>

        {/* List Section */}
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="h-10 w-10 animate-spin text-[#ef4444]" />
          </div>
        ) : ingredients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="mb-6 rounded-full bg-gray-50 p-10">
              <Box className="h-20 w-20 text-gray-200" />
            </div>
            <p className="text-lg font-bold text-[#111827]">Your inventory is empty</p>
            <button
              onClick={() => refetch()}
              className="mt-6 rounded-full bg-[#ef4444] px-8 py-3 text-sm font-bold text-[#ffffff] shadow-lg transition hover:bg-[#dc2626]"
            >
              Refresh Data
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {ingredients.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-3xl border bg-white p-5 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="rounded-2xl bg-gray-50 p-4">
                    <Box className="h-6 w-6 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#111827]">{item.name}</h3>
                    <p className="text-sm text-gray-500">{item.quantity} {item.unit}</p>
                  </div>
                </div>
                <button className="rounded-xl bg-[#fff2f2] p-3 text-[#ef4444] transition hover:bg-[#fee2e2]">
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Floating Add Button */}
        <div className="fixed bottom-8 right-8 z-50">
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 rounded-2xl bg-[#ef4444] px-6 py-4 font-bold text-[#ffffff] shadow-2xl transition hover:scale-105 active:scale-95"
          >
            <Plus className="h-5 w-5" /> Add Ingredient
          </button>
        </div>

        {/* Add Ingredient Dialog */}
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent className="max-w-md p-8 rounded-[40px] border-none shadow-2xl">
            <DialogHeader className="mb-8">
              <DialogTitle className="text-3xl font-black text-[#111827]">Add Ingredient</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSave} className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Box className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-[#ef4444]" />
                  <input
                    value={form.name}
                    onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Ingredient Name (English or ..."
                    className="w-full rounded-[24px] bg-[#f8fafc] py-4 pl-14 pr-4 font-medium outline-none transition focus:ring-2 focus:ring-[#ef4444]/20"
                  />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <button type="button" className="rounded-full border-2 border-[#ef4444] p-3 text-[#ef4444] transition hover:bg-[#fff5f5]">
                    <Mic className="h-6 w-6" />
                  </button>
                  <span className="text-[10px] font-bold text-gray-400">Hold</span>
                </div>
              </div>

                <div className="grid grid-cols-[1fr_1.4fr] gap-4">
                  <div className="relative">
                    <Scale className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-[#ef4444]" />
                    <input
                      type="number"
                      value={form.quantity}
                      onChange={(e) => setForm(p => ({ ...p, quantity: Number(e.target.value) }))}
                      placeholder="Quantity"
                      className="w-full rounded-[24px] bg-[#f8fafc] py-4 pl-14 pr-4 font-medium outline-none"
                    />
                  </div>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <Package className="h-5 w-5 text-[#ef4444]" />
                    </div>
                    <select
                      value={form.unit}
                      onChange={(e) => setForm(p => ({ ...p, unit: e.target.value }))}
                      className="w-full appearance-none rounded-[24px] bg-[#f8fafc] py-4 pl-12 pr-10 text-sm font-bold outline-none cursor-pointer"
                    >
                      {units.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.en} — {u.ur}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </div>
                    <label className="absolute -top-2 left-4 bg-white px-1 text-[10px] font-bold text-gray-400">Unit</label>
                  </div>
                </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="rounded-[24px] border-2 border-[#e5e7eb] bg-white py-4 font-bold text-[#6366f1] transition hover:bg-gray-50"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-[24px] bg-[#ef4444] py-4 font-bold text-[#ffffff] shadow-xl transition hover:bg-[#dc2626] disabled:opacity-50"
                >
                  {actionLoading ? "Saving..." : "Save Item"}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </AdminShell>
  );
}

export default function IngredientsPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-[#ef4444]" /></div>}>
      <IngredientsContent />
    </Suspense>
  );
}
