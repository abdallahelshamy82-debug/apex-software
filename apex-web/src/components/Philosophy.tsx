'use client';

import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';

export default function Philosophy() {
  const { t, lang } = useLanguage();

  return (
    <section className="py-24 px-8 md:px-20 bg-bg-onyx">
      <div className="max-w-7xl mx-auto border-t border-border-glass pt-24">
        
        <motion.h2 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-5xl md:text-7xl font-serif font-bold text-white mb-16"
        >
          {t.philosophy.title} <span className="text-accent-radium italic px-2">{t.philosophy.titleHighlight}</span>
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {t.philosophy.features.map((f, i) => (
            <motion.div 
              key={f.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.15, duration: 0.8 }}
              className="bg-card-dark border border-border-glass rounded-2xl p-10 hover:bg-card-hover hover:border-white/10 transition-all duration-500 group"
            >
              <div className={`mb-10 text-accent-radium group-hover:scale-110 transition-transform duration-500 ${lang === 'ar' ? 'origin-right' : 'origin-left'}`}>
                {f.icon === 'bolt' && (
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )}
                {f.icon === 'architecture' && (
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                )}
                {f.icon === 'target' && (
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <circle cx="12" cy="12" r="9" />
                    <circle cx="12" cy="12" r="4" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v3m0 14v3M2 12h3m14 0h3" />
                  </svg>
                )}
              </div>
              <h3 className="text-2xl font-serif font-bold text-white mb-4">{f.title}</h3>
              <p className="text-text-muted font-sans leading-relaxed text-sm md:text-base pr-0">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
