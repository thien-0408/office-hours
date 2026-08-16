import localFont from "next/font/local";

// Self-hosted Satoshi (Fontshare, free-for-commercial-use EULA — see
// assets/fonts/satoshi/LICENSE.txt), scoped to the /landing route only.
// Loaded via next/font/local so it's bundled and served from this app at
// build time, same zero-runtime-fetch treatment as the app's Geist/Archivo
// (see docs/DESIGN.md §2) — no external CDN request, just a different font
// source (local files instead of next/font/google's registry).
export const satoshi = localFont({
  src: [
    { path: "../../assets/fonts/satoshi/Satoshi-Regular.woff2", weight: "400", style: "normal" },
    { path: "../../assets/fonts/satoshi/Satoshi-Medium.woff2", weight: "500", style: "normal" },
    { path: "../../assets/fonts/satoshi/Satoshi-Bold.woff2", weight: "700", style: "normal" },
    { path: "../../assets/fonts/satoshi/Satoshi-Black.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-satoshi",
  display: "swap",
});
