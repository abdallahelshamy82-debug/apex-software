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
  metadataBase: new URL("https://magixa.tech"),
  title: "Magixa | نبتكر ونصنع الأنظمة البرمجية التي تقود نجاح أعمالك",
  description: "وكالة برمجيات متخصصة في تطوير مواقع ومتاجر إلكترونية فائقة السرعة، وأنظمة ERP ونقاط بيع سحابية وتطبيقات الموبايل.",
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
    title: "Magixa | نبتكر ونصنع الأنظمة البرمجية التي تقود نجاح أعمالك",
    description: "مواقع ومتاجر إلكترونية وأنظمة ERP سحابية متفصلة بدقة على حجم نشاطك التجاري بأعلى أداء وسرعة.",
    url: "https://magixa.tech",
    siteName: "Magixa Tech",
    images: [
      {
        url: "/projects/erp-pos.png",
        width: 1200,
        height: 630,
        alt: "Magixa Tech Solutions",
      }
    ],
    locale: "ar_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Magixa | حلول برمجية وأنظمة سحابية متكاملة",
    description: "مواقع ومتاجر إلكترونية وأنظمة ERP سحابية متفصلة بدقة على حجم نشاطك التجاري بأعلى أداء وسرعة.",
    images: ["/projects/erp-pos.png"],
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
