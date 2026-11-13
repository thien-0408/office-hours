// Theme choice for Mochy surfaces. "system" follows the OS through CSS
// (@media prefers-color-scheme in app/globals.css), so it needs no script and never flashes.
export const MOCHY_THEMES = ["system", "light", "dark"] as const;
export type MochyTheme = (typeof MOCHY_THEMES)[number];

export const THEME_COOKIE = "NEXT_THEME";

export function resolveMochyTheme(value: string | undefined): MochyTheme {
  return (MOCHY_THEMES as readonly string[]).includes(value ?? "") ? (value as MochyTheme) : "system";
}
