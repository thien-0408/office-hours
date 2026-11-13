import { cookies } from "next/headers";
import { resolveMochyTheme, THEME_COOKIE, type MochyTheme } from "./theme";

export async function getMochyTheme(): Promise<MochyTheme> {
  const cookieStore = await cookies();
  return resolveMochyTheme(cookieStore.get(THEME_COOKIE)?.value);
}
