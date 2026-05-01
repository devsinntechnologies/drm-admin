"use client";

import Image from "next/image";
import {
  Building2,
  ChevronDown,
  Mail,
  MapPin,
  Phone,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { toast } from "sonner";
import { Suspense, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useGetPlansQuery } from "@/hooks/usePlan";
import type { Plan as PlanInterface } from "@/hooks/usePlan";
import {
  type BusinessStatus,
  useCreateBusinessMutation,
  useDeleteBusinessByIdMutation,
  useGetBusinessesQuery,
  useLazyGetBusinessByIdQuery,
  usePatchBusinessByIdMutation,
} from "@/hooks/useBusiness";

type BusinessItem = {
  id: string;
  name: string;
  owner: string;
  email: string;
  phone: string;
  address: string;
  revenue: string;
  orders: string;
  users: string;
  active: boolean;
  status: "Active" | "Inactive" | "Expired";
  plan: "Enterprise" | "Premium" | "Basic";
  background: string;
  thumb: string;
};

const businessImages = [
  "/business/pic1.jpeg",
  "/business/pic2.jpeg",
  "/business/pic3.jpeg",
  "/business/pic4.jpeg",
  "/business/pic5.jpeg",
];

const countryOptions = [
  { label: "Pakistan (+92)", value: "+92" },
  { label: "United States (+1)", value: "+1" },
  { label: "United Kingdom (+44)", value: "+44" },
  { label: "United Arab Emirates (+971)", value: "+971" },
  { label: "India (+91)", value: "+91" },
];

const planColor: Record<BusinessItem["plan"], string> = {
  Enterprise: "bg-[#ff8a00]",
  Premium: "bg-[#9c47f5]",
  Basic: "bg-[#3788f8]",
};

function BusinessesContent() {
  const [isAddBusinessOpen, setIsAddBusinessOpen] = useState(false);
  const [editingBusinessId, setEditingBusinessId] = useState<string | null>(null);
  const [statusOpen, setStatusOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [deleteTargetBusiness, setDeleteTargetBusiness] = useState<BusinessItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All Status" | BusinessItem["status"]>("All Status");
  const [planFilter, setPlanFilter] = useState<"All Plans" | BusinessItem["plan"]>("All Plans");
  const [form, setForm] = useState({
    businessName: "",
    address: "",
    phoneNumber: "",
    email: "",
    manager: "",
    planId: "",
  });
  const [countryCode, setCountryCode] = useState("+92");


  const { data: planData, isLoading: isLoadingPlans } = useGetPlansQuery();
  const statusQueryParam: BusinessStatus | undefined =
    statusFilter === "All Status" ? undefined : (statusFilter.toLowerCase() as BusinessStatus);
  const { data: businessData, isLoading: isLoadingBusinesses, isFetching: isFetchingBusinesses, refetch } = useGetBusinessesQuery({
    search: searchTerm || undefined,
    status: statusQueryParam,
    page: 1,
  });
  const [loadBusinessById, { isFetching: isLoadingBusinessById }] =
    useLazyGetBusinessByIdQuery();
  const [createBusiness, { isLoading: isCreatingBusiness }] = useCreateBusinessMutation();
  const [patchBusinessById, { isLoading: isPatchingBusiness }] = usePatchBusinessByIdMutation();
  const [deleteBusinessById, { isLoading: isDeletingBusiness }] = useDeleteBusinessByIdMutation();

  const mappedBusinesses = useMemo<BusinessItem[]>(() => {
    return (businessData?.data ?? []).map((item, index) => {
      const planName = item.planName as BusinessItem["plan"];
      const normalizedPlan: BusinessItem["plan"] =
        planName === "Basic" || planName === "Premium" || planName === "Enterprise"
          ? planName
          : "Basic";

      const normalizedStatus: BusinessItem["status"] =
        item.status === "active"
          ? "Active"
          : item.status === "inactive"
            ? "Inactive"
            : "Expired";

      const image = businessImages[index % businessImages.length];

      return {
        id: item.id,
        name: item.businessName,
        owner: item.ownerName,
        email: item.email,
        phone: item.phone,
        address: item.address,
        revenue: "-",
        orders: "-",
        users: "-",
        active: item.status === "active",
        status: normalizedStatus,
        plan: normalizedPlan,
        background: image,
        thumb: image,
      };
    });
  }, [businessData]);

  const filteredBusinesses = useMemo(() => {
    return mappedBusinesses.filter((item) => {
      const planOk = planFilter === "All Plans" ? true : item.plan === planFilter;
      return planOk;
    });
  }, [mappedBusinesses, planFilter]);

  const showSkeleton = isLoadingBusinesses && !businessData;

  const handleFormChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm({
      businessName: "",
      address: "",
      phoneNumber: "",
      email: "",
      manager: "",
      planId: "",
    });
    setCountryCode("+92");
  };

  const handleCreateBusiness = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const toastId = toast.loading(editingBusinessId ? "Updating business..." : "Creating business...");

    try {
      const phoneDigits = form.phoneNumber.replace(/\D/g, "");
      const payload = {
        businessName: form.businessName,
        address: form.address,
        phone: `${countryCode}${phoneDigits}`,
        email: form.email,
        manager: form.manager,
        planId: form.planId,
      };

      if (editingBusinessId) {
        await patchBusinessById({ id: editingBusinessId, body: payload }).unwrap();
      } else {
        await createBusiness(payload).unwrap();
      }
      toast.success(editingBusinessId ? "Business updated successfully." : "Business created successfully.", { id: toastId });
      void refetch();
      setIsAddBusinessOpen(false);
      setEditingBusinessId(null);
      resetForm();
    } catch (err) {
      toast.error(
        editingBusinessId
          ? "Failed to update business. Please try again."
          : "Failed to create business. Please try again.",
        { id: toastId }
      );
    }
  };

  const openEditDialog = async (id: string) => {
    setEditingBusinessId(id);
    setIsAddBusinessOpen(true);

    const toastId = toast.loading("Loading business details...");
    try {
      const business = await loadBusinessById(id).unwrap();

      const matchedCountry = countryOptions.find((option) =>
        business.phone.startsWith(option.value),
      );
      const nextCountryCode = matchedCountry?.value ?? "+92";
      const localPhone = business.phone
        .replace(nextCountryCode, "")
        .replace(/\D/g, "");

      setCountryCode(nextCountryCode);
      setForm({
        businessName: business.businessName,
        address: business.address,
        phoneNumber: localPhone,
        email: business.email,
        manager: business.ownerName,
        planId: business.planId,
      });
      toast.dismiss(toastId);
    } catch {
      toast.error("Failed to load business details.", { id: toastId });
    }
  };

  const handleDeleteBusiness = async (id: string) => {
    const toastId = toast.loading("Processing...");
    try {
      await deleteBusinessById(id).unwrap();
      toast.success("Business status updated successfully.", { id: toastId });
      void refetch();
      setDeleteTargetBusiness(null);
    } catch {
      toast.error("Failed to update business status. Please try again.", { id: toastId });
    }
  };

  return (
    <AdminShell activeTab="businesses">
      <section className="mb-5 flex w-full items-center justify-between gap-4 rounded-3xl border border-white bg-[linear-gradient(120deg,rgba(255,255,255,0.9),rgba(236,253,245,0.78))] px-6 py-5 shadow-[0_12px_28px_rgba(7,16,34,0.1)]">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#1E365B] text-[#ffffff] shadow-[0_10px_18px_rgba(15,118,110,0.28)]">
            <Building2 className="h-6 w-6" strokeWidth={1.8} />
          </div>
          <div>
            <h2 className="text-lg font-semibold lg:text-2xl">Business Management</h2>
            <p className="text-sm text-[#657084] lg:text-base">{businessData?.pagination?.total ?? 0} businesses</p>
          </div>
        </div>
        <Dialog
          open={isAddBusinessOpen}
          onOpenChange={(open) => {
            setIsAddBusinessOpen(open);
            if (!open) {
              setEditingBusinessId(null);
              resetForm();
            }
          }}
        >
          <DialogTrigger asChild>
            <button type="button" className="inline-flex h-10 items-center gap-2 rounded-xl bg-linear-to-r from-[#0f172a] to-[#1E365B] px-5 text-sm font-semibold text-[#ffffff] shadow-[0_10px_20px_rgba(15,23,42,0.22)]">
              <Plus className="h-4 w-4" />
              Add Business
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingBusinessId ? "Edit Business" : "Add Business"}</DialogTitle>
              <DialogDescription>
                {editingBusinessId
                  ? "Update the fields and confirm changes."
                  : "Fill in the fields to create a new business."}
              </DialogDescription>
            </DialogHeader>

            <form className="grid gap-4" onSubmit={handleCreateBusiness}>
              <label className="grid gap-1.5 text-sm font-medium text-[#374151]">
                Business Name
                <input
                  type="text"
                  required
                  value={form.businessName}
                  onChange={(event) => handleFormChange("businessName", event.target.value)}
                  className="h-11 rounded-xl border border-[#d7dbe4] px-3 outline-none focus:border-[#5e5df2]"
                />
              </label>

              <label className="grid gap-1.5 text-sm font-medium text-[#374151]">
                Address
                <input
                  type="text"
                  required
                  value={form.address}
                  onChange={(event) => handleFormChange("address", event.target.value)}
                  className="h-11 rounded-xl border border-[#d7dbe4] px-3 outline-none focus:border-[#5e5df2]"
                />
              </label>

              <label className="grid gap-1.5 text-sm font-medium text-[#374151]">
                Phone
                <div className="grid grid-cols-[180px_1fr] gap-2">
                  <select
                    value={countryCode}
                    onChange={(event) => setCountryCode(event.target.value)}
                    className="h-11 rounded-xl border border-[#d7dbe4] px-2 outline-none focus:border-[#5e5df2]"
                  >
                    {countryOptions.map((country) => (
                      <option key={country.value} value={country.value}>
                        {country.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    required
                    value={form.phoneNumber}
                    onChange={(event) => handleFormChange("phoneNumber", event.target.value)}
                    className="h-11 rounded-xl border border-[#d7dbe4] px-3 outline-none focus:border-[#5e5df2]"
                    placeholder="3001234567"
                  />
                </div>
              </label>

              <label className="grid gap-1.5 text-sm font-medium text-[#374151]">
                Email
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(event) => handleFormChange("email", event.target.value)}
                  className="h-11 rounded-xl border border-[#d7dbe4] px-3 outline-none focus:border-[#5e5df2]"
                />
              </label>

              <label className="grid gap-1.5 text-sm font-medium text-[#374151]">
                Manager
                <input
                  type="text"
                  required
                  value={form.manager}
                  onChange={(event) => handleFormChange("manager", event.target.value)}
                  className="h-11 rounded-xl border border-[#d7dbe4] px-3 outline-none focus:border-[#5e5df2]"
                />
              </label>

              <label className="grid gap-1.5 text-sm font-medium text-[#374151]">
                Plan
                <select
                  required
                  value={form.planId}
                  onChange={(event) => handleFormChange("planId", event.target.value)}
                  disabled={isLoadingPlans}
                  className="h-11 rounded-xl border border-[#d7dbe4] px-3 outline-none focus:border-[#5e5df2] disabled:bg-[#f4f5f7]"
                >
                  <option value="">{isLoadingPlans ? "Loading plans..." : "Select a plan"}</option>
                  {(() => {
                    let list: PlanInterface[] = [];
                    if (Array.isArray(planData)) {
                      list = planData;
                    } else if (planData?.data && Array.isArray(planData.data.plans)) {
                      list = planData.data.plans;
                    } else if (planData?.plans && Array.isArray(planData.plans)) {
                      list = planData.plans;
                    } else if (planData?.data && Array.isArray(planData.data)) {
                      list = planData.data as any;
                    }
                    
                    return list.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.planName}
                      </option>
                    ));
                  })()}
                </select>
              </label>



              <div className="mt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddBusinessOpen(false)}
                  className="inline-flex h-10 items-center rounded-xl border border-[#d7dbe4] px-4 text-sm font-semibold text-[#374151]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingBusiness || isPatchingBusiness || isLoadingBusinessById}
                  className="inline-flex h-10 items-center rounded-xl bg-linear-to-r from-[#5e5df2] to-[#8f20f5] px-4 text-sm font-semibold text-[#ffffff] disabled:opacity-60"
                >
                  {isLoadingBusinessById
                    ? "Loading..."
                    : isPatchingBusiness
                      ? "Updating..."
                      : isCreatingBusiness
                        ? "Creating..."
                        : editingBusinessId
                          ? "Confirm"
                          : "Create Business"}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </section>

      <section className="mb-5 grid w-full grid-cols-1 gap-3 rounded-3xl border border-[#e5edf5] bg-white/85 p-4 shadow-[0_10px_26px_rgba(7,16,34,0.08)] lg:grid-cols-3">
        {showSkeleton ? (
          <>
            <div className="h-11 animate-pulse rounded-xl bg-[#edf2f7]" />
            <div className="h-11 animate-pulse rounded-xl bg-[#edf2f7]" />
            <div className="h-11 animate-pulse rounded-xl bg-[#edf2f7]" />
          </>
        ) : (
          <>
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search businesses..."
              className="h-11 rounded-xl border border-[#dde5f0] bg-[#f8fbff] px-4 text-sm text-[#677084] outline-none focus:ring-2 focus:ring-[#1E365B]/25"
            />
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setStatusOpen((v) => !v);
                  setPlanOpen(false);
                }}
                className="flex h-11 w-full items-center justify-between rounded-xl border border-[#dde5f0] bg-[#f8fbff] px-4 text-sm text-[#677084]"
              >
                {statusFilter} <ChevronDown className="h-4 w-4" />
              </button>
              {statusOpen && (
                <div className="absolute left-0 top-13 z-20 w-full rounded-xl border border-[#e2e5ee] bg-white p-2 shadow-[0_12px_30px_rgba(15,23,42,0.12)]">
                  {['All Status', 'Active', 'Inactive', 'Expired'].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        const nextStatus = item as typeof statusFilter;
                        setStatusFilter(nextStatus);
                        setStatusOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${
                        statusFilter === item ? 'bg-[#eef0f6] font-semibold' : 'hover:bg-[#f3f5f9]'
                      }`}
                    >
                      {item}
                      {statusFilter === item && <span>✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setPlanOpen((v) => !v);
                  setStatusOpen(false);
                }}
                className="flex h-11 w-full items-center justify-between rounded-xl border border-[#dde5f0] bg-[#f8fbff] px-4 text-sm text-[#677084]"
              >
                {planFilter} <ChevronDown className="h-4 w-4" />
              </button>
              {planOpen && (
                <div className="absolute left-0 top-13 z-20 w-full rounded-xl border border-[#e2e5ee] bg-white p-2 shadow-[0_12px_30px_rgba(15,23,42,0.12)]">
                  {['All Plans', 'Basic', 'Premium', 'Enterprise'].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        const nextPlan = item as typeof planFilter;
                        setPlanFilter(nextPlan);
                        setPlanOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${
                        planFilter === item ? 'bg-[#eef0f6] font-semibold' : 'hover:bg-[#f3f5f9]'
                      }`}
                    >
                      {item}
                      {planFilter === item && <span>✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </section>

      <section className="grid w-full grid-cols-1 gap-5 lg:grid-cols-3">
        {showSkeleton
          ? Array.from({ length: 6 }, (_, index) => (
              <article
                key={index}
                className="overflow-hidden rounded-3xl border border-[#e4ebf4] bg-white/90 shadow-[0_10px_24px_rgba(10,17,31,0.1)]"
              >
                <div className="h-36 animate-pulse bg-[#edf2f7]" />
                <div className="p-5">
                  <div className="h-5 w-2/3 animate-pulse rounded bg-[#edf2f7]" />
                  <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-[#edf2f7]" />
                  <div className="mt-4 space-y-2">
                    <div className="h-4 animate-pulse rounded bg-[#edf2f7]" />
                    <div className="h-4 animate-pulse rounded bg-[#edf2f7]" />
                    <div className="h-4 animate-pulse rounded bg-[#edf2f7]" />
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-[#f5f6fa] p-3">
                    <div className="h-10 animate-pulse rounded bg-[#edf2f7]" />
                    <div className="h-10 animate-pulse rounded bg-[#edf2f7]" />
                    <div className="h-10 animate-pulse rounded bg-[#edf2f7]" />
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-2 lg:grid-cols-[1fr_1fr_auto]">
                    <div className="h-10 animate-pulse rounded-xl bg-[#edf2f7]" />
                    <div className="h-10 animate-pulse rounded-xl bg-[#edf2f7]" />
                    <div className="h-10 w-10 animate-pulse rounded-xl bg-[#edf2f7]" />
                  </div>
                </div>
              </article>
            ))
          : filteredBusinesses.map((business) => (
          <article
            key={business.id}
            id={`business-${business.name.replace(/\s+/g, "-").toLowerCase()}`}
            onClick={() => window.open(`/dashboard/businessAdmin?businessId=${business.id}`, '_blank')}
            className="group cursor-pointer overflow-hidden rounded-3xl border border-[#e4ebf4] bg-white/90 shadow-[0_10px_24px_rgba(10,17,31,0.1)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_30px_rgba(10,17,31,0.14)]"
          >
            <div className="relative h-36 overflow-hidden">
              <Image
                src={business.background}
                alt={`${business.name} background`}
                fill
                sizes="(max-width: 1024px) 100vw, (max-width: 1536px) 50vw, 33vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-b from-[rgba(15,23,42,0.35)] to-[rgba(15,118,110,0.75)]" />
              <div className="absolute right-4 top-3 z-2 flex gap-2">
                <span className={`inline-flex h-7 items-center rounded-xl px-3 text-xs font-bold text-[#ffffff] ${business.status === "Active" ? "bg-[#07c357]" : business.status === "Inactive" ? "bg-[#7d8593]" : "bg-[#ff3649]"}`}>
                  {business.status}
                </span>
                <span className={`inline-flex h-7 items-center rounded-xl px-3 text-xs font-bold text-[#ffffff] ${planColor[business.plan]}`}>
                  {business.plan}
                </span>
              </div>
              <div className="absolute bottom-3 left-4 z-2 h-14 w-14 overflow-hidden rounded-xl border-4 border-white bg-[#d4dae6]">
                <Image src={business.thumb} alt={`${business.name} logo`} fill sizes="56px" className="object-cover" />
              </div>
            </div>

            <div className="p-5">
              <h3 className="text-lg font-semibold">{business.name}</h3>
              <p className="mt-1 text-sm text-[#616b80]">{business.owner}</p>

              <div className="mt-3 space-y-2 text-sm text-[#4c5568]">
                <p className="flex items-center gap-2"><Mail className="h-4 w-4" /> {business.email}</p>
                <p className="flex items-center gap-2"><Phone className="h-4 w-4" /> {business.phone}</p>
                <p className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {business.address}</p>
              </div>

              <div className="mt-4 grid grid-cols-3 rounded-xl bg-[#f5f6fa] p-3 text-center">
                <div>
                  <strong className="text-lg text-[#06ad53]">{business.revenue}</strong>
                  <p className="text-xs text-[#616b80]">Revenue</p>
                </div>
                <div>
                  <strong className="text-lg text-[#2063ec]">{business.orders}</strong>
                  <p className="text-xs text-[#616b80]">Orders</p>
                </div>
                <div>
                  <strong className="text-lg text-[#8925f8]">{business.users}</strong>
                  <p className="text-xs text-[#616b80]">Users</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    void openEditDialog(business.id);
                  }}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border-2 border-[#d3d7e0] bg-white text-sm font-semibold text-[#0f172a] hover:bg-slate-50"
                >
                  <Pencil className="h-4 w-4" /> Edit
                </button>
                <button
                  type="button"
                  disabled={isDeletingBusiness || business.status !== "Active"}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (business.status !== "Active") return;
                    setDeleteTargetBusiness(business);
                  }}
                  className={`inline-flex h-10 items-center justify-center rounded-xl border-2 text-sm font-semibold ${
                    business.status === "Active"
                      ? "border-[#ff9097] text-[#f2202f] hover:bg-red-50"
                      : "border-[#67db94] text-[#0ca94f] hover:bg-green-50"
                  } ${business.status !== "Active" ? "cursor-not-allowed opacity-50" : ""}`}
                >
                  {business.status === "Active" ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>

      <Dialog
        open={Boolean(deleteTargetBusiness)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTargetBusiness(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate business?</DialogTitle>
            <DialogDescription>
              {deleteTargetBusiness
                ? `Are you sure you want to deactivate ${deleteTargetBusiness.name}? This action cannot be undone.`
                : "Are you sure you want to deactivate this business? This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeleteTargetBusiness(null)}
              className="inline-flex h-10 items-center rounded-xl border border-[#d7dbe4] px-4 text-sm font-semibold text-[#374151]"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isDeletingBusiness || !deleteTargetBusiness}
              onClick={() => {
                if (!deleteTargetBusiness) return;
                void handleDeleteBusiness(deleteTargetBusiness.id);
              }}
              className="inline-flex h-10 items-center rounded-xl bg-[#f2202f] px-4 text-sm font-semibold text-[#ffffff] disabled:opacity-60"
            >
              {isDeletingBusiness ? "Deactivating..." : "Deactivate"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}

export default function BusinessesPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading Businesses...</div>}>
      <BusinessesContent />
    </Suspense>
  );
}
