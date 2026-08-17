"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Loading from "@/components/common/Loading";
import { BusinessTemplateProvider, useBusinessTemplate } from "@/contexts/BusinessTemplateContext";
import { cn } from "@/lib/utils";

const LOAD_TIMEOUT_MS = 12000;

function ThemedWorkspace({ children }: { children: React.ReactNode }) {
  const { themeStyle, themeMode, isLoading, isError, isUnauthorized, businessId, businessName } = useBusinessTemplate();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!businessId || !isLoading) {
      setTimedOut(false);
      return;
    }
    const timer = window.setTimeout(() => setTimedOut(true), LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [businessId, isLoading]);

  if (businessId && isLoading && !timedOut) {
    return <Loading fullScreen label={`Loading ${businessName} workspace…`} />;
  }

  if (businessId && isError) {
    const loginHref = `/login?returnTo=${encodeURIComponent(`/dashboard/businessAdmin?businessId=${businessId}`)}`;
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4">
        <div className="max-w-md rounded-2xl border border-[#fecaca] bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-semibold text-[#0f172a]">Could not load workspace</p>
          <p className="mt-2 text-sm text-[#64748b]">
            {isUnauthorized
              ? "Your session expired or was issued by a different server. Sign in again against your local backend (localhost:3002)."
              : "The business could not be loaded. Make sure the backend is running and you are signed in."}
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {isUnauthorized ? (
              <a href={loginHref} className="dn-btn dn-btn-primary rounded-xl px-4 py-2.5 text-sm">
                Sign in again
              </a>
            ) : null}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="dn-btn dn-btn-outline rounded-xl px-4 py-2.5 text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn("business-workspace min-h-screen", themeMode === "dark" && "business-workspace-dark")}
      style={themeStyle}
    >
      {children}
    </div>
  );
}

function BusinessAdminLayoutContent({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const businessId = searchParams.get("businessId")?.trim() ?? null;

  return (
    <BusinessTemplateProvider businessId={businessId}>
      <ThemedWorkspace>{children}</ThemedWorkspace>
    </BusinessTemplateProvider>
  );
}

export default function BusinessAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<Loading fullScreen label="Opening business workspace…" />}>
      <BusinessAdminLayoutContent>{children}</BusinessAdminLayoutContent>
    </Suspense>
  );
}
