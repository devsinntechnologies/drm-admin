"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Building2,
  ChevronDown,
  Copy,
  Mail,
  MapPin,
  Phone,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
} from "lucide-react";
import Loading from "@/components/common/Loading";
import AdminShell from "@/components/admin/AdminShell";
import { EmptyState } from "@/components/design-system/EmptyState";
import { toast } from "sonner";
import { Suspense, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
  useLazyCheckBusinessEmailQuery,
  useLazyGetBusinessByIdQuery,
  usePatchBusinessByIdMutation,
} from "@/hooks/useBusiness";
import { saveBusinessProfile, getBusinessProfile } from "@/lib/business-profile";
import { persistIndustryTemplateForBusiness } from "@/template-engine/persist-template-config";
import { normalizeErrorMessage } from "@/lib/utils";
import { INDUSTRY_TEMPLATES } from "@/templates/industries";
import { colorsFromAccent } from "@/templates/modules";
import { PharmacyCountryPicker } from "@/components/pharmacy/PharmacyCountryPicker";
import { pharmacyCountryDefaults, type PharmacyMarketCode } from "@/lib/pharmacy-market";
import {
  formatE164,
  validateEmail,
  validatePhoneNumber,
} from "@/lib/form-validation";

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
  Premium: "bg-[#0050F8]",
  Basic: "bg-[#3788f8]",
};

function BusinessesContent() {
  const router = useRouter();
  const [isAddBusinessOpen, setIsAddBusinessOpen] = useState(false);
  const [editingBusinessId, setEditingBusinessId] = useState<string | null>(null);
  const [statusOpen, setStatusOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [deleteTargetBusiness, setDeleteTargetBusiness] = useState<BusinessItem | null>(null);
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string;
    password: string;
    businessName: string;
    emailSent: boolean;
    emailError?: string;
  } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
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
    industryId: "retail-store",
  });
  const [countryCode, setCountryCode] = useState("+92");
  const [pharmacyCountry, setPharmacyCountry] = useState<PharmacyMarketCode>("PK");
  const [emailStatus, setEmailStatus] = useState<"idle" | "checking" | "ok" | "taken" | "invalid">("idle");
  const [emailHint, setEmailHint] = useState<string | null>(null);
  const [phoneHint, setPhoneHint] = useState<string | null>(null);


  const { data: planData, isLoading: isLoadingPlans } = useGetPlansQuery();
  const statusQueryParam: BusinessStatus | undefined =
    statusFilter === "All Status" ? undefined : (statusFilter.toLowerCase() as BusinessStatus);
  const { data: businessData, isLoading: isLoadingBusinesses, isFetching: isFetchingBusinesses, isError: isBusinessesError, error: businessesError, refetch } = useGetBusinessesQuery({
    search: searchTerm || undefined,
    status: statusQueryParam,
    page: 1,
  });
  const [loadBusinessById, { isFetching: isLoadingBusinessById }] =
    useLazyGetBusinessByIdQuery();
  const [createBusiness, { isLoading: isCreatingBusiness }] = useCreateBusinessMutation();
  const [checkBusinessEmail] = useLazyCheckBusinessEmailQuery();
  const [patchBusinessById, { isLoading: isPatchingBusiness }] = usePatchBusinessByIdMutation();
  const [deleteBusinessById, { isLoading: isDeletingBusiness }] = useDeleteBusinessByIdMutation();

  const mappedBusinesses = useMemo<BusinessItem[]>(() => {
    const rows = Array.isArray(businessData?.data) ? businessData.data : [];
    return rows.map((item, index) => {
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
  const businessCount = businessData?.pagination?.total ?? mappedBusinesses.length;
  const businessesErrorMessage =
    businessesError && "status" in (businessesError as object)
      ? `Unable to load businesses (HTTP ${(businessesError as { status?: number }).status ?? "error"}). Check your login session and API connection.`
      : "Unable to load businesses. Check your login session and API connection.";

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
      industryId: "retail-store",
    });
    setCountryCode("+92");
    setPharmacyCountry("PK");
    setEmailStatus("idle");
    setEmailHint(null);
    setPhoneHint(null);
    setFormError(null);
  };

  const verifyBusinessEmail = async (rawEmail: string) => {
    const formatError = validateEmail(rawEmail);
    if (formatError) {
      setEmailStatus("invalid");
      setEmailHint(formatError);
      return false;
    }
    if (editingBusinessId) {
      setEmailStatus("ok");
      setEmailHint(null);
      return true;
    }
    setEmailStatus("checking");
    setEmailHint("Checking email…");
    try {
      const result = await checkBusinessEmail(rawEmail.trim().toLowerCase()).unwrap();
      if (!result.available) {
        setEmailStatus("taken");
        setEmailHint("This email is already registered. Use a different owner email.");
        return false;
      }
      setEmailStatus("ok");
      setEmailHint("Email is available");
      return true;
    } catch {
      setEmailStatus("idle");
      setEmailHint("Could not verify email right now. You can still try to save.");
      return true;
    }
  };

  const handleCreateBusiness = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const toastId = toast.loading(editingBusinessId ? "Updating business..." : "Creating business...");

    try {
      const phoneError = validatePhoneNumber(countryCode, form.phoneNumber);
      if (phoneError) {
        setPhoneHint(phoneError);
        throw new Error(phoneError);
      }
      setPhoneHint(null);

      const emailOk = await verifyBusinessEmail(form.email);
      if (!emailOk) {
        throw new Error("Email is already registered or invalid.");
      }

      if (!form.planId) {
        throw new Error("Select a plan.");
      }

      const payload = {
        businessName: form.businessName.trim(),
        address: form.address.trim(),
        phone: formatE164(countryCode, form.phoneNumber),
        email: form.email.trim().toLowerCase(),
        manager: form.manager.trim(),
        planId: form.planId,
      };

      const pharmacyDefaults =
        form.industryId === "pharmacy" ? pharmacyCountryDefaults(pharmacyCountry) : null;
      const templatePayload = {
        industryId: form.industryId,
        location: payload.address || pharmacyDefaults?.location,
        currency: pharmacyDefaults?.currency,
        market: pharmacyDefaults?.market,
      };

      if (editingBusinessId) {
        await patchBusinessById({ id: editingBusinessId, body: payload }).unwrap();
        const tpl = INDUSTRY_TEMPLATES.find((t) => t.id === form.industryId);
        const colors = tpl ? colorsFromAccent(tpl.theme.accent) : colorsFromAccent("blue");
        saveBusinessProfile(editingBusinessId, {
          ...getBusinessProfile(editingBusinessId, form.businessName),
          industryId: form.industryId,
          primaryColor: colors.primary,
          secondaryColor: colors.secondary,
        });
        const persist = await persistIndustryTemplateForBusiness({
          businessId: editingBusinessId,
          businessName: payload.businessName,
          ...templatePayload,
        });
        if (!persist.persistedToApi) {
          toast.warning(
            persist.warning ??
              "Business updated, but industry modules were not saved to the server. Seed industry templates, then save workspace settings.",
          );
        }
        toast.success("Business updated successfully.", { id: toastId });
      } else {
        const created = await createBusiness(payload).unwrap();
        if (!created.id) {
          throw new Error("Business created but no ID returned.");
        }
        const tpl = INDUSTRY_TEMPLATES.find((t) => t.id === form.industryId);
        const colors = tpl ? colorsFromAccent(tpl.theme.accent) : colorsFromAccent("blue");
        saveBusinessProfile(created.id, {
          industryId: form.industryId,
          primaryColor: colors.primary,
          secondaryColor: colors.secondary,
          themeMode: "light",
          typography: "Poppins",
          layoutStyle: "comfortable",
        });

        const persist = await persistIndustryTemplateForBusiness({
          businessId: created.id,
          businessName: created.businessName || payload.businessName,
          ...templatePayload,
        });
        if (!persist.persistedToApi) {
          toast.warning(
            persist.warning ??
              "Business created, but industry modules were not saved to the server. Open the business and save workspace settings after seeding industry templates.",
          );
        }

        const emailSent = created.credentialsEmailSent === true;
        const emailError = created.credentialsEmailError;

        if (created.temporaryPassword) {
          setCreatedCredentials({
            email: created.loginEmail || created.ownerEmail || payload.email,
            password: created.temporaryPassword,
            businessName: created.businessName || payload.businessName,
            emailSent,
            emailError,
          });
        }

        if (emailSent) {
          toast.success("Business created. Login details were emailed to the owner.", { id: toastId });
        } else {
          toast.success("Business created.", { id: toastId });
          toast.warning(
            emailError ||
              "The login password email was not sent. Copy the password from the dialog and share it with the owner.",
          );
        }
      }
      void refetch();
      setIsAddBusinessOpen(false);
      setEditingBusinessId(null);
      resetForm();
    } catch (err) {
      const message = normalizeErrorMessage(
        err,
        editingBusinessId ? "Failed to update business. Please try again." : "Failed to create business. Please try again.",
      );
      setFormError(message);
      toast.error(message, { id: toastId });
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
      setPharmacyCountry(nextCountryCode === "+44" ? "UK" : "PK");
      setForm({
        businessName: business.businessName,
        address: business.address,
        phoneNumber: localPhone,
        email: business.email,
        manager: business.ownerName,
        planId: business.planId,
        industryId: getBusinessProfile(id, business.businessName).industryId,
      });
      toast.dismiss(toastId);
    } catch (err) {
      toast.error(normalizeErrorMessage(err, "Failed to load business details."), { id: toastId });
    }
  };

  const handleDeleteBusiness = async (id: string) => {
    const toastId = toast.loading("Processing...");
    try {
      await deleteBusinessById(id).unwrap();
      toast.success("Business status updated successfully.", { id: toastId });
      void refetch();
      setDeleteTargetBusiness(null);
    } catch (err) {
      toast.error(normalizeErrorMessage(err, "Failed to update business status. Please try again."), { id: toastId });
    }
  };

  return (
    <AdminShell activeTab="businesses">
      <div className="mb-5 flex w-full items-center justify-end gap-4">
        <Link
          href="/dashboard/superAdmin/businesses/setup"
          className="dn-btn dn-btn-primary inline-flex h-10 gap-2 px-5 text-sm font-semibold"
        >
          <Plus className="h-4 w-4" />
          Add Business
        </Link>
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
            <button type="button" className="hidden">
              Edit Business
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
              {formError ? (
                <div className="rounded-xl border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-sm text-[#b91c1c]">
                  {formError}
                </div>
              ) : null}
              <label className="grid gap-1.5 text-sm font-medium text-[#374151]">
                Business Name <span className="text-[#dc2626]">*</span>
                <input
                  type="text"
                  required
                  value={form.businessName}
                  onChange={(event) => handleFormChange("businessName", event.target.value)}
                  className="h-11 rounded-xl border border-[#d7dbe4] px-3 outline-none focus:border-[#5e5df2]"
                />
              </label>

              <label className="grid gap-1.5 text-sm font-medium text-[#374151]">
                Address <span className="text-[#dc2626]">*</span>
                <input
                  type="text"
                  required
                  value={form.address}
                  onChange={(event) => handleFormChange("address", event.target.value)}
                  className="h-11 rounded-xl border border-[#d7dbe4] px-3 outline-none focus:border-[#5e5df2]"
                />
              </label>

              <label className="grid gap-1.5 text-sm font-medium text-[#374151]">
                Phone <span className="text-[#dc2626]">*</span>
                <div className="grid grid-cols-[180px_1fr] gap-2">
                  <select
                    value={countryCode}
                    onChange={(event) => {
                      setCountryCode(event.target.value);
                      setPhoneHint(validatePhoneNumber(event.target.value, form.phoneNumber));
                    }}
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
                    onChange={(event) => {
                      handleFormChange("phoneNumber", event.target.value);
                      setPhoneHint(validatePhoneNumber(countryCode, event.target.value));
                    }}
                    className="h-11 rounded-xl border border-[#d7dbe4] px-3 outline-none focus:border-[#5e5df2]"
                    placeholder="3001234567"
                  />
                </div>
                {phoneHint ? <span className="text-xs text-[#b91c1c]">{phoneHint}</span> : null}
              </label>

              <label className="grid gap-1.5 text-sm font-medium text-[#374151]">
                Email <span className="text-[#dc2626]">*</span>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(event) => {
                    handleFormChange("email", event.target.value);
                    setEmailStatus("idle");
                    setEmailHint(null);
                  }}
                  onBlur={() => {
                    void verifyBusinessEmail(form.email);
                  }}
                  className="h-11 rounded-xl border border-[#d7dbe4] px-3 outline-none focus:border-[#5e5df2]"
                />
                {emailHint ? (
                  <span
                    className={
                      emailStatus === "ok"
                        ? "text-xs text-[#15803d]"
                        : emailStatus === "checking"
                          ? "text-xs text-[#64748b]"
                          : "text-xs text-[#b91c1c]"
                    }
                  >
                    {emailHint}
                  </span>
                ) : null}
              </label>

              <label className="grid gap-1.5 text-sm font-medium text-[#374151]">
                Industry Template <span className="text-[#dc2626]">*</span>
                <select
                  value={form.industryId}
                  onChange={(event) => {
                    const industryId = event.target.value;
                    setForm((prev) => {
                      if (industryId !== "pharmacy") return { ...prev, industryId };
                      const defaults = pharmacyCountryDefaults(pharmacyCountry);
                      return {
                        ...prev,
                        industryId,
                        address: prev.address.trim() ? prev.address : defaults.location,
                      };
                    });
                    if (industryId === "pharmacy") {
                      setCountryCode(pharmacyCountryDefaults(pharmacyCountry).phonePrefix);
                    }
                  }}
                  className="portal-input"
                >
                  {INDUSTRY_TEMPLATES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>

              {form.industryId === "pharmacy" ? (
                <PharmacyCountryPicker
                  value={pharmacyCountry}
                  onChange={(code) => {
                    const defaults = pharmacyCountryDefaults(code);
                    setPharmacyCountry(code);
                    setCountryCode(defaults.phonePrefix);
                    setForm((prev) => ({
                      ...prev,
                      address: prev.address.trim() ? prev.address : defaults.location,
                    }));
                  }}
                />
              ) : null}

              <label className="grid gap-1.5 text-sm font-medium text-[#374151]">
                Manager <span className="text-[#dc2626]">*</span>
                <input
                  type="text"
                  required
                  value={form.manager}
                  onChange={(event) => handleFormChange("manager", event.target.value)}
                  className="h-11 rounded-xl border border-[#d7dbe4] px-3 outline-none focus:border-[#5e5df2]"
                />
              </label>

              <label className="grid gap-1.5 text-sm font-medium text-[#374151]">
                Plan <span className="text-[#dc2626]">*</span>                <select
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
                  className="inline-flex h-10 items-center rounded-xl bg-[#001840] px-4 text-sm font-semibold text-[#ffffff] disabled:opacity-60"
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
      </div>

      {isBusinessesError ? (
        <section className="mb-5 rounded-xl border border-[#fecaca] bg-[#fef2f2] p-5">
          <p className="text-sm font-semibold text-[#dc2626]">{businessesErrorMessage}</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="dn-btn dn-btn-outline mt-3 h-[44px] rounded-xl px-4 text-sm"
          >
            Retry loading businesses
          </button>
        </section>
      ) : null}

      <section className="mb-5 grid w-full grid-cols-1 gap-3 rounded-3xl border border-[#e5edf5] bg-white/85 p-4 shadow-[0_10px_26px_rgba(7,16,34,0.08)] lg:grid-cols-3 lg:items-end">
        {showSkeleton ? (
          <>
            <div className="h-11 animate-pulse rounded-xl bg-[#edf2f7]" />
            <div className="h-11 animate-pulse rounded-xl bg-[#edf2f7]" />
            <div className="h-11 animate-pulse rounded-xl bg-[#edf2f7]" />
          </>
        ) : (
          <>
            <label className="block space-y-1.5">
              <span className="block text-sm font-semibold text-[#64748b]">Search</span>
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search businesses..."
                className="h-11 rounded-xl border border-[#dde5f0] bg-[#f8fbff] px-4 text-sm text-[#677084] outline-none focus:ring-2 focus:ring-[#001840]/25"
              />
            </label>
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
            onClick={() => router.push(`/dashboard/superAdmin/businesses/${business.id}`)}
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
              <div className="absolute inset-0 bg-[rgba(15,23,42,0.45)]" />
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
                  <strong className="text-lg text-[#0050F8]">{business.users}</strong>
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

      {!showSkeleton && !isBusinessesError && filteredBusinesses.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No businesses found"
          description={
            searchTerm || statusFilter !== "All Status" || planFilter !== "All Plans"
              ? "Try adjusting your search or filters, or create a new business on the platform."
              : "Get started by adding your first business to the DigiNizam platform."
          }
          primaryAction={
            <button
              type="button"
              onClick={() => setIsAddBusinessOpen(true)}
              className="dn-btn dn-btn-primary h-[44px] rounded-xl px-4 text-sm"
            >
              <Plus className="h-4 w-4" /> Add Business
            </button>
          }
          secondaryAction={
            (searchTerm || statusFilter !== "All Status" || planFilter !== "All Plans") ? (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("All Status");
                  setPlanFilter("All Plans");
                }}
                className="dn-btn dn-btn-ghost h-[44px] rounded-xl px-4 text-sm"
              >
                Clear filters
              </button>
            ) : undefined
          }
        />
      ) : null}

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

      <Dialog
        open={Boolean(createdCredentials)}
        onOpenChange={(open) => {
          if (!open) {
            setCreatedCredentials(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Owner login credentials</DialogTitle>
            <DialogDescription>
              {createdCredentials
                ? `Save these for ${createdCredentials.businessName}. The password is shown only once.`
                : "Save these credentials. The password is shown only once."}
            </DialogDescription>
          </DialogHeader>

          {createdCredentials ? (
            <div className="mt-2 grid gap-3">
              <div className="rounded-xl border border-[#e5e7eb] bg-[#f8fafc] px-3 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#657084]">Login email</p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <p className="break-all text-sm font-semibold text-[#111827]">{createdCredentials.email}</p>
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText(createdCredentials.email);
                      toast.success("Email copied");
                    }}
                    className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-[#d7dbe4] px-2.5 text-xs font-semibold text-[#374151]"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-[#e5e7eb] bg-[#f8fafc] px-3 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#657084]">Temporary password</p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <p className="break-all font-mono text-sm font-semibold text-[#111827]">{createdCredentials.password}</p>
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText(createdCredentials.password);
                      toast.success("Password copied");
                    }}
                    className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-[#d7dbe4] px-2.5 text-xs font-semibold text-[#374151]"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </button>
                </div>
              </div>

              {createdCredentials.emailSent ? (
                <p className="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-2 text-xs text-[#166534]">
                  These credentials were also emailed to {createdCredentials.email}.
                </p>
              ) : (
                <p className="rounded-xl border border-[#fde68a] bg-[#fffbeb] px-3 py-2 text-xs text-[#92400e]">
                  {createdCredentials.emailError || "The password email was not sent."} Copy these details and share them with the owner.
                </p>
              )}

              <div className="mt-1 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard.writeText(
                      `Email: ${createdCredentials.email}\nPassword: ${createdCredentials.password}`,
                    );
                    toast.success("Credentials copied");
                  }}
                  className="inline-flex h-10 items-center rounded-xl border border-[#d7dbe4] px-4 text-sm font-semibold text-[#374151]"
                >
                  Copy both
                </button>
                <button
                  type="button"
                  onClick={() => setCreatedCredentials(null)}
                  className="inline-flex h-10 items-center rounded-xl bg-[#001840] px-4 text-sm font-semibold text-[#ffffff]"
                >
                  Done
                </button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}

export default function BusinessesPage() {
  return (
    <Suspense fallback={<Loading fullScreen label="Loading businesses..." />}>
      <BusinessesContent />
    </Suspense>
  );
}
