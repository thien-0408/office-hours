import type { AuthUser } from "./types";

// Seeded local accounts — the Spring Boot backend doesn't exist yet, so
// app/api/auth/{login,me,logout}/route.ts fall back to these whenever
// apiFetch can't reach API_BASE_URL. One account per role, matching the
// personas in docs/capstone-officehours-plan.md §4. Delete this file (and
// its call sites) once real auth is live.
export interface MockAccount {
  email: string;
  password: string;
  user: AuthUser;
}

export const MOCK_ACCOUNTS: MockAccount[] = [
  {
    email: "student@officehours.dev",
    password: "password123",
    user: {
      id: 1001,
      email: "student@officehours.dev",
      fullName: "Minh Nguyen",
      role: "STUDENT",
      department: "Computer Science",
    },
  },
  {
    email: "lecturer@officehours.dev",
    password: "password123",
    user: {
      id: 2001,
      email: "lecturer@officehours.dev",
      fullName: "Dr. Amara Chen",
      role: "LECTURER",
      department: "Computer Science",
    },
  },
  {
    email: "admin@officehours.dev",
    password: "password123",
    user: {
      id: 3001,
      email: "admin@officehours.dev",
      fullName: "Huong Tran",
      role: "ADMIN",
      department: null,
    },
  },
];

const MOCK_TOKEN_PREFIX = "mock.";

export function findMockAccount(email: string, password: string): MockAccount | undefined {
  return MOCK_ACCOUNTS.find(
    (account) => account.email.toLowerCase() === email.trim().toLowerCase() && account.password === password
  );
}

// The "token" is just the user, base64-encoded — there's no backend to validate
// against, so /api/auth/me decodes it directly instead of calling apiFetch.
export function encodeMockToken(user: AuthUser): string {
  return MOCK_TOKEN_PREFIX + Buffer.from(JSON.stringify(user)).toString("base64url");
}

export function decodeMockToken(token: string): AuthUser | null {
  if (!token.startsWith(MOCK_TOKEN_PREFIX)) {
    return null;
  }
  try {
    const json = Buffer.from(token.slice(MOCK_TOKEN_PREFIX.length), "base64url").toString("utf8");
    return JSON.parse(json) as AuthUser;
  } catch {
    return null;
  }
}
