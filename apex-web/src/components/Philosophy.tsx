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
              <div className={`text-3xl mb-12 opacity-80 group-hover:scale-110 group-hover:opacity-100 transition-transform duration-500 ${lang === 'ar' ? 'origin-right' : 'origin-left'}`}>
                {f.icon}
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
