"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import {
  SESSION_EXPIRED_EVENT,
  clearTokens,
  getAccessToken,
  setTokens,
} from "@/lib/auth/token-storage";
import type {
  AuthUser,
  ForgotPasswordPayload,
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  ResetPasswordPayload,
} from "@/lib/auth/types";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<AuthUser>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  forgotPassword: (payload: ForgotPasswordPayload) => Promise<void>;
  resetPassword: (payload: ResetPasswordPayload) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (!getAccessToken()) {
      setUser(null);
      return;
    }
    try {
      // apiFetch refreshes an expired access token once before giving up.
      setUser(await apiFetch<AuthUser>("/users/me"));
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    async function loadInitialUser() {
      await refreshUser();
      setIsLoading(false);
    }
    void loadInitialUser();
  }, [refreshUser]);

  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const data = await apiFetch<LoginResponse>("/auth/login", {
      method: "POST",
      body: payload,
      auth: false,
    });
    setTokens(data);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    await apiFetch<AuthUser>("/auth/register", { method: "POST", body: payload, auth: false });
  }, []);

  const logout = useCallback(async () => {
    // Best-effort server-side revocation; a failure here shouldn't block local logout.
    await apiFetch<void>("/auth/logout", { method: "POST" }).catch(() => {});
    clearTokens();
    setUser(null);
  }, []);

  const forgotPassword = useCallback(async (payload: ForgotPasswordPayload) => {
    // Always resolves — the UI must never reveal whether the email exists.
    await apiFetch<void>("/auth/forgot-password", { method: "POST", body: payload, auth: false })
      .catch(() => {});
  }, []);

  const resetPassword = useCallback(async (payload: ResetPasswordPayload) => {
    await apiFetch<void>("/auth/reset-password", { method: "POST", body: payload, auth: false });
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, register, logout, refreshUser, forgotPassword, resetPassword }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
