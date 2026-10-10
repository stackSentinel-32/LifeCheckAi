export class ApiError extends Error {
  public status: number;
  public details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, headers, ...customConfig } = options;

  let urlString = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`;

  if (params) {
    const url = new URL(urlString);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
    urlString = url.toString();
  }

  const config: RequestInit = {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    ...customConfig,
  };

  const response = await fetch(urlString, config);

  if (!response.ok) {
    let errorMessage = `HTTP error ${response.status}: ${response.statusText}`;
    let errorDetails: unknown = null;
    try {
      errorDetails = await response.json();
      if (errorDetails && typeof errorDetails === "object" && "detail" in errorDetails) {
        errorMessage = String((errorDetails as { detail: unknown }).detail);
      }
    } catch {
      // Body is not JSON
    }
    throw new ApiError(response.status, errorMessage, errorDetails);
  }

  return response.json() as Promise<T>;
}
