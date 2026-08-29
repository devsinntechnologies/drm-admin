"use client";

import { useEffect, type ReactNode } from "react";
import { io, type Socket } from "socket.io-client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { BASE_URL } from "@/lib/constant";
import { BUSINESS_INACTIVE_MESSAGE } from "@/lib/business-session";
import { logout } from "@/lib/features/auth/authSlice";
import { useAppDispatch } from "@/lib/hooks";
import { emitStaffRealtime, STAFF_REALTIME_EVENTS } from "@/lib/staff-realtime";

type NotificationPayload = {
  title?: string;
  message?: string;
  type?: string;
  metadata?: {
    tableNumber?: string | null;
  };
};

function namespaceForRole(role: string | null) {
  const normalized = (role ?? "").toLowerCase();
  if (!normalized || normalized === "super_admin") return null;
  if (normalized === "waiter") return "/waiter";
  if (normalized === "kitchen" || normalized === "kitchen_staff") return "/kitchen";
  return "/business_admin";
}

function redirectToLogin() {
  if (typeof window === "undefined") return;
  const returnTo = `${window.location.pathname}${window.location.search}`;
  const loginUrl = `/login?returnTo=${encodeURIComponent(returnTo)}`;
  if (!window.location.pathname.startsWith("/login")) {
    window.location.href = loginUrl;
  }
}

export default function StaffRealtimeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const dispatch = useAppDispatch();
  const { token, role } = useAuth();

  useEffect(() => {
    const namespace = namespaceForRole(role);
    const authToken =
      token ||
      (typeof window !== "undefined"
        ? localStorage.getItem("auth_token") || localStorage.getItem("token")
        : null);
    if (!namespace || !authToken) return;

    const socket: Socket = io(`${BASE_URL}${namespace}`, {
      auth: { token: authToken },
      transports: ["websocket", "polling"],
      reconnection: true,
    });

    const onRequested = (payload: NotificationPayload) => {
      toast.info(payload.message || payload.title || "New table order request");
      emitStaffRealtime(STAFF_REALTIME_EVENTS.SELF_ORDERS_CHANGED, payload);
    };
    const onApproved = (payload: NotificationPayload) => {
      toast.success(payload.message || "Table order approved");
      emitStaffRealtime(STAFF_REALTIME_EVENTS.SELF_ORDERS_CHANGED, payload);
      emitStaffRealtime(STAFF_REALTIME_EVENTS.ORDERS_CHANGED, payload);
    };
    const onRejected = (payload: NotificationPayload) => {
      toast.warning(payload.message || "Table order rejected");
      emitStaffRealtime(STAFF_REALTIME_EVENTS.SELF_ORDERS_CHANGED, payload);
    };
    const onInvoiceChanged = (payload?: unknown) => {
      emitStaffRealtime(STAFF_REALTIME_EVENTS.INVOICES_CHANGED, payload);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("invoices:refetch", { detail: payload }));
      }
    };
    const onBusinessDeactivated = (payload: NotificationPayload & { product?: string; code?: string }) => {
      const product = payload.product;
      if (product && product !== "portal") return;
      toast.error(payload.message || BUSINESS_INACTIVE_MESSAGE);
      dispatch(logout());
      redirectToLogin();
    };

    socket.on("self_order:requested", onRequested);
    socket.on("self_order:approved", onApproved);
    socket.on("self_order:rejected", onRejected);
    socket.on("invoice:generated", onInvoiceChanged);
    socket.on("new_invoice", onInvoiceChanged);
    socket.on("invoice:updated", onInvoiceChanged);
    socket.on("business:deactivated", onBusinessDeactivated);
    socket.on("business:product_disabled", onBusinessDeactivated);

    return () => {
      socket.off("self_order:requested", onRequested);
      socket.off("self_order:approved", onApproved);
      socket.off("self_order:rejected", onRejected);
      socket.off("invoice:generated", onInvoiceChanged);
      socket.off("new_invoice", onInvoiceChanged);
      socket.off("invoice:updated", onInvoiceChanged);
      socket.off("business:deactivated", onBusinessDeactivated);
      socket.off("business:product_disabled", onBusinessDeactivated);
      socket.disconnect();
    };
  }, [dispatch, role, token]);

  return <>{children}</>;
}
