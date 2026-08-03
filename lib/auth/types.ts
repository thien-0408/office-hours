export type UserRole = "STUDENT" | "LECTURER" | "ADMIN";

export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  department?: string | null;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
  user: AuthUser;
}

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  role: Extract<UserRole, "STUDENT" | "LECTURER">;
  department?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

// RFC 7807 problem detail, per capstone-api-endpoints.md §0 Conventions
export interface ProblemDetail {
  status: number;
  error: string;
  message: string;
  path?: string;
  timestamp?: string;
  details?: unknown;
}
