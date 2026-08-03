import { env } from "@/lib/env";
import type { ProblemDetail } from "@/lib/auth/types";

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
  accessToken?: string;
}

/** Calls the Spring Boot backend. Server-side only — never import from a Client Component. */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { body, accessToken, headers, ...rest } = options;

  const res = await fetch(`${env.apiBaseUrl}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  if (!res.ok) {
    const problem = await res.json().catch(() => null) as ProblemDetail | null;
    throw new ApiError(res.status, problem, `Request to ${path} failed with ${res.status}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}
