'use client';

import { motion } from 'framer-motion';
import Magnetic from './Magnetic';
import { useLanguage } from '@/context/LanguageContext';

export default function Hero() {
  const { t } = useLanguage();
  const words = t.hero.title.split(" ");

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 },
    },
  };

  const wordVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.9, ease: 'easeOut' as any }
    },
  };

  return (
    <section className="relative w-full min-h-screen flex flex-col justify-center px-8 md:px-20 bg-bg-onyx overflow-hidden pt-20 pb-10">
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[70vw] h-[40vh] bg-white/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 w-full max-w-7xl mx-auto">
        <motion.h1 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-6xl md:text-8xl lg:text-[7.5rem] font-heading font-black text-white leading-[1.2] md:leading-[1.25] tracking-tight flex flex-wrap gap-x-4 gap-y-2 md:gap-x-6"
        >
          {words.map((word, index) => {
            const isHighlight = t.hero.highlights.includes(word);
            return (
              <motion.span 
                key={index} 
                variants={wordVariants}
                className={`inline-block ${isHighlight ? 'text-accent-radium' : ''}`}
              >
                {word}
              </motion.span>
            );
          })}
        </motion.h1>

        <div className="mt-20 md:mt-32 flex flex-col md:flex-row justify-between items-start gap-12 border-t border-border-glass pt-12">
          
          <div className="flex flex-col gap-10 max-w-xl">
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 1 }}
              className="text-text-muted text-lg md:text-xl leading-relaxed font-sans"
            >
              {t.hero.desc}
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.8 }}
              className="flex flex-wrap items-center gap-4"
            >
              <Magnetic strength={0.2}>
                <a 
                  href={process.env.NEXT_PUBLIC_PORTAL_URL || '#'} target='_blank'  
                  className="px-8 py-4 rounded-full bg-accent-radium text-bg-onyx font-sans font-bold text-lg hover:bg-white transition-colors shadow-[0_0_20px_rgba(204,255,0,0.4)] block cursor-none"
                >
                  {t.common.startProject}
                </a>
              </Magnetic>
              
              <Magnetic strength={0.2}>
                <a 
                  href={process.env.NEXT_PUBLIC_PORTAL_URL || '#'} target='_blank'  
                  className="px-8 py-4 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-white font-sans font-bold text-lg hover:bg-white/10 transition-colors block cursor-none"
                >
                  {t.common.clientPortal}
                </a>
              </Magnetic>

              <Magnetic strength={0.2}>
                <a 
                  href="https://expo.dev/artifacts/eas/O9eYqlRKcalAIvfweoG4Ic2Wq5YBbkPIjs0F0M28hS8.apk" 
                  className="px-8 py-4 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-white font-sans font-bold text-lg hover:bg-white/10 transition-colors block cursor-none"
                >
                  {t.common.downloadApp}
                </a>
              </Magnetic>
            </motion.div>
          </div>

          <Magnetic>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 1 }}
              className="flex flex-col gap-4 font-sans uppercase tracking-[0.15em] text-xs font-bold text-gray-500 cursor-none"
            >
              <span>{t.hero.badge}</span>
              <div className="flex items-center gap-3 text-white">
                <span className="relative flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-radium opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-accent-radium"></span>
                </span>
                <span className="text-sm font-medium tracking-normal">{t.hero.badgeDesc}</span>
              </div>
            </motion.div>
          </Magnetic>

        </div>
      </div>
    </section>
  );
}
