import type { Metadata } from "next";
import { Frank_Ruhl_Libre, Heebo } from "next/font/google";
import { Header } from "@/components/Header";
import { AuthProvider } from "@/context/AuthContext";
import { Footer } from "@/components/Footer";
import { AccessibilityWidget } from "@/components/a11y/AccessibilityWidget";
import { CookieConsent } from "@/components/consent/CookieConsent";
import { A11Y_BOOT_SCRIPT } from "@/lib/a11y-prefs";
import "./globals.css";

const heebo = Heebo({ subsets: ["hebrew", "latin"], variable: "--font-heebo" });
const frank = Frank_Ruhl_Libre({ subsets: ["hebrew", "latin"], weight: ["500", "700", "900"], variable: "--font-frank" });

export const metadata: Metadata = {
  title: { default: "סופר-קאי | אוכל מוכן ביתי עד הבית", template: "%s | סופר-קאי" },
  description: "אוכל מוכן ביתי ישירות מהמטבח של קאי. מזמינים היום – מקבלים מחר.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The accessibility preferences script sets classes / font size on <html> before hydration.
    <html lang="he" dir="rtl" className={`${heebo.variable} ${frank.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: A11Y_BOOT_SCRIPT }} />
      </head>
      <body className="flex min-h-screen flex-col font-sans">
        <a
          href="#main-content"
          className="sr-only z-[60] rounded-xl bg-ink px-4 py-3 font-bold text-paper focus:not-sr-only focus:fixed focus:start-4 focus:top-4"
        >
          דילוג לתוכן הראשי
        </a>
        <AuthProvider>
          <Header />
          <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
            {children}
          </main>
          <Footer />
        </AuthProvider>
        <AccessibilityWidget />
        <CookieConsent />
      </body>
    </html>
  );
}
