export class ApiClientError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    return import.meta.env.VITE_API_BASE_URL || "/api/v1";
  }
  return process.env.API_BASE_URL || "http://127.0.0.1:8788/api/v1";
}

export async function apiRequest<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    token?: string | null;
    isFormData?: boolean;
  } = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "X-Requested-With": "XMLHttpRequest",
  };
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }
  let bodyPayload: BodyInit | undefined;
  if (options.body !== undefined) {
    if (options.isFormData && options.body instanceof FormData) {
      bodyPayload = options.body;
    } else {
      headers["Content-Type"] = "application/json";
      bodyPayload = JSON.stringify(options.body);
    }
  }

  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      method: options.method || "GET",
      headers,
      body: bodyPayload,
      credentials: "include",
    });
  } catch {
    throw new ApiClientError(
      "network_unreachable",
      `Cannot reach API at ${getApiBaseUrl()}. Check your Cloudflare Pages dev server or API configuration.`,
      0,
    );
  }

  const text = await response.text();
  let parsed: Record<string, unknown> = {};
  if (text) {
    try {
      parsed = JSON.parse(text) as Record<string, unknown>;
    } catch {
      throw new ApiClientError("invalid_response", "Server returned non-JSON response.", response.status);
    }
  }

  if (!response.ok) {
    const errObj = parsed.error as { code?: string; message?: string } | undefined;
    throw new ApiClientError(
      errObj?.code || "request_failed",
      errObj?.message || `Request failed with status ${response.status}.`,
      response.status,
    );
  }
  return parsed as T;
}
