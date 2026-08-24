import { BASE_URL } from "@/lib/constant";
import { buildApiUrl, unwrapApiData } from "@/lib/api";
import { getStoredAuthToken, normalizeErrorMessage } from "@/lib/utils";

export class ApiClientError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

function authHeaders(token?: string | null): HeadersInit {
  const resolved = token || getStoredAuthToken();
  return {
    accept: "application/json",
    "content-type": "application/json",
    ...(resolved ? { Authorization: `Bearer ${resolved}` } : {}),
  };
}

function withBusinessId(path: string, businessId?: string | null) {
  if (!businessId) return path;
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}businessId=${encodeURIComponent(businessId)}`;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiClientError(
      normalizeErrorMessage(payload, `Request failed (${response.status})`),
      response.status,
      payload,
    );
  }
  if (!payload || typeof payload !== "object") {
    return payload as T;
  }

  const envelope = payload as { success?: unknown; data?: unknown; pagination?: unknown };
  const inner =
    envelope.success !== undefined && envelope.data !== undefined
      ? envelope.data
      : unwrapApiData(payload);

  if (envelope.pagination && inner !== undefined) {
    return { data: inner, pagination: envelope.pagination } as T;
  }

  return inner as T;
}

export const apiClient = {
  get: async <T>(path: string, token?: string | null, businessId?: string | null) => {
    const response = await fetch(buildApiUrl(withBusinessId(path, businessId)), {
      headers: authHeaders(token),
    });
    return parseResponse<T>(response);
  },
  post: async <T>(path: string, body?: unknown, token?: string | null, businessId?: string | null) => {
    const response = await fetch(buildApiUrl(withBusinessId(path, businessId)), {
      method: "POST",
      headers: authHeaders(token),
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return parseResponse<T>(response);
  },
  put: async <T>(path: string, body?: unknown, token?: string | null, businessId?: string | null) => {
    const response = await fetch(buildApiUrl(withBusinessId(path, businessId)), {
      method: "PUT",
      headers: authHeaders(token),
      body: JSON.stringify(body ?? {}),
    });
    return parseResponse<T>(response);
  },
  patch: async <T>(path: string, body?: unknown, token?: string | null, businessId?: string | null) => {
    const response = await fetch(buildApiUrl(withBusinessId(path, businessId)), {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify(body ?? {}),
    });
    return parseResponse<T>(response);
  },
  upload: async <T>(path: string, formData: FormData, token?: string | null, businessId?: string | null) => {
    const resolved = token || getStoredAuthToken();
    const response = await fetch(buildApiUrl(withBusinessId(path, businessId)), {
      method: "POST",
      headers: {
        accept: "application/json",
        ...(resolved ? { Authorization: `Bearer ${resolved}` } : {}),
      },
      body: formData,
    });
    return parseResponse<T>(response);
  },
  delete: async <T>(path: string, token?: string | null, businessId?: string | null) => {
    const response = await fetch(buildApiUrl(withBusinessId(path, businessId)), {
      method: "DELETE",
      headers: authHeaders(token),
    });
    return parseResponse<T>(response);
  },
};

export { BASE_URL };
