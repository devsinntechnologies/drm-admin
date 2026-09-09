"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Loading from "@/components/common/Loading";
import { getStoredAuthToken } from "@/lib/utils";

/**
 * Always keep `children` in the tree so App Router can swap pages on
 * client navigations (e.g. /businesses → /businesses/[id]).
 * Withholding children until auth resolved was freezing the previous page
 * while the URL still changed.
 */
export function DashboardAuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const token = getStoredAuthToken();
    if (!token) {
      const returnTo = `${window.location.pathname}${window.location.search}`;
      window.location.replace(`/login?returnTo=${encodeURIComponent(returnTo)}`);
      return;
    }
    setAllowed(true);
  }, []);

  return (
    <>
      {!allowed ? <Loading fullScreen label="Opening workspace…" /> : null}
      <div key={pathname} hidden={!allowed} className={allowed ? "contents" : undefined}>
        {children}
      </div>
    </>
  );
}
