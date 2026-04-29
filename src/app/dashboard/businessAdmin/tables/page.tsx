"use client";

import Image from "next/image";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Box, ChevronLeft, ChevronRight, Edit, Loader2, Plus, Search, Trash2, Users, LayoutGrid, RotateCcw, Image as ImageIcon, Save, X } from "lucide-react";
import { toast } from "sonner";
import AdminShell from "@/components/admin/AdminShell";
import { useAuth } from "@/hooks/useAuth";
import { TableRecord, TableStatus, useTables } from "@/hooks/useTables";
import { cn, normalizeErrorMessage } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BASE_URL } from "@/lib/constant";

function ErrorAlert({ message }: { message: unknown }) {
  const errorMessage = normalizeErrorMessage(message, "Error loading tables");
  return (
    <div className="rounded-2xl border border-[#fecaca] bg-[#fff1f1] p-4 flex items-start gap-3">
      <AlertCircle className="h-5 w-5 text-[#ef4444] shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold text-[#ef4444]">Error loading tables</p>
        <p className="text-sm text-[#dc2626]">{errorMessage}</p>
      </div>
    </div>
  );
}

function TableCard({
  table,
  onEdit,
}: {
  table: TableRecord;
  onEdit: (id: string) => void;
}) {
  const imageUrl = table.image
    ? (table.image.startsWith("http") ? table.image : `${BASE_URL}/${table.image}`)
    : "/business/pic1.jpeg";

  return (
    <article className="overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="relative h-48">
        <Image src={imageUrl} alt={table.tableNumber} fill sizes="(max-width: 640px) 100vw, 25vw" className="object-cover" />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-2 rounded-full bg-[#00c853] px-3 py-1 text-[10px] font-black text-white uppercase tracking-wider">
          <Users className="h-3 w-3" /> {table.capacity} Seats
        </div>
        <div className="absolute top-3 right-3 flex items-center gap-2 rounded-full bg-[#6366f1] px-3 py-1 text-[10px] font-black text-white uppercase tracking-wider">
          <LayoutGrid className="h-3 w-3" /> Table
        </div>
        
        {!table.image && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 opacity-40">
            <ImageIcon className="h-10 w-10 text-slate-400" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">No Image</span>
          </div>
        )}
      </div>

      <div className="p-6 flex flex-col gap-4">
        <div>
          <h3 className="text-lg font-black text-[#111827]">{table.tableNumber}</h3>
          <p className="text-sm font-bold text-slate-400">
            <span className="text-[#6366f1]">{table.capacity}</span> people
          </p>
        </div>

        <button 
          type="button" 
          onClick={() => onEdit(table.id)} 
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs font-black text-slate-500 hover:bg-slate-50 transition-colors"
        >
          <Edit className="h-4 w-4" /> Edit
        </button>
      </div>
    </article>
  );
}

function TablesContent() {
  const router = useRouter();
  const { role } = useAuth();
  const searchParams = useSearchParams();
  const impersonatedBusinessId = searchParams.get("businessId");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [form, setForm] = useState({
    tableNumber: "",
    capacity: 1,
    image: null as File | null,
  });

  const {
    tables,
    loading,
    actionLoading,
    error,
    pagination,
    fetchTables,
    getTableById,
    createTable,
    updateTable,
  } = useTables({ page: currentPage });

  useEffect(() => {
    const storedRole = typeof window !== "undefined" ? localStorage.getItem("roleName") : null;
    const currentRole = role ?? storedRole;

    if (!currentRole) {
      router.replace("/login?role=business_admin&title=Business%20Admin&subtitle=Admin");
      return;
    }

    const isBusinessRole = currentRole === "business_admin" || currentRole === "super_admin";
    if (!isBusinessRole) {
      router.replace("/dashboard");
      return;
    }

    setIsAuthorized(true);
  }, [role, router, impersonatedBusinessId]);

  const resetForm = () => {
    setForm({ tableNumber: "", capacity: 1, image: null });
    setEditId(null);
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const toastId = toast.loading(editId ? "Updating table..." : "Creating table...");
    try {
      if (editId) {
        await updateTable(editId, { tableNumber: form.tableNumber.trim(), capacity: Number(form.capacity), status: "available", image: form.image });
      } else {
        await createTable({ tableNumber: form.tableNumber.trim(), capacity: Number(form.capacity), status: "available", image: form.image });
      }
      toast.success(editId ? "Table updated" : "Table created", { id: toastId });
      setCreateOpen(false);
      setEditOpen(false);
      resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed", { id: toastId });
    }
  };

  const onOpenEdit = async (id: string) => {
    const toastId = toast.loading("Loading table...");
    try {
      const table = await getTableById(id);
      setEditId(id);
      setForm({
        tableNumber: table.tableNumber,
        capacity: table.capacity,
        image: null,
      });
      toast.dismiss(toastId);
      setEditOpen(true);
    } catch (err) {
      toast.error("Failed to load details", { id: toastId });
    }
  };

  if (!isAuthorized) return null;

  return (
    <AdminShell activeTab="tables">
      <main className="h-[calc(100vh-80px)] overflow-hidden bg-[#f8fafc]">
        <div className="h-full flex flex-col p-6 space-y-6">
          
          {/* Header Section */}
          <section className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-[#ef4444] flex items-center justify-center shadow-lg shadow-red-100">
                  <Box className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-black text-[#111827]">Restaurant Tables</h1>
                  <p className="text-sm font-bold text-slate-400">Manage seating arrangements</p>
                </div>
              </div>

              <div className="flex items-center gap-4 border-l border-slate-100 pl-8">
                <div className="h-12 w-12 rounded-2xl bg-[#ef4444]/10 flex items-center justify-center">
                  <Box className="h-6 w-6 text-[#ef4444]" />
                </div>
                <div>
                  <p className="text-sm font-black text-[#111827]">Total Tables</p>
                  <p className="text-xs font-bold text-slate-400">{pagination.total}</p>
                </div>
              </div>
            </div>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <button type="button" className="flex items-center gap-2 bg-[#ef4444] text-white px-6 py-3 rounded-2xl font-black text-sm shadow-lg shadow-red-200 transition-all active:scale-95">
                  <Plus className="h-5 w-5" /> Add
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-xl rounded-[40px] p-0 overflow-hidden border-none shadow-2xl">
                <TableForm 
                  title="Add New Table" 
                  subtitle="Create a new table entry" 
                  form={form} 
                  setForm={setForm} 
                  onSubmit={onSubmit} 
                  onClose={() => setCreateOpen(false)}
                  loading={actionLoading}
                />
              </DialogContent>
            </Dialog>
          </section>

          {/* Tables Grid */}
          <section className="flex-1 overflow-hidden flex flex-col min-h-0">
            {error && <ErrorAlert message={error} />}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-20">
              {loading ? (
                <div className="h-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#ef4444]" /></div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {tables.map(table => (
                    <TableCard key={table.id} table={table} onEdit={onOpenEdit} />
                  ))}
                </div>
              )}
            </div>

            {/* Floating Refresh */}
            <button 
              onClick={() => fetchTables()}
              className="fixed bottom-8 right-8 h-14 w-14 rounded-2xl bg-[#ef4444] text-white shadow-xl shadow-red-200 flex items-center justify-center hover:scale-110 transition-all z-50 group"
            >
              <RotateCcw className={cn("h-6 w-6 transition-transform group-hover:rotate-180", loading && "animate-spin")} />
            </button>
          </section>
        </div>

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-xl rounded-[40px] p-0 overflow-hidden border-none shadow-2xl">
            <TableForm 
              title="Update Table" 
              subtitle="Modify existing table details" 
              form={form} 
              setForm={setForm} 
              onSubmit={onSubmit} 
              onClose={() => setEditOpen(false)}
              loading={actionLoading}
            />
          </DialogContent>
        </Dialog>
      </main>
    </AdminShell>
  );
}

function TableForm({ title, subtitle, form, setForm, onSubmit, onClose, loading }: any) {
  return (
    <div className="bg-white">
      <div className="p-8 pb-4 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black text-[#111827]">{title}</h3>
          <p className="text-xs font-bold text-slate-400">{subtitle}</p>
        </div>
        <button onClick={onClose} className="h-10 w-10 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors">
          <X className="h-5 w-5 text-slate-500" />
        </button>
      </div>

      <form className="p-8 space-y-6" onSubmit={onSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-black text-[#111827] uppercase tracking-tighter">Name</label>
          <input
            value={form.tableNumber}
            onChange={(e) => setForm((p: any) => ({ ...p, tableNumber: e.target.value }))}
            className="w-full h-14 bg-slate-100/50 rounded-2xl px-6 text-sm font-bold border-none outline-none focus:ring-2 ring-[#ef4444]/20 transition-all placeholder:text-slate-400"
            placeholder="Enter table name"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-black text-[#111827] uppercase tracking-tighter">Seating Capacity</label>
          <input
            type="number"
            min={1}
            value={form.capacity}
            onChange={(e) => setForm((p: any) => ({ ...p, capacity: Number(e.target.value) }))}
            className="w-full h-14 bg-slate-100/50 rounded-2xl px-6 text-sm font-bold border-none outline-none focus:ring-2 ring-[#ef4444]/20 transition-all"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-black text-[#111827] uppercase tracking-tighter">Image</label>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => document.getElementById("image-input")?.click()}
              className="flex items-center gap-3 bg-[#111827] text-white px-6 py-3 rounded-2xl text-xs font-black hover:bg-black transition-all shadow-lg shadow-slate-200"
            >
              <ImageIcon className="h-4 w-4" />
              Choose Image
            </button>
            <input
              id="image-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setForm((p: any) => ({ ...p, image: e.target.files?.[0] ?? null }))}
            />
            {form.image && <span className="text-[10px] font-bold text-[#ef4444] uppercase tracking-widest truncate max-w-[200px]">{form.image.name}</span>}
          </div>
        </div>

        <div className="pt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-8 py-3 rounded-2xl border border-slate-200 font-black text-sm text-slate-500 hover:bg-slate-50 transition-all">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="flex items-center gap-2 px-10 py-3 rounded-2xl bg-[#111827] text-white font-black text-sm shadow-xl shadow-slate-200 transition-all active:scale-95 disabled:opacity-60">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

export default function TablesPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#ef4444]" /></div>}>
      <TablesContent />
    </Suspense>
  );
}
