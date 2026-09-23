'use client';
import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';

export default function Experience() {
  const { t, lang } = useLanguage();
  
  return (
    <section className="py-24 px-8 md:px-20 bg-bg-onyx">
      <div className="max-w-7xl mx-auto border-t border-border-glass pt-24">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className={`mb-20 ${lang === 'ar' ? 'text-right' : 'text-left'}`}
        >
           <h2 className="text-5xl md:text-7xl font-serif font-bold text-white">
            {t.experience.title} <span className="text-accent-radium italic px-2">{t.experience.titleHighlight}</span>
          </h2>
        </motion.div>

        <div className={`flex flex-col gap-12 ${lang === 'ar' ? 'border-r pr-8 md:pr-12 mr-4' : 'border-l pl-8 md:pl-12 ml-4'} border-border-glass`}>
          {t.experience.list.map((exp, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: lang === 'ar' ? 20 : -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.15, duration: 0.8 }}
              className="relative group cursor-crosshair py-6"
            >
              {/* Glowing Dot on Timeline */}
              <span className={`absolute top-[32px] w-4 h-4 rounded-full bg-bg-onyx border-2 border-border-glass group-hover:border-accent-radium group-hover:bg-accent-radium transition-all duration-500 shadow-[0_0_10px_rgba(204,255,0,0)] group-hover:shadow-[0_0_20px_rgba(204,255,0,0.8)] group-hover:scale-150 ${lang === 'ar' ? '-right-[41px] md:-right-[57px]' : '-left-[41px] md:-left-[57px]'}`} />

              <div className="flex flex-col">
                {/* Year - Visible but dims when not hovered to draw attention */}
                <span className="text-white/30 group-hover:text-accent-radium font-sans text-sm font-bold tracking-[0.2em] uppercase mb-4 block transition-colors duration-500">
                  {exp.year}
                </span>
                
                {/* Content - Hidden and blurred until hovered */}
                <div className="opacity-0 group-hover:opacity-100 blur-md group-hover:blur-none -translate-x-4 group-hover:translate-x-0 transition-all duration-700 ease-out flex flex-col">
                  <h3 className="text-3xl md:text-4xl font-serif font-bold text-white mb-2">{exp.role}</h3>
                  <h4 className="text-lg text-white/50 font-sans mb-4">{exp.company}</h4>
                  <p className="text-text-muted font-sans leading-relaxed max-w-2xl text-base md:text-lg">
                    {exp.desc}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
