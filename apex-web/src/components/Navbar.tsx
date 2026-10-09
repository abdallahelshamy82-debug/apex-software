'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from './Logo';

export default function Navbar() {
  const pathname = usePathname();
  const { lang, toggleLang, t } = useLanguage();
  const [isVisible, setIsVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Check if user has scrolled past top
      if (currentScrollY > 60) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }

      // Smart Auto-Hide: Hide on scroll down (>100px), Reveal on scroll up
      if (currentScrollY > 120) {
        if (currentScrollY > lastScrollY + 5) {
          // Scrolling DOWN -> Hide navbar so it never blocks content
          setIsVisible(false);
        } else if (currentScrollY < lastScrollY - 5) {
          // Scrolling UP -> Reveal navbar immediately for navigation
          setIsVisible(true);
        }
      } else {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  if (pathname === '/bio') {
    return null;
  }

  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: isVisible ? 0 : -100 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      className={`fixed top-0 left-0 w-full z-[100] transition-all duration-300 pointer-events-none ${
        isScrolled ? 'py-3' : 'py-5 md:py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div 
          className={`flex justify-between items-center pointer-events-auto transition-all duration-300 ${
            isScrolled 
              ? 'bg-card-dark/85 backdrop-blur-xl border border-white/10 shadow-[0_10px_35px_rgba(0,0,0,0.7)] rounded-full px-4 sm:px-6 py-2.5' 
              : 'bg-transparent px-2'
          }`}
        >
          {/* Brand Logo */}
          <a href="#" className="cursor-none group">
            <Logo />
          </a>
          
          {/* Quick Navigation & Language Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Direct Link in Bio Button */}
            <Link
              href="/bio"
              className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-accent-radium/15 border border-accent-radium/40 text-accent-radium hover:bg-accent-radium hover:text-bg-onyx font-sans text-xs sm:text-sm font-bold transition-all shadow-[0_0_15px_rgba(204,255,0,0.18)] flex items-center gap-1.5 cursor-none"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              <span>{lang === 'ar' ? 'روابطنا' : 'Bio'}</span>
            </Link>

            {/* Direct APK Download Button */}
            <a 
              href="/magixa.apk"
              download="magixa.apk"
              className="hidden lg:flex items-center gap-1.5 px-3.5 py-1.5 sm:py-2 rounded-full bg-white/5 border border-white/15 text-slate-200 hover:text-white hover:border-accent-radium/50 font-sans text-xs sm:text-sm font-medium transition-all backdrop-blur-md cursor-none"
            >
              <svg className="w-3.5 h-3.5 text-accent-radium" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span>{lang === 'ar' ? 'تطبيق أندرويد' : 'App APK'}</span>
            </a>

            <a 
              href="#portfolio"
              className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/15 text-slate-200 hover:text-white hover:border-accent-radium/50 font-sans text-xs sm:text-sm font-medium transition-all backdrop-blur-md cursor-none"
            >
              {t.common.viewWork}
            </a>

            <a 
              href="/system"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-block px-4 py-2 rounded-full bg-accent-radium/15 border border-accent-radium/35 text-accent-radium hover:bg-accent-radium hover:text-bg-onyx font-sans text-xs sm:text-sm font-bold transition-all shadow-sm cursor-none"
            >
              {t.common.startProject}
            </a>

            <button 
              onClick={toggleLang}
              className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-white font-sans text-xs sm:text-sm font-bold hover:bg-white/15 hover:border-white/20 transition-all cursor-none"
            >
              {lang === 'ar' ? 'English' : 'العربية'}
            </button>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
