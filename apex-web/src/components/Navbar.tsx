'use client';

import { useLanguage } from '@/context/LanguageContext';
import { motion } from 'framer-motion';
import Logo from './Logo';

export default function Navbar() {
  const { lang, toggleLang, t } = useLanguage();

  return (
    <motion.nav 
      initial={{ y: -100 }} 
      animate={{ y: 0 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 w-full z-[100] px-8 py-6 pointer-events-none"
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center pointer-events-auto">
        <Logo className="mix-blend-difference" />
        
        <div className="flex items-center gap-4">
          <a 
            href="http://localhost:8081/login" 
            className="px-5 py-2.5 rounded-full border border-white/20 text-white font-sans text-sm font-medium hover:bg-white/10 transition-colors backdrop-blur-md cursor-none"
          >
            {t.common.clientPortal}
          </a>
          <button 
            onClick={toggleLang}
            className="px-6 py-2.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-white font-sans text-sm font-bold hover:bg-white/10 transition-colors shadow-lg cursor-none"
          >
            {lang === 'ar' ? 'English' : 'العربية'}
          </button>
        </div>
      </div>
    </motion.nav>
  );
}
