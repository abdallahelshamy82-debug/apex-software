'use client';
import { motion } from 'framer-motion';
import Magnetic from './Magnetic';
import { useLanguage } from '@/context/LanguageContext';

export default function Contact() {
  const { t, lang } = useLanguage();

  return (
    <section className="py-24 px-8 md:px-20 bg-bg-onyx relative overflow-hidden">
      <div className="max-w-4xl mx-auto border-t border-border-glass pt-24 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="mb-16 text-center"
        >
           <h2 className="text-5xl md:text-7xl font-serif font-bold text-white mb-6">
            {t.contact.title} <span className="text-accent-radium italic px-2">{t.contact.titleHighlight}</span>
          </h2>
          <p className="text-text-muted font-sans text-lg md:text-xl max-w-xl mx-auto leading-relaxed">
            {t.contact.desc}
          </p>
        </motion.div>

        <motion.form 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ delay: 0.2 }}
          className="flex flex-col gap-6 bg-card-dark p-8 md:p-12 rounded-3xl border border-border-glass shadow-2xl backdrop-blur-xl"
        >
          <div className="flex flex-col md:flex-row gap-6">
            <input 
              type="text" 
              placeholder={t.contact.name}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-white font-sans focus:outline-none focus:border-accent-radium transition-colors cursor-none"
            />
            <input 
              type="email" 
              placeholder={t.contact.email}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-white font-sans focus:outline-none focus:border-accent-radium transition-colors cursor-none"
            />
          </div>
          <textarea 
            placeholder={t.contact.message}
            rows={5}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-white font-sans focus:outline-none focus:border-accent-radium transition-colors cursor-none resize-none"
          />
          
          <div className={`flex mt-4 ${lang === 'ar' ? 'justify-end' : 'justify-end'}`}>
            <Magnetic strength={0.2}>
              <button 
                type="button"
                className="px-10 py-4 rounded-full bg-accent-radium text-bg-onyx font-sans font-bold text-lg hover:bg-white transition-colors shadow-[0_0_20px_rgba(204,255,0,0.3)] cursor-none"
              >
                {t.contact.submit}
              </button>
            </Magnetic>
          </div>
        </motion.form>
      </div>
    </section>
  )
}
