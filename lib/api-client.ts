import { env } from "@/lib/env";
import type { ProblemDetail, RefreshResponse } from "@/lib/auth/types";
import {
  SESSION_EXPIRED_EVENT,
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "@/lib/auth/token-storage";

export class ApiError extends Error {
  status: number;
  problem: ProblemDetail | null;

  constructor(status: number, problem: ProblemDetail | null, fallbackMessage: string) {
    super(problem?.message ?? fallbackMessage);
    this.name = "ApiError";
    this.status = status;
    this.problem = problem;
  }
}

interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Send the stored bearer token and refresh it once on 401. Turn off for public endpoints. */
  auth?: boolean;
}

type RequestOptions = Omit<ApiFetchOptions, "auth">;

function request(path: string, options: RequestOptions, accessToken: string | null) {
  const { body, headers, ...rest } = options;

  return fetch(`${env.apiBaseUrl}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  }).catch(() => {
    throw new ApiError(0, null, "Cannot reach the server. Please try again.");
  });
}

// Shared so that several requests failing with 401 at once trigger a single refresh.
let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  const res = await request("/auth/refresh", { method: "POST", body: { refreshToken } }, null);
  if (!res.ok) return null;

  const data = (await res.json()) as RefreshResponse;
  setTokens(data);
  return data.accessToken;
}

function refreshOnce(): Promise<string | null> {
  refreshInFlight ??= refreshAccessToken()
    .catch(() => null)
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

/** Calls the Spring Boot backend directly. Works in the browser and in Server Components (public endpoints only). */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { auth = true, ...init } = options;
  const accessToken = auth ? getAccessToken() : null;

  let res = await request(path, init, accessToken);

  if (res.status === 401 && accessToken) {
    const refreshed = await refreshOnce();
    if (refreshed) {
      res = await request(path, init, refreshed);
    } else {
      clearTokens();
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
  }

  if (!res.ok) {
    const problem = await res.json().catch(() => null) as ProblemDetail | null;
    throw new ApiError(res.status, problem, `Request to ${path} failed with ${res.status}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}
