import { AlertTriangle, Bell, Check, Info, X, type LucideIcon } from "lucide-react";
import { type Hue, HUE_TOKENS } from "./status-hues";

export type ToastVariant = "success" | "error" | "warning" | "info" | "neutral";

interface ToastVariantConfig {
  hue: Hue;
  icon: LucideIcon;
  defaultDuration: number;
  ariaRole: "status" | "alert";
  ariaLive: "polite" | "assertive";
}

export const TOAST_VARIANT_CONFIG: Record<ToastVariant, ToastVariantConfig> = {
  success: { hue: "success", icon: Check, defaultDuration: 4000, ariaRole: "status", ariaLive: "polite" },
  error: { hue: "danger", icon: X, defaultDuration: 6000, ariaRole: "alert", ariaLive: "assertive" },
  warning: { hue: "warning", icon: AlertTriangle, defaultDuration: 5000, ariaRole: "status", ariaLive: "polite" },
  info: { hue: "info", icon: Info, defaultDuration: 4000, ariaRole: "status", ariaLive: "polite" },
  neutral: { hue: "neutral", icon: Bell, defaultDuration: 4000, ariaRole: "status", ariaLive: "polite" },
};

export interface ToastHueToken {
  dot: string;
  glow: string;
  iconColor?: string;
}

const EXACT_TOAST_HUES: Record<ToastVariant, ToastHueToken> = {
  success: {
    dot: "#27C073",
    glow: "rgba(39, 192, 115, 0.22)", // Soft green glow
    iconColor: "text-white",
  },
  warning: {
    dot: "#FFC107",
    glow: "rgba(255, 193, 7, 0.20)", // Soft yellow glow
    iconColor: "text-neutral-900",    // Dark icon on yellow background
  },
  error: {
    dot: "#EB5757",
    glow: "rgba(235, 87, 87, 0.22)",  // Soft red/magenta glow
    iconColor: "text-white",
  },
  info: {
    dot: "#2F80ED",
    glow: "rgba(47, 128, 237, 0.20)",
    iconColor: "text-white",
  },
  neutral: {
    dot: "#6B7280",
    glow: "rgba(107, 114, 128, 0.12)",
    iconColor: "text-white",
  },
};

export function toastHueTokens(variant: ToastVariant): ToastHueToken {
  return EXACT_TOAST_HUES[variant] ?? {
    ...HUE_TOKENS[TOAST_VARIANT_CONFIG[variant].hue],
    glow: "transparent",
  };
}
