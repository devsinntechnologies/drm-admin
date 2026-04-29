export function cn(...inputs: Array<string | false | null | undefined>) {
  return inputs.filter(Boolean).join(" ");
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

  const directMessage = [payload.message, payload.error].find((value) => typeof value === "string" && value.trim().length > 0);
  if (typeof directMessage === "string") {
    return directMessage;
  }

  if (typeof payload.statusCode === "number") {
    return `${fallbackMessage} (${payload.statusCode})`;
  }

  if (payload.data && typeof payload.data === "object") {
    const nested = payload.data as { message?: unknown; error?: unknown; statusCode?: unknown };
    const nestedMessage = [nested.message, nested.error].find((value) => typeof value === "string" && value.trim().length > 0);
    if (typeof nestedMessage === "string") {
      return nestedMessage;
    }

    if (typeof nested.statusCode === "number") {
      return `${fallbackMessage} (${nested.statusCode})`;
    }
  }

  try {
    return JSON.stringify(error);
  } catch {
    return fallbackMessage;
  }
}
export function getStoredAuthToken() {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
  return token ? token.trim() : null;
}
