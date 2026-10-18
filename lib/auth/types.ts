export type UserRole = "STUDENT" | "LECTURER" | "ADMIN";

export interface AuthUser {
  id: string; // UUID
  email: string;
  fullName: string;
  role: UserRole;
  department?: string | null;
}

export interface NotificationPrefs {
  bookingConfirmed: boolean;
  bookingDeclined: boolean;
  waitlistOffer: boolean;
  reminders: boolean;
}

// GET/PATCH /users/me; login and registration may return the smaller AuthUser.
export interface UserProfile extends AuthUser {
  notificationPrefs: NotificationPrefs;
}

export interface UpdateProfilePayload {
  fullName?: string;
  department?: string | null;
  notificationPrefs?: Partial<NotificationPrefs>;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
}

export interface LoginResponse extends RefreshResponse {
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
  code: number; // absolute error code (domain base + relative), e.g. AUTH range
  error: string; // stable error key, e.g. "INVALID_CREDENTIALS"
  message: string;
  path?: string;
  timestamp?: string;
  details?: unknown;
}
