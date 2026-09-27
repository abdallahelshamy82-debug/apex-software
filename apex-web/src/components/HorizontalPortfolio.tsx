'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { useLanguage } from '@/context/LanguageContext';

export default function HorizontalPortfolio() {
  const { t, lang } = useLanguage();
  const targetRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: targetRef,
  });

  // Dynamic scroll mapping based on RTL vs LTR
  const x = useTransform(scrollYProgress, [0, 1], ['0vw', lang === 'ar' ? '150vw' : '-150vw']); 

  return (
    <section className="relative py-24 bg-bg-onyx overflow-hidden">
      
      <div className="flex flex-col justify-center">
        
        <div className={`px-8 md:px-24 mb-16 ${lang === 'ar' ? 'text-right' : 'text-left'} z-20`}>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-5xl md:text-7xl font-serif font-bold text-white mb-2"
            >
              {t.portfolio.title} <span className="text-accent-radium italic px-2">{t.portfolio.titleHighlight}</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-text-muted text-lg font-sans mt-4 max-w-2xl"
            >
              {t.portfolio.desc}
            </motion.p>
        </div>
        
        {/* NATIVE HORIZONTAL SCROLL CONTAINER */}
        <div className="flex overflow-x-auto snap-x snap-mandatory px-4 md:px-10 gap-6 w-full pb-10" style={{ scrollbarWidth: 'none' }}>
          {t.portfolio.projects.map((p, index) => {
            return (
              <a 
                key={p.id} 
                href={p.link}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-[85vw] md:min-w-[400px] h-[60vh] snap-center shrink-0 relative group cursor-pointer overflow-hidden bg-card-dark rounded-xl border border-border-glass block"
              >
                
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-all duration-1000 group-hover:scale-105 filter md:grayscale md:opacity-40 grayscale-0 opacity-60 md:group-hover:grayscale-0 md:group-hover:opacity-60"
                  style={{ backgroundImage: `url('${p.img}')` }}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-100 md:opacity-80 md:group-hover:opacity-100 transition-opacity duration-500" />

                <div className={`absolute bottom-0 ${lang === 'ar' ? 'right-0' : 'left-0'} w-full p-10 flex flex-col justify-end z-10`}>
                  <div className="overflow-hidden mb-2">
                    <h3 className="text-3xl md:text-5xl font-serif font-bold text-white transform-none md:translate-y-4 md:group-hover:translate-y-0 transition-transform duration-500">
                      {p.title}
                    </h3>
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xl text-accent-radium font-sans transform-none opacity-100 md:translate-y-full md:opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 md:delay-100 mt-2">
                      {p.desc}
                    </p>
                  </div>
                </div>
              </a>
            );
          })}
          {/* END SPACER TO ALLOW LAST CARD TO BE FULLY VISIBLE */}
          <div className="w-4 md:w-10 shrink-0" />
        </div>

      </div>
    </section>
  )
}
