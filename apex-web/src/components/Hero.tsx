'use client';

import { motion } from 'framer-motion';
import Magnetic from './Magnetic';
import { useLanguage } from '@/context/LanguageContext';

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
          
          <div className="flex flex-col gap-8 max-w-xl">
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
              className="flex flex-col w-full sm:flex-row items-center gap-3.5"
            >
              <Magnetic strength={0.2}>
                <a 
                  href="https://wa.me/201558652579?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%20Magixa%20Tech%D8%8C%20%D8%A3%D9%88%D8%AF%20%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1%20%D8%B9%D9%86%20%D8%AE%D8%AF%D9%85%D8%A7%D8%AA%D9%83%D9%85%20%D9%88%D8%A8%D8%AF%D8%A1%20%D9%85%D8%B4%D8%B1%D9%88%D8%B9%20%D8%AC%D8%AF%D9%8A%D8%AF" 
                  target="_blank"  
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto text-center px-8 py-3.5 rounded-full bg-accent-radium text-bg-onyx font-sans font-bold text-base md:text-lg hover:bg-white hover:shadow-[0_0_25px_rgba(204,255,0,0.5)] transition-all shadow-[0_0_15px_rgba(204,255,0,0.35)] block cursor-none"
                >
                  {t.common.startProject}
                </a>
              </Magnetic>
              
              <Magnetic strength={0.2}>
                <a 
                  href="#portfolio"
                  className="w-full sm:w-auto text-center px-7 py-3.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-white font-sans font-bold text-base md:text-lg hover:bg-white/10 hover:border-accent-radium/40 transition-all block cursor-none"
                >
                  {t.common.viewWork}
                </a>
              </Magnetic>

              <Magnetic strength={0.2}>
                <a 
                  href="#contact"
                  className="w-full sm:w-auto text-center px-6 py-3.5 rounded-full bg-transparent border border-white/10 text-text-muted hover:text-white hover:border-white/20 font-sans font-medium text-sm md:text-base transition-colors block cursor-none"
                >
                  {t.common.contactUs}
                </a>
              </Magnetic>
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
