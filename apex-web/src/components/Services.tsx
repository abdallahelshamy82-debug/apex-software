'use client';

import { useRef } from 'react';
import { motion, useScroll, useInView } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';

function ServiceRow({ srv, i, lang }: { srv: any; i: number; lang: string }) {
  const isEven = i % 2 === 0;
  const dotRef = useRef<HTMLDivElement>(null);
  
  // The tip of the glowing bar is mathematically locked to the 50% vertical center of the screen.
  // By setting bottom margin to -50%, the dot enters the "view" exactly when it crosses the 50% line.
  // It will stay active while in the upper half of the screen.
  const isInView = useInView(dotRef, { margin: "0px 0px -50% 0px" });

  return (
    <div 
      className={`relative flex w-full items-center py-20 md:py-32 justify-start ${isEven ? 'md:justify-start' : 'md:justify-end'}`}
    >
      {/* Empty Dot that fills up */}
      <motion.div 
        ref={dotRef}
        initial={false}
        animate={isInView ? "visible" : "hidden"}
        variants={{
          hidden: { 
            borderColor: 'rgba(255,255,255,0.2)', 
            backgroundColor: 'var(--color-bg-onyx)', 
            scale: 0.8 
          },
          visible: { 
            borderColor: 'var(--color-accent-radium)', 
            backgroundColor: 'var(--color-accent-radium)', 
            boxShadow: '0 0 15px var(--color-accent-radium)', 
            scale: 1.2 
          }
        }}
        className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full z-20 transition-all duration-300 ${
          lang === 'ar' 
            ? 'right-[6px] md:right-auto md:left-1/2 md:-translate-x-1/2' 
            : 'left-[6px] md:left-1/2 md:-translate-x-1/2'
        }`}
      />

      {/* Content Box */}
      <div 
        className={`w-full md:w-1/2 ${
          lang === 'ar'
            ? `pr-12 md:pr-0 ${isEven ? 'md:pl-16 lg:md:pl-24' : 'md:pr-16 lg:pr-24'}`
            : `pl-12 md:pl-0 ${isEven ? 'md:pr-16 lg:pr-24' : 'md:pl-16 lg:pl-24'}`
        }`}
      >
        <motion.div
          initial={false}
          animate={isInView ? "visible" : "hidden"}
          variants={{
            hidden: { opacity: 0.15, filter: 'blur(3px)', x: lang === 'ar' ? (isEven ? 30 : -30) : (isEven ? -30 : 30) },
            visible: { opacity: 1, filter: 'blur(0px)', x: 0 }
          }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`flex flex-col ${
            lang === 'ar' 
              ? (isEven ? 'md:items-start md:text-right' : 'md:items-start md:text-right') 
              : (isEven ? 'md:items-end md:text-right' : 'md:items-start md:text-left')
          }`}
        >
          <span className="text-accent-radium font-sans font-black text-3xl md:text-4xl mb-4 drop-shadow-[0_0_15px_rgba(204,255,0,0.4)] block">
            {srv.id}
          </span>
          <h3 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white mb-6">
            {srv.title}
          </h3>
          <p className="text-text-muted font-sans text-lg md:text-xl leading-relaxed">
            {srv.desc}
          </p>
        </motion.div>
      </div>

    </div>
  );
}

export default function Services() {
  const { t, lang } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track scroll progress to fill the vertical bar
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 50%", "end 50%"]
  });

  return (
    <section className="py-24 px-8 md:px-20 bg-bg-onyx text-white">
      <div className="max-w-7xl mx-auto border-t border-border-glass pt-24">
        
        <div className="flex flex-col items-center text-center mb-20 gap-6">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-7xl font-serif font-bold leading-tight"
          >
            {t.services.title} <span className="text-accent-radium italic px-2">{t.services.titleHighlight}</span>
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="max-w-2xl text-text-muted font-sans leading-relaxed text-lg"
          >
            {t.services.desc}
          </motion.p>
        </div>

        {/* Alternating Timeline Section */}
        <div ref={containerRef} className="relative mt-20 md:mt-32 w-full">
          
          {/* Vertical Track Background */}
          <div className={`absolute top-0 bottom-0 w-[2px] bg-white/10 ${lang === 'ar' ? 'right-[13px] md:right-auto md:left-1/2 md:-translate-x-1/2' : 'left-[13px] md:left-1/2 md:-translate-x-1/2'}`} />
          
          {/* Glowing Fill Bar linked to Scroll */}
          <motion.div 
            style={{ scaleY: scrollYProgress, transformOrigin: 'top' }}
            className={`absolute top-0 bottom-0 w-[4px] bg-accent-radium shadow-[0_0_20px_#ccff00] z-10 ${lang === 'ar' ? 'right-[12px] md:right-auto md:left-1/2 md:-translate-x-1/2' : 'left-[12px] md:left-1/2 md:-translate-x-1/2'}`}
          />

          {/* Service Items */}
          <div className="flex flex-col w-full">
            {t.services.list.map((srv: any, i: number) => (
              <ServiceRow key={srv.id} srv={srv} i={i} lang={lang} />
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
