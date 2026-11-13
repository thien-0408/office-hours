import { getMochyTheme } from "@/components/mochy/theme-server";
import AuthShell from "./AuthShell";

// Server wrapper: reads the theme cookie so the first paint already has the right theme.
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const theme = await getMochyTheme();
  return <AuthShell initialTheme={theme}>{children}</AuthShell>;
}
