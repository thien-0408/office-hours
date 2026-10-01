import type { Metadata } from "next";
import { Archivo, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { AuthProvider } from "@/lib/auth/auth-context";
import PageTransition from "@/components/PageTransition";
import { ToastProvider } from "@/components/ToastProvider";
import { I18nProvider } from "@/i18n/provider";
import { getLocale } from "@/i18n/server";
import { LOCALE_META } from "@/i18n";
import "./globals.css";

// Primary UI font. Unlike Geist it ships a Vietnamese subset, so every diacritic
// (ă â ê ô ơ ư đ + tone marks) renders in-face instead of falling back to a system font.
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin", "latin-ext", "vietnamese"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Display face for landing-page headlines only — see docs/DESIGN.md.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin", "latin-ext", "vietnamese"],
  weight: ["800", "900"],
});

export const metadata: Metadata = {
  title: "OfficeHours",
  description: "Book conflict-free office hours in seconds, not email threads.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  return (
    <html
      lang={LOCALE_META[locale].htmlLang}
      data-theme="light"
      className={`${jakarta.variable} ${geistMono.variable} ${archivo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <I18nProvider initialLocale={locale}>
            <ToastProvider>
              <PageTransition>{children}</PageTransition>
            </ToastProvider>
          </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
