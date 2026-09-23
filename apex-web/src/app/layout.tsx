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
  title: "Apex Software | نبتكر مستقبلك",
  description: "وكالة برمجيات رائدة في صياغة التجارب الرقمية العالمية.",
  openGraph: {
    title: "Apex Software | نبتكر مستقبلك",
    description: "نسد الفجوة بين التصميم المذهل والهندسة القوية.",
    url: "https://apexsoftware.com",
    siteName: "Apex Software",
    images: [
      {
        url: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1200&auto=format&fit=crop",
        width: 1200,
        height: 630,
        alt: "Apex Software",
      }
    ],
    locale: "ar_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Apex Software | نبتكر مستقبلك",
    description: "نسد الفجوة بين التصميم المذهل والهندسة القوية.",
    images: ["https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1200&auto=format&fit=crop"],
  },
};

import { LanguageProvider } from "@/context/LanguageContext";
import Navbar from "@/components/Navbar";

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
        </LanguageProvider>
      </body>
    </html>
  );
}
