import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import SmoothScroll from '@/components/SmoothScroll';
import AnimatedBackground from '@/components/AnimatedBackground';

const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-inter',
  display: 'swap'
});

const playfair = Playfair_Display({ 
  subsets: ['latin'], 
  variable: '--font-playfair',
  display: 'swap'
});

export const metadata: Metadata = {
  title: 'Portfolio | Premium Frontend Architect',
  description: 'Award-winning personal portfolio built with Next.js & Framer Motion',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="bg-[#050505] text-white antialiased font-sans selection:bg-white selection:text-black min-h-screen">
        <SmoothScroll>
          <AnimatedBackground />
          <main className="relative z-10 w-full flex flex-col items-center">
            {children}
          </main>
        </SmoothScroll>
      </body>
    </html>
  );
}
