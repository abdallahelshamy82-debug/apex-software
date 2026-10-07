'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from './Logo';

export default function Navbar() {
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
            <a 
              href="#portfolio"
              className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/15 text-slate-200 hover:text-white hover:border-accent-radium/50 font-sans text-xs sm:text-sm font-medium transition-all backdrop-blur-md cursor-none"
            >
              {t.common.viewWork}
            </a>

            <a 
              href="#contact"
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
