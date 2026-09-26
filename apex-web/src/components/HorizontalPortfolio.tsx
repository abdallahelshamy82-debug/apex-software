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
    <section ref={targetRef} className="relative h-[250vh] bg-bg-onyx">
      
      <div className="sticky top-0 h-screen flex flex-col justify-center overflow-hidden">
        
        <div className={`absolute top-24 ${lang === 'ar' ? 'right-10 md:right-24' : 'left-10 md:left-24'} z-20`}>
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
              className="text-text-muted text-lg font-sans mt-4"
            >
              {t.portfolio.desc}
            </motion.p>
        </div>
        
        <motion.div style={{ x }} className="flex gap-10 px-10 md:px-24 w-[250vw] md:w-[180vw] items-center pt-32">
          {t.portfolio.projects.map((p, index) => {
            return (
              <a 
                key={p.id} 
                href={p.link}
                target="_blank"
                rel="noopener noreferrer"
                className="w-[85vw] md:w-[45vw] h-[60vh] shrink-0 relative group cursor-pointer overflow-hidden bg-card-dark rounded-xl border border-border-glass block"
              >
                
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-all duration-1000 group-hover:scale-105 filter grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-60"
                  style={{ backgroundImage: `url('${p.img}')` }}
                />

                {/* Solid black gradient overlay to ensure text legibility and prevent messy overlapping */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500" />

                <div className={`absolute bottom-0 ${lang === 'ar' ? 'right-0' : 'left-0'} w-full p-10 flex flex-col justify-end z-10`}>
                  <div className="overflow-hidden mb-2">
                    <h3 className="text-3xl md:text-5xl font-serif font-bold text-white transform-none md:translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                      {p.title}
                    </h3>
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xl text-accent-radium font-sans transform-none opacity-100 md:translate-y-full md:opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 md:delay-100 mt-2">
                      {p.desc}
                    </p>
                  </div>
                </div>

                <div className={`absolute top-8 ${lang === 'ar' ? 'right-8' : 'left-8'} text-white/20 font-sans font-bold text-6xl group-hover:text-accent-radium/20 transition-colors duration-500`}>
                  0{index + 1}
                </div>
              </a>
            );
          })}
        </motion.div>

      </div>
    </section>
  )
}
