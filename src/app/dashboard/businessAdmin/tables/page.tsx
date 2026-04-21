"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Bot, ChevronLeft, ChevronRight, Edit, GripVertical, Loader2, Plus, Search, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import AdminShell from "@/components/admin/AdminShell";
import { useAuth } from "@/hooks/useAuth";
import { TableRecord, TableStatus, useTables } from "@/hooks/useTables";
import { normalizeErrorMessage } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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

function statusColor(status: TableStatus) {
  if (status === "available") return "bg-[#16a34a]";
  if (status === "occupied") return "bg-[#ef4444]";
  return "bg-[#f59e0b]";
}

function statusLabel(status: TableStatus) {
  if (status === "available") return "Available";
  if (status === "occupied") return "Occupied";
  return "Reserved";
}

function TableCard({
  table,
  onEdit,
  onDelete,
  deleting,
}: {
  table: TableRecord;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  deleting: boolean;
}) {
  const imageUrl = table.image
    ? (table.image.startsWith("http") ? table.image : `https://vendor.umazing.shop/${table.image}`)
    : "/business/pic1.jpeg";

  return (
    <article className="overflow-hidden rounded-[28px] border border-[#e4e8f0] bg-white shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
      <div className="relative h-52">
        <Image src={imageUrl} alt={table.tableNumber} fill sizes="(max-width: 640px) 100vw, 25vw" className="object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.05)_0%,rgba(15,23,42,0.28)_100%)]" />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-white bg-[#4f46e5]">
          <Users className="h-3.5 w-3.5" /> {table.capacity} Seats
        </span>
        <span className={`absolute right-3 top-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-white ${statusColor(table.status)}`}>
          <GripVertical className="h-3.5 w-3.5" /> {statusLabel(table.status)}
        </span>
      </div>

      <div className="space-y-4 p-4">
        <div>
          <h3 className="text-xl font-semibold text-[#111827]">{table.tableNumber}</h3>
          <div className="mt-2 flex items-end justify-between text-sm text-[#6b7280]">
            <span>{table.capacity} people</span>
            <span>ID: {table.id}</span>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between text-sm text-[#6b7280]">
            <span>Capacity Level</span>
            <span className="font-medium text-[#4f46e5]">{table.capacity <= 2 ? "Small" : table.capacity <= 4 ? "Medium" : table.capacity <= 6 ? "Large" : "XL"}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#edf2f7]">
            <div className="h-full rounded-full bg-[#635bff]" style={{ width: `${Math.min((table.capacity / 8) * 100, 100)}%` }} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => onEdit(table.id)} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#e3e7f0] bg-white px-4 py-3 text-sm font-semibold text-[#222]">
            <Edit className="h-4 w-4" /> Edit
          </button>
          <button type="button" onClick={() => onDelete(table.id)} disabled={deleting} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#fde2e4] bg-white px-4 py-3 text-sm font-semibold text-[#ef4444] disabled:opacity-60">
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      </div>
    </article>
  );
}

export default function TablesPage() {
  const router = useRouter();
  const { role } = useAuth();
  const searchParams = useSearchParams();
  const impersonatedBusinessId = searchParams.get("businessId");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TableStatus | "all">("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState({
    tableNumber: "",
    capacity: 1,
    status: "available" as TableStatus,
    image: null as File | null,
  });

  const [editForm, setEditForm] = useState({
    tableNumber: "",
    capacity: 1,
    status: "available" as TableStatus,
    image: null as File | null,
  });

  const {
    tables,
    loading,
    actionLoading,
    error,
    pagination,
    getTableById,
    createTable,
    updateTable,
    deleteTable,
  } = useTables({ page: currentPage });

  useEffect(() => {
    const storedRole = typeof window !== "undefined" ? localStorage.getItem("roleName") : null;
    const currentRole = role ?? storedRole;

    if (!currentRole) {
      router.replace("/login?role=business_admin&title=Business%20Admin&subtitle=Admin");
      return;
    }

    const isBusinessRole = currentRole === "business_admin";
    const isSuperAdminImpersonating = currentRole === "super_admin" && !!impersonatedBusinessId;

    if (!isBusinessRole && !isSuperAdminImpersonating) {
      router.replace("/dashboard");
      return;
    }

    setIsAuthorized(true);
  }, [role, router, impersonatedBusinessId]);

  const filteredTables = useMemo(() => {
    return tables.filter((table) => {
      const matchesStatus = status === "all" || table.status === status;
      const matchesSearch = table.tableNumber.toLowerCase().includes(search.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [search, status, tables]);

  const stats = useMemo(() => {
    const totalCapacity = tables.reduce((sum, table) => sum + table.capacity, 0);
    const averageCapacity = tables.length ? totalCapacity / tables.length : 0;
    const availableCount = tables.filter((table) => table.status === "available").length;

    return {
      totalCapacity,
      averageCapacity,
      availableCount,
    };
  }, [tables]);

  const resetCreate = () => {
    setCreateForm({ tableNumber: "", capacity: 1, status: "available", image: null });
  };

  const resetEdit = () => {
    setEditForm({ tableNumber: "", capacity: 1, status: "available", image: null });
    setEditId(null);
  };

  const onCreateSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!createForm.tableNumber.trim()) {
      toast.error("Table number is required");
      return;
    }

    try {
      await createTable({
        tableNumber: createForm.tableNumber.trim(),
        capacity: Number(createForm.capacity),
        status: createForm.status,
        image: createForm.image,
      });
      toast.success("Table created successfully");
      setCreateOpen(false);
      resetCreate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create table");
    }
  };

  const onOpenEdit = async (id: string) => {
    try {
      const table = await getTableById(id);
      setEditId(id);
      setEditForm({
        tableNumber: table.tableNumber,
        capacity: table.capacity,
        status: table.status,
        image: null,
      });
      setEditOpen(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load table details");
    }
  };

  const onEditSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editId) {
      return;
    }

    if (!editForm.tableNumber.trim()) {
      toast.error("Table number is required");
      return;
    }

    try {
      await updateTable(editId, {
        tableNumber: editForm.tableNumber.trim(),
        capacity: Number(editForm.capacity),
        status: editForm.status,
        image: editForm.image,
      });
      toast.success("Table updated successfully");
      setEditOpen(false);
      resetEdit();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update table");
    }
  };

  const onDelete = async (id: string) => {
    const confirmed = typeof window !== "undefined" ? window.confirm("Delete this table?") : false;
    if (!confirmed) {
      return;
    }

    try {
      await deleteTable(id);
      toast.success("Table deleted successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete table");
    }
  };

  if (!isAuthorized) return null;

  return (
    <AdminShell activeTab="tables">
      <main className="min-h-screen ">
        <div className="mx-auto max-w-7xl space-y-5">
          <section className="rounded-[28px] border border-white bg-white/85 p-5 shadow-[0_14px_28px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#635bff] text-white shadow-[0_10px_18px_rgba(99,91,255,0.22)]">
                  <Bot className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-[#111827]">Restaurant Tables</h1>
                  <p className="text-sm text-[#6b7280]">Manage seating arrangements</p>
                </div>
              </div>

              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger asChild>
                  <button type="button" className="inline-flex items-center gap-2 rounded-2xl bg-[#635bff] px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(99,91,255,0.24)]">
                    <Plus className="h-4 w-4" /> Add Table
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Table</DialogTitle>
                    <DialogDescription>Create a new table. Image is optional.</DialogDescription>
                  </DialogHeader>
                  <form className="space-y-4" onSubmit={onCreateSubmit}>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#111827]" htmlFor="tableNumber">Table Number</label>
                      <input
                        id="tableNumber"
                        value={createForm.tableNumber}
                        onChange={(event) => setCreateForm((prev) => ({ ...prev, tableNumber: event.target.value }))}
                        className="w-full rounded-xl border border-[#dbe3ef] px-3 py-2 text-sm outline-none focus:border-[#635bff]"
                        placeholder="e.g. T06"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#111827]" htmlFor="capacity">Capacity</label>
                      <input
                        id="capacity"
                        type="number"
                        min={1}
                        value={createForm.capacity}
                        onChange={(event) => setCreateForm((prev) => ({ ...prev, capacity: Number(event.target.value) }))}
                        className="w-full rounded-xl border border-[#dbe3ef] px-3 py-2 text-sm outline-none focus:border-[#635bff]"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#111827]" htmlFor="status">Status</label>
                      <select
                        id="status"
                        value={createForm.status}
                        onChange={(event) => setCreateForm((prev) => ({ ...prev, status: event.target.value as TableStatus }))}
                        className="w-full rounded-xl border border-[#dbe3ef] px-3 py-2 text-sm outline-none focus:border-[#635bff]"
                      >
                        <option value="available">available</option>
                        <option value="occupied">occupied</option>
                        <option value="reserved">reserved</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#111827]" htmlFor="image">Image (optional)</label>
                      <input
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={(event) => setCreateForm((prev) => ({ ...prev, image: event.target.files?.[0] ?? null }))}
                        className="w-full rounded-xl border border-[#dbe3ef] px-3 py-2 text-sm"
                      />
                    </div>

                    <button type="submit" disabled={actionLoading} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#635bff] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                      {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Create Table
                    </button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-3xl border border-[#c6d1ff] bg-[#eef1ff] px-5 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
              <p className="text-sm font-medium text-[#5b6475]">Total Tables</p>
              <strong className="text-3xl font-semibold text-[#0f172a]">{pagination.total}</strong>
            </article>
            <article className="rounded-3xl border border-[#bcf0cb] bg-[#effdf2] px-5 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
              <p className="text-sm font-medium text-[#5b6475]">Total Capacity</p>
              <strong className="text-3xl font-semibold text-[#0f172a]">{stats.totalCapacity}</strong>
            </article>
            <article className="rounded-3xl border border-[#ead3ff] bg-[#faf2ff] px-5 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
              <p className="text-sm font-medium text-[#5b6475]">Avg Capacity</p>
              <strong className="text-3xl font-semibold text-[#0f172a]">{stats.averageCapacity.toFixed(1)}</strong>
            </article>
            <article className="rounded-3xl border border-[#ffd7b0] bg-[#fff6ec] px-5 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
              <p className="text-sm font-medium text-[#5b6475]">Available Tables</p>
              <strong className="text-3xl font-semibold text-[#0f172a]">{stats.availableCount}</strong>
            </article>
          </section>

          <section className="rounded-3xl border border-white bg-white/85 p-4 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex h-12 flex-1 items-center gap-3 rounded-2xl bg-[#f5f7fb] px-4 text-[#94a3b8]">
                <Search className="h-5 w-5" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tables..." className="w-full bg-transparent text-sm outline-none placeholder:text-[#94a3b8]" />
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  { label: "All", value: "all" as const },
                  { label: "Available", value: "available" as const },
                  { label: "Occupied", value: "occupied" as const },
                  { label: "Reserved", value: "reserved" as const },
                ].map((item) => {
                  const active = status === item.value;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => setStatus(item.value)}
                      className={`inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${
                        active ? "bg-[#635bff] text-white shadow-[0_10px_20px_rgba(99,91,255,0.18)]" : "border border-[#e3e7f0] bg-white text-[#222] hover:bg-[#f8fbff]"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {error ? <ErrorAlert message={error} /> : null}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#4f46e5]" />
            </div>
          ) : filteredTables.length === 0 ? (
            <div className="rounded-2xl border border-[#e3e7f0] bg-white p-8 text-center">
              <Bot className="mx-auto mb-3 h-12 w-12 text-[#94a3b8]" />
              <p className="text-[#667085]">No tables found</p>
            </div>
          ) : (
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {filteredTables.map((table) => (
                <TableCard key={table.id} table={table} onEdit={onOpenEdit} onDelete={onDelete} deleting={actionLoading} />
              ))}
            </section>
          )}

          {pagination.last_page > 1 && !search ? (
            <section className="flex items-center justify-between rounded-2xl border border-[#e3e7f0] bg-white p-4">
              <div className="text-sm text-[#667085]">
                Page <strong>{pagination.page}</strong> of <strong>{pagination.last_page}</strong> ({pagination.total} total tables)
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#e3e7f0] bg-white px-3 py-2 text-sm font-medium text-[#222] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(pagination.last_page, prev + 1))}
                  disabled={currentPage === pagination.last_page}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#e3e7f0] bg-white px-3 py-2 text-sm font-medium text-[#222] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </section>
          ) : null}

          <Dialog
            open={editOpen}
            onOpenChange={(open) => {
              setEditOpen(open);
              if (!open) {
                resetEdit();
              }
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Table</DialogTitle>
                <DialogDescription>Edit table details or replace image.</DialogDescription>
              </DialogHeader>
              <form className="space-y-4" onSubmit={onEditSubmit}>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#111827]" htmlFor="editTableNumber">Table Number</label>
                  <input
                    id="editTableNumber"
                    value={editForm.tableNumber}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, tableNumber: event.target.value }))}
                    className="w-full rounded-xl border border-[#dbe3ef] px-3 py-2 text-sm outline-none focus:border-[#635bff]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#111827]" htmlFor="editCapacity">Capacity</label>
                  <input
                    id="editCapacity"
                    type="number"
                    min={1}
                    value={editForm.capacity}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, capacity: Number(event.target.value) }))}
                    className="w-full rounded-xl border border-[#dbe3ef] px-3 py-2 text-sm outline-none focus:border-[#635bff]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#111827]" htmlFor="editStatus">Status</label>
                  <select
                    id="editStatus"
                    value={editForm.status}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, status: event.target.value as TableStatus }))}
                    className="w-full rounded-xl border border-[#dbe3ef] px-3 py-2 text-sm outline-none focus:border-[#635bff]"
                  >
                    <option value="available">available</option>
                    <option value="occupied">occupied</option>
                    <option value="reserved">reserved</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#111827]" htmlFor="editImage">Replace Image</label>
                  <input
                    id="editImage"
                    type="file"
                    accept="image/*"
                    onChange={(event) => setEditForm((prev) => ({ ...prev, image: event.target.files?.[0] ?? null }))}
                    className="w-full rounded-xl border border-[#dbe3ef] px-3 py-2 text-sm"
                  />
                </div>

                <button type="submit" disabled={actionLoading} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#635bff] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Update Table
                </button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </AdminShell>
  );
}
