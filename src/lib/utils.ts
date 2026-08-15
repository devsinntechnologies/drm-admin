import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function firstUsefulText(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (Array.isArray(value)) {
      const parts = value
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean);
      if (parts.length) {
        return parts.join(". ");
      }
    }

    if (value && typeof value === "object") {
      const nested = value as { message?: unknown; error?: unknown; details?: unknown };
      const nestedText = firstUsefulText(nested.message, nested.error, nested.details);
      if (nestedText) {
        return nestedText;
      }
    }
  }

  return undefined;
}

export function normalizeErrorMessage(error: unknown, fallbackMessage = "Something went wrong.") {
  if (typeof error === "string") {
    return error;
  }

  if (!error || typeof error !== "object") {
    return fallbackMessage;
  }

  const payload = error as {
    message?: unknown;
    error?: unknown;
    statusCode?: unknown;
    data?: unknown;
  };

  const directMessage = firstUsefulText(payload.message, payload.error);
  if (directMessage) {
    return directMessage;
  }

  if (payload.data && typeof payload.data === "object") {
    const nested = payload.data as {
      message?: unknown;
      error?: unknown;
      statusCode?: unknown;
    };
    const nestedMessage = firstUsefulText(nested.message, nested.error);
    if (nestedMessage) {
      return nestedMessage;
    }

    if (typeof nested.statusCode === "number") {
      return `${fallbackMessage} (${nested.statusCode})`;
    }
  }

  if (typeof payload.statusCode === "number") {
    return `${fallbackMessage} (${payload.statusCode})`;
  }

  return fallbackMessage;
}
export function getStoredAuthToken() {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
  return token ? token.trim() : null;
}

export function isUuid(value?: string | null): value is string {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.trim());
}

export function productHasVariants(variants?: Array<{ id?: string }> | null) {
  return (variants ?? []).some((variant) => isUuid(variant.id));
}

export type OrderPatchItemInput = {
  orderItemId?: string;
  productId: string;
  variantId?: string;
  quantity: number;
  price: number;
  action?: "add" | "update" | "remove";
};

/** Builds a PATCH /orders/:id item per API rules — omit variantId when product has no variants. */
export function buildOrderPatchItem(
  item: OrderPatchItemInput,
  variants?: Array<{ id?: string }> | null,
) {
  const action = item.action ?? (item.orderItemId ? "update" : "add");
  const payload: Record<string, unknown> = {
    action,
    quantity: item.quantity,
    price: item.price,
    productId: item.productId,
  };

  if (item.orderItemId) {
    payload.id = item.orderItemId;
  }

  if (productHasVariants(variants) && isUuid(item.variantId)) {
    payload.variantId = item.variantId;
  }

  return payload;
}

export function buildOrderRemoveItem(orderItemId: string) {
  return { id: orderItemId, action: "remove" as const };
}
