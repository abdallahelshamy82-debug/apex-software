'use client';

import { motion } from 'framer-motion';
import Magnetic from './Magnetic';
import { useLanguage } from '@/context/LanguageContext';
import { APP_RELEASE } from '@/constants/appRelease';

export default function Hero() {
  const { t, lang } = useLanguage();
  const words = t.hero.title.split(" ");

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.15 },
    },
  };

  const wordVariants = {
    hidden: { opacity: 0, y: 35 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.7, ease: 'easeOut' as any }
    },
  };

  return (
    <section className="relative w-full min-h-screen flex flex-col justify-center px-5 md:px-10 bg-bg-onyx overflow-hidden pt-32 md:pt-28 pb-12">
      {/* Ambient background glow - hardware-accelerated */}
      <div 
        aria-hidden="true" 
        className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[70vw] h-[35vh] bg-accent-radium/5 blur-[100px] rounded-full pointer-events-none will-change-transform" 
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto">
        <motion.h1 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-4xl md:text-7xl lg:text-[6.5rem] font-heading font-black text-white leading-[1.25] tracking-tight flex flex-wrap gap-x-3 gap-y-2 md:gap-x-5 justify-center md:justify-start"
        >
          {words.map((word, index) => {
            const isHighlight = t.hero.highlights.includes(word);
            return (
              <motion.span 
                key={index} 
                variants={wordVariants}
                className={`inline-block ${isHighlight ? 'text-accent-radium drop-shadow-[0_0_25px_rgba(204,255,0,0.3)]' : ''}`}
              >
                {word}
              </motion.span>
            );
          })}
        </motion.h1>

        <div className="mt-16 md:mt-24 flex flex-col md:flex-row justify-between items-start gap-10 border-t border-border-glass pt-10">
          
          <div className="flex flex-col gap-6 max-w-2xl">
            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="text-text-muted text-base md:text-xl leading-relaxed font-sans text-center md:text-start"
            >
              {t.hero.desc}
            </motion.p>

            {/* High-Converting Action Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.7 }}
              className="flex flex-wrap items-center gap-3"
            >
              {/* 1. Start Project -> Scrolls smoothly to #contact */}
              <Magnetic strength={0.2}>
                <a 
                  href="#contact"
                  className="w-full sm:w-auto text-center px-8 py-3.5 rounded-full bg-accent-radium text-bg-onyx font-sans font-bold text-base hover:bg-white hover:shadow-[0_0_25px_rgba(204,255,0,0.5)] transition-all shadow-[0_0_15px_rgba(204,255,0,0.35)] block cursor-none"
                >
                  {t.common.startProject}
                </a>
              </Magnetic>
              
              {/* 2. Download Latest App APK */}
              <Magnetic strength={0.2}>
                <a 
                  href={APP_RELEASE.downloadUrl}
                  download="magixa.apk"
                  className="w-full sm:w-auto text-center px-6 py-3.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-white font-sans font-bold text-sm md:text-base hover:bg-white/10 hover:border-accent-radium/40 transition-all flex items-center justify-center gap-2 block cursor-none group"
                >
                  <svg className="w-4 h-4 text-accent-radium shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  <span>{t.common.downloadApp}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-radium/15 text-accent-radium border border-accent-radium/35 font-mono font-semibold">
                    {APP_RELEASE.versionFull}
                  </span>
                </a>
              </Magnetic>

              {/* 3. Explore Portfolio */}
              <Magnetic strength={0.2}>
                <a 
                  href="#portfolio"
                  className="w-full sm:w-auto text-center px-6 py-3.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-white font-sans font-bold text-sm md:text-base hover:bg-white/10 hover:border-accent-radium/40 transition-all block cursor-none"
                >
                  {t.common.viewWork}
                </a>
              </Magnetic>

              {/* 4. Masked WhatsApp Contact */}
              <Magnetic strength={0.2}>
                <a 
                  href="/whatsapp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto text-center px-5 py-3.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:text-white transition-all font-sans font-medium text-sm flex items-center justify-center gap-2 block cursor-none"
                >
                  <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.54 1.761.814 2.791.814 3.18 0 5.767-2.586 5.768-5.766 0-3.18-2.587-5.766-5.768-5.766zm9.969 5.828c0 5.514-4.486 10-10 10-1.748 0-3.385-.45-4.819-1.242l-5.181 1.356 1.378-5.034c-.886-1.488-1.378-3.216-1.378-5.08 0-5.514 4.486-10 10-10s10 4.486 10 10z"/>
                  </svg>
                  <span>WhatsApp</span>
                </a>
              </Magnetic>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.8 }}
              className="flex items-center gap-2 text-xs text-text-muted font-sans px-1"
            >
              <span className="w-2 h-2 rounded-full bg-accent-radium animate-pulse" />
              <span>
                {lang === 'ar' 
                  ? `أحدث إصدار أندرويد متوفر للتحميل: ${APP_RELEASE.versionFull}` 
                  : `Latest Android APK Available: ${APP_RELEASE.versionFull}`}
              </span>
            </motion.div>
          </div>

          {/* Status Badge */}
          <Magnetic>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.8 }}
              className="flex flex-col gap-3 font-sans uppercase tracking-[0.15em] text-xs font-bold text-gray-500 cursor-none self-center md:self-start"
            >
              <span>{t.hero.badge}</span>
              <div className="flex items-center gap-3 text-white bg-card-dark/80 border border-border-glass px-4 py-2 rounded-full backdrop-blur-md">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-radium opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-accent-radium"></span>
                </span>
                <span className="text-xs md:text-sm font-medium tracking-normal text-slate-200">{t.hero.badgeDesc}</span>
              </div>
            </motion.div>
          </Magnetic>

        </div>
      </div>
    </section>
  );
}
