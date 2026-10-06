import type { Metadata } from "next";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import CustomCursor from "@/components/CustomCursor";
import Preloader from "@/components/Preloader";
import NoiseOverlay from "@/components/NoiseOverlay";
import { Tajawal, Space_Grotesk } from "next/font/google";

const tajawal = Tajawal({ 
  subsets: ["arabic"], 
  weight: ["300", "400", "500", "700", "800", "900"],
  variable: "--font-tajawal" 
});

const spaceGrotesk = Space_Grotesk({ 
  subsets: ["latin"], 
  variable: "--font-space-grotesk" 
});

export const metadata: Metadata = {
  title: "Magixa | نبتكر ونقود مستقبلك البرمجي",
  description: "وكالة برمجيات رائدة في صياغة التجارب الرقمية والأنظمة السحابية وتطبيقات الجوال.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-48x48.png", type: "image/png", sizes: "48x48" },
      { url: "/icon.png", type: "image/png", sizes: "48x48" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "Magixa | نبتكر ونقود مستقبلك البرمجي",
    description: "نسد الفجوة بين التصميم المذهل والهندسة البرمجية المتطورة.",
    url: "https://magixa.tech",
    siteName: "Magixa",
    images: [
      {
        url: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1200&auto=format&fit=crop",
        width: 1200,
        height: 630,
        alt: "Magixa",
      }
    ],
    locale: "ar_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Magixa | نبتكر ونقود مستقبلك البرمجي",
    description: "نسد الفجوة بين التصميم المذهل والهندسة البرمجية المتطورة.",
    images: ["https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1200&auto=format&fit=crop"],
  },
};

import { LanguageProvider } from "@/context/LanguageContext";
import Navbar from "@/components/Navbar";
import WhatsAppFloatingButton from "@/components/WhatsAppFloatingButton";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${tajawal.variable} ${spaceGrotesk.variable} font-sans bg-bg-onyx text-white antialiased selection:bg-accent-radium/30 selection:text-accent-radium`}>
        <LanguageProvider>
          <NoiseOverlay />
          <Navbar />
          <Preloader />
          <CustomCursor />
          <SmoothScroll>
            {children}
          </SmoothScroll>
          <WhatsAppFloatingButton />
        </LanguageProvider>
      </body>
    </html>
  );
}
