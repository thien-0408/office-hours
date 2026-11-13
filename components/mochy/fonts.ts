import { Inter } from "next/font/google";

// Mochy surfaces (auth now, the rest of the app later) use Inter, matching the
// mobile app (docs/DESIGN.md §8). The Vietnamese subset keeps every diacritic in-face.
export const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});
