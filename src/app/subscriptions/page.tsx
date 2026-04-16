"use client";

import Image from "next/image";
import { Check, ChevronDown, CreditCard, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import AdminShell from "@/components/admin/AdminShell";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  useCreatePlanMutation,
  useDeletePlanByIdMutation,
  useGetPlansQuery,
  usePatchPlanByIdMutation,
  type CreatePlanPayload,
  type Plan,
} from "@/hooks/usePlan";

type RowItem = {
  name: string;
  owner: string;
  image: string;
  plan: "Enterprise" | "Premium" | "Basic";
  status: "Active" | "Inactive" | "Expired";
  expires: string;
  revenue: string;
};

type PlanFormState = {
  planName: string;
  displayName: string;
  price: string;
  description: string;
  features: string;
  duration: string;
  mostPopular: boolean;
  isActive: boolean;
};

const initialRows: RowItem[] = [
  { name: "The Golden Spoon", owner: "John Smith", image: "/business/pic1.jpeg", plan: "Enterprise", status: "Active", expires: "365 days", revenue: "$125.0K" },
  { name: "Pasta Palace", owner: "Maria Rossi", image: "/business/pic2.jpeg", plan: "Premium", status: "Active", expires: "183 days", revenue: "$89.0K" },
  { name: "Burger Haven", owner: "Mike Johnson", image: "/business/pic3.jpeg", plan: "Basic", status: "Active", expires: "92 days", revenue: "$45.0K" },
  { name: "Sushi World", owner: "Kenji Tanaka", image: "/business/pic4.jpeg", plan: "Premium", status: "Expired", expires: "Expired", revenue: "$67.0K" },
  { name: "Taco Fiesta", owner: "Carlos Rodriguez", image: "/business/pic5.jpeg", plan: "Basic", status: "Inactive", expires: "60 days", revenue: "$32.0K" },
];

const planOptions: RowItem["plan"][] = ["Basic", "Premium", "Enterprise"];
const statusOptions: RowItem["status"][] = ["Active", "Inactive", "Expired"];

const initialPlanForm: PlanFormState = {
  planName: "",
  displayName: "",
  price: "",
  description: "",
  features: "",
  duration: "monthly",
  mostPopular: false,
  isActive: true,
};

function parsePlanError(error: unknown, fallbackMessage = "Unable to complete this action. Please try again.") {
  if (typeof error !== "object" || error === null) {
    return fallbackMessage;
  }

  const response = error as {
    data?: unknown;
    error?: string;
    status?: number | string;
  };

  if (typeof response.error === "string" && response.error.trim()) {
    return response.error;
  }

  const data = response.data;
  if (typeof data === "string" && data.trim()) {
    return data;
  }

  if (data && typeof data === "object") {
    const payload = data as {
      message?: unknown;
      error?: unknown;
      errors?: unknown;
      detail?: unknown;
      details?: unknown;
    };

    const directMessage = [payload.message, payload.error, payload.detail, payload.details].find((value) => typeof value === "string" && value.trim());
    if (typeof directMessage === "string") {
      return directMessage;
    }

    if (Array.isArray(payload.errors)) {
      const messages = payload.errors.filter((value): value is string => typeof value === "string" && value.trim().length > 0);
      if (messages.length > 0) {
        return messages.join(". ");
      }
    }

    if (payload.errors && typeof payload.errors === "object") {
      const messages = Object.values(payload.errors as Record<string, unknown>)
        .flatMap((value) => (Array.isArray(value) ? value : [value]))
        .filter((value): value is string => typeof value === "string" && value.trim().length > 0);

      if (messages.length > 0) {
        return messages.join(". ");
      }
    }
  }

  return fallbackMessage;
}

function parseFeatures(features: string) {
  return features
    .split(/\n|,/)
    .map((feature) => feature.trim())
    .filter(Boolean);
}

function PlanCard({ plan, onEdit, onDelete }: { plan: Plan; onEdit: (plan: Plan) => void; onDelete: (plan: Plan) => void }) {
  const planName = plan.displayName || plan.planName;
  const features = plan.features || [];

  return (
    <article className="flex h-full flex-col rounded-3xl border border-[#e4ebf4] bg-white/90 p-5 shadow-[0_10px_24px_rgba(10,17,31,0.08)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-[#111827]">{planName}</h3>
          <p className="mt-1 text-sm text-[#667085]">{plan.description}</p>
        </div>

        <div className="flex items-start gap-2">
          <button
            type="button"
            onClick={() => onEdit(plan)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#e3e8f2] bg-white text-[#344054] transition hover:bg-[#f8fafc]"
            aria-label={`Edit ${planName}`}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(plan)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#fde2e4] bg-white text-[#dc2626] transition hover:bg-[#fff5f5]"
            aria-label={`Delete ${planName}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>

          <div className="text-right">
            <p className="text-xl font-semibold text-[#111827]">${plan.price}</p>
            <p className="text-xs uppercase tracking-[0.2em] text-[#8a93a8]">{plan.duration || "monthly"}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
        <span className={`inline-flex rounded-full px-3 py-1 ${plan.isActive ? "bg-[#e8f8ef] text-[#0f9d58]" : "bg-[#feecec] text-[#e11d48]"}`}>
          {plan.isActive ? "Active" : "Inactive"}
        </span>
        {plan.mostPopular ? <span className="inline-flex rounded-full bg-[#fff4df] px-3 py-1 text-[#b45309]">Most popular</span> : null}
        <span className="inline-flex rounded-full bg-[#eff6ff] px-3 py-1 text-[#1d4ed8]">{plan.subscribedBusinesses?.length ?? 0} businesses</span>
      </div>

      {features.length > 0 ? (
        <ul className="mt-5 space-y-2 text-sm text-[#344054]">
          {features.slice(0, 4).map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#0f9d58]" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-5 text-sm text-[#667085]">No features configured yet.</p>
      )}
    </article>
  );
}

export default function SubscriptionsPage() {
  const [rows, setRows] = useState(initialRows);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [isAddPlanOpen, setIsAddPlanOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [deleteTargetPlan, setDeleteTargetPlan] = useState<Plan | null>(null);
  const [form, setForm] = useState<PlanFormState>(initialPlanForm);
  const menuRef = useRef<HTMLDivElement>(null);
  const [createPlan, { isLoading: isCreatingPlan }] = useCreatePlanMutation();
  const [updatePlan, { isLoading: isUpdatingPlan }] = usePatchPlanByIdMutation();
  const [deletePlan, { isLoading: isDeletingPlan }] = useDeletePlanByIdMutation();
  const { data: planData, isFetching: isPlansFetching, isError: hasPlansError, refetch: refetchPlans } = useGetPlansQuery();

  const plans = useMemo(() => planData?.plans ?? [], [planData?.plans]);
  const editingPlan = useMemo(() => plans.find((plan) => plan.id === editingPlanId) ?? null, [editingPlanId, plans]);
  const isSavingPlan = isCreatingPlan || isUpdatingPlan;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function resetPlanForm() {
    setForm(initialPlanForm);
  }

  function openCreatePlanDialog() {
    setEditingPlanId(null);
    resetPlanForm();
    setIsAddPlanOpen(true);
  }

  function openEditPlanDialog(plan: Plan) {
    setEditingPlanId(plan.id);
    setForm({
      planName: plan.planName,
      displayName: plan.displayName || plan.planName,
      price: String(plan.price),
      description: plan.description,
      features: (plan.features || []).join("\n"),
      duration: plan.duration || "monthly",
      mostPopular: Boolean(plan.mostPopular),
      isActive: plan.isActive,
    });
    setIsAddPlanOpen(true);
  }

  function handlePlanDialogOpenChange(open: boolean) {
    setIsAddPlanOpen(open);

    if (!open) {
      setEditingPlanId(null);
      resetPlanForm();
    }
  }

  function updateRow(index: number, field: "plan" | "status", value: RowItem["plan"] | RowItem["status"]) {
    setRows((current) =>
      current.map((row, rowIndex) => {
        if (rowIndex !== index) return row;

        if (field === "status") {
          const nextStatus = value as RowItem["status"];
          return {
            ...row,
            status: nextStatus,
            expires: nextStatus === "Expired" ? "Expired" : row.expires === "Expired" ? "60 days" : row.expires,
          };
        }

        return { ...row, plan: value as RowItem["plan"] };
      }),
    );
    setOpenMenu(null);
  }

  async function handleSubmitPlan(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedPlanName = form.planName.trim();
    const trimmedDisplayName = form.displayName.trim();
    const trimmedDescription = form.description.trim();
    const features = parseFeatures(form.features);

    if (!trimmedPlanName || !trimmedDisplayName || !trimmedDescription) {
      toast.error("Plan name, display name, and description are required.");
      return;
    }

    const price = Number(form.price);
    if (!Number.isFinite(price) || price < 0) {
      toast.error("Enter a valid plan price.");
      return;
    }

    const payload: CreatePlanPayload = {
      planName: trimmedPlanName,
      displayName: trimmedDisplayName,
      price,
      description: trimmedDescription,
      features,
      duration: form.duration,
      mostPopular: form.mostPopular,
      isActive: form.isActive,
    };

    try {
      const savedPlan = editingPlanId ? await updatePlan({ id: editingPlanId, body: payload }).unwrap() : await createPlan(payload).unwrap();
      await refetchPlans();
      toast.success(`${savedPlan.displayName || savedPlan.planName} ${editingPlanId ? "updated" : "created"} successfully.`);
      setEditingPlanId(null);
      resetPlanForm();
      setIsAddPlanOpen(false);
    } catch (error) {
      toast.error(parsePlanError(error, editingPlanId ? "Unable to update plan. Please try again." : "Unable to create plan. Please try again."));
    }
  }

  async function handleDeletePlan(plan: Plan) {
    try {
      await deletePlan(plan.id).unwrap();
      await refetchPlans();
      toast.success(`${plan.displayName || plan.planName} deleted successfully.`);
      setDeleteTargetPlan(null);
    } catch (error) {
      toast.error(parsePlanError(error, "Unable to delete plan. Please try again."));
    }
  }

  return (
    <AdminShell activeTab="subscriptions">
      <section className="mx-auto mb-5 flex max-w-7xl flex-col gap-4 rounded-3xl border border-white bg-[linear-gradient(120deg,rgba(255,255,255,0.9),rgba(254,242,242,0.78))] px-6 py-5 shadow-[0_12px_28px_rgba(7,16,34,0.1)] lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#b45309] text-white shadow-[0_10px_18px_rgba(180,83,9,0.28)]">
            <CreditCard className="h-6 w-6" strokeWidth={1.8} />
          </div>
          <div>
            <h2 className="text-lg font-semibold lg:text-2xl">Subscription Management</h2>
            <p className="text-sm text-[#657084] lg:text-base">Manage plans, pricing, and billing access.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={openCreatePlanDialog}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#111827] px-5 text-sm font-semibold text-white transition hover:bg-[#0f172a]"
        >
          <Plus className="h-4 w-4" />
          Add Plan
        </button>
      </section>

      <section className="mx-auto mb-6 max-w-7xl rounded-3xl border border-[#e4ebf4] bg-white/90 p-6 shadow-[0_10px_24px_rgba(10,17,31,0.08)]">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-[#111827]">Available Plans</h3>
            <p className="text-sm text-[#667085]">Create new plans and keep the current catalog in sync.</p>
          </div>

          <div className="text-sm text-[#667085]">
            {isPlansFetching ? "Loading plans..." : `${plans.length} plan${plans.length === 1 ? "" : "s"}`}
          </div>
        </div>

        {hasPlansError ? (
          <div className="rounded-2xl border border-[#fde2e4] bg-[#fff5f5] px-4 py-3 text-sm text-[#b42318]">Unable to load plan catalog right now.</div>
        ) : plans.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {plans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} onEdit={openEditPlanDialog} onDelete={setDeleteTargetPlan} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#d8dde8] px-5 py-10 text-center text-sm text-[#667085]">
            No plans exist yet. Use <span className="font-semibold text-[#111827]">Add Plan</span> to create the first one.
          </div>
        )}
      </section>

      <div ref={menuRef} className="mx-auto max-w-7xl overflow-x-auto rounded-3xl border border-[#e4ebf4] bg-white/90 shadow-[0_10px_24px_rgba(10,17,31,0.1)]">
        <table className="w-full min-w-275 border-collapse">
          <thead>
            <tr className="border-b border-[#e2e5ee] bg-[#f8fbff] text-left text-sm">
              {["Business", "Current Plan", "Status", "Expires In", "Revenue", "Actions"].map((label) => (
                <th key={label} className="px-4 py-4 font-semibold text-[#111827]">
                  {label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((row, index) => (
              <tr key={row.name} className="border-b border-[#e8eaf0] text-sm transition hover:bg-[#f9fbff]">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 overflow-hidden rounded-xl bg-[#d7dbe4]">
                      <Image src={row.image} alt={row.name} width={48} height={48} className="h-full w-full object-cover" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#111827]">{row.name}</p>
                      <p className="text-xs text-[#677085]">{row.owner}</p>
                    </div>
                  </div>
                </td>

                <td className="relative px-4 py-4">
                  <button
                    type="button"
                    onClick={() => setOpenMenu(openMenu === `plan-${index}` ? null : `plan-${index}`)}
                    className="inline-flex h-10 min-w-35 items-center justify-between rounded-xl border border-[#dde5f0] bg-[#f8fbff] px-4 text-left text-[#111827]"
                  >
                    {row.plan}
                    <ChevronDown className="h-4 w-4 text-[#a0a8ba]" />
                  </button>

                  {openMenu === `plan-${index}` ? (
                    <div className="absolute left-4 top-16 z-20 min-w-35 overflow-hidden rounded-2xl border border-[#e3e6ef] bg-white shadow-[0_12px_24px_rgba(15,23,42,0.14)]">
                      {planOptions.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => updateRow(index, "plan", option)}
                          className={`flex w-full items-center justify-between px-4 py-3 text-left text-base transition ${row.plan === option ? "bg-[#eef0f6]" : "hover:bg-[#f8f9fc]"}`}
                        >
                          <span>{option}</span>
                          {row.plan === option ? <Check className="h-5 w-5 text-[#6b7280]" /> : null}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </td>

                <td className="relative px-4 py-4">
                  <button
                    type="button"
                    onClick={() => setOpenMenu(openMenu === `status-${index}` ? null : `status-${index}`)}
                    className="inline-flex h-10 min-w-35 items-center justify-between rounded-xl border border-[#dde5f0] bg-[#f8fbff] px-4 text-left text-[#111827]"
                  >
                    {row.status}
                    <ChevronDown className="h-4 w-4 text-[#a0a8ba]" />
                  </button>

                  {openMenu === `status-${index}` ? (
                    <div className="absolute left-4 top-16 z-20 min-w-35 overflow-hidden rounded-2xl border border-[#e3e6ef] bg-white shadow-[0_12px_24px_rgba(15,23,42,0.14)]">
                      {statusOptions.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => updateRow(index, "status", option)}
                          className={`flex w-full items-center justify-between px-4 py-3 text-left text-base transition ${row.status === option ? "bg-[#eef0f6]" : "hover:bg-[#f8f9fc]"}`}
                        >
                          <span>{option}</span>
                          {row.status === option ? <Check className="h-5 w-5 text-[#6b7280]" /> : null}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </td>

                <td className="px-4 py-4">
                  <span className={`inline-flex h-8 items-center rounded-full px-3 text-xs font-bold text-white ${row.expires === "Expired" ? "bg-[#ff3749]" : "bg-[#0bc35a]"}`}>
                    {row.expires}
                  </span>
                </td>

                <td className="px-4 py-4 font-semibold text-[#06ab54]">{row.revenue}</td>

                <td className="px-4 py-4">
                  <div className="inline-flex gap-2">
                    {["+3M", "+6M", "+12M"].map((btn) => (
                      <button key={btn} type="button" className="h-9 min-w-16 rounded-xl border border-[#d8dce4] bg-white px-3 text-xs font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] hover:bg-[#f8fbff]">
                        {btn}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={isAddPlanOpen} onOpenChange={handlePlanDialogOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingPlan ? "Edit Plan" : "Add Plan"}</DialogTitle>
            <DialogDescription>
              {editingPlan
                ? `Update ${editingPlan.displayName || editingPlan.planName} and publish the changes to the subscription catalog.`
                : "Create a new plan and publish it to the subscription catalog."}
            </DialogDescription>
          </DialogHeader>

          <form className="mt-6 space-y-5" onSubmit={handleSubmitPlan}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-[#344054]">Plan Name</span>
                <input
                  type="text"
                  value={form.planName}
                  onChange={(event) => setForm((current) => ({ ...current, planName: event.target.value }))}
                  placeholder="starter"
                  className="h-11 w-full rounded-2xl border border-[#d7dee9] bg-white px-4 text-sm outline-none transition placeholder:text-[#98a2b3] focus:border-[#b45309]"
                  required
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-[#344054]">Display Name</span>
                <input
                  type="text"
                  value={form.displayName}
                  onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))}
                  placeholder="Starter"
                  className="h-11 w-full rounded-2xl border border-[#d7dee9] bg-white px-4 text-sm outline-none transition placeholder:text-[#98a2b3] focus:border-[#b45309]"
                  required
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-[#344054]">Price</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
                  placeholder="29.99"
                  className="h-11 w-full rounded-2xl border border-[#d7dee9] bg-white px-4 text-sm outline-none transition placeholder:text-[#98a2b3] focus:border-[#b45309]"
                  required
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-[#344054]">Duration</span>
                <select
                  value={form.duration}
                  onChange={(event) => setForm((current) => ({ ...current, duration: event.target.value }))}
                  className="h-11 w-full rounded-2xl border border-[#d7dee9] bg-white px-4 text-sm outline-none transition focus:border-[#b45309]"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </label>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-medium text-[#344054]">Description</span>
              <textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Describe what this plan includes."
                rows={4}
                className="w-full rounded-2xl border border-[#d7dee9] bg-white px-4 py-3 text-sm outline-none transition placeholder:text-[#98a2b3] focus:border-[#b45309]"
                required
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-[#344054]">Features</span>
              <textarea
                value={form.features}
                onChange={(event) => setForm((current) => ({ ...current, features: event.target.value }))}
                placeholder="One feature per line or comma separated"
                rows={4}
                className="w-full rounded-2xl border border-[#d7dee9] bg-white px-4 py-3 text-sm outline-none transition placeholder:text-[#98a2b3] focus:border-[#b45309]"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-3 rounded-2xl border border-[#e4e8ef] px-4 py-3">
                <input
                  type="checkbox"
                  checked={form.mostPopular}
                  onChange={(event) => setForm((current) => ({ ...current, mostPopular: event.target.checked }))}
                  className="h-4 w-4 rounded border-[#d0d5dd] text-[#b45309] focus:ring-[#b45309]"
                />
                <span className="text-sm font-medium text-[#344054]">Mark as most popular</span>
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-[#e4e8ef] px-4 py-3">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
                  className="h-4 w-4 rounded border-[#d0d5dd] text-[#b45309] focus:ring-[#b45309]"
                />
                <span className="text-sm font-medium text-[#344054]">Publish immediately</span>
              </label>
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsAddPlanOpen(false)}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-[#d0d5dd] px-5 text-sm font-semibold text-[#344054] transition hover:bg-[#f8fafc]"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSavingPlan}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#111827] px-5 text-sm font-semibold text-white transition hover:bg-[#0f172a] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSavingPlan ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {isSavingPlan ? (editingPlanId ? "Updating..." : "Creating...") : editingPlanId ? "Update Plan" : "Create Plan"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleteTargetPlan)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTargetPlan(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete plan?</DialogTitle>
            <DialogDescription>
              {deleteTargetPlan
                ? `Are you sure you want to delete ${deleteTargetPlan.displayName || deleteTargetPlan.planName}? This action cannot be undone.`
                : "Are you sure you want to delete this plan? This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeleteTargetPlan(null)}
              className="inline-flex h-10 items-center rounded-xl border border-[#d7dbe4] px-4 text-sm font-semibold text-[#374151]"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isDeletingPlan || !deleteTargetPlan}
              onClick={() => {
                if (!deleteTargetPlan) return;
                void handleDeletePlan(deleteTargetPlan);
              }}
              className="inline-flex h-10 items-center rounded-xl bg-[#f2202f] px-4 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isDeletingPlan ? "Deleting..." : "Delete"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}