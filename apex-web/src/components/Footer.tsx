'use client';
import { useLanguage } from '@/context/LanguageContext';
import { APP_RELEASE } from '@/constants/appRelease';
import Magnetic from './Magnetic';
import Logo from './Logo';

export default function Footer() {
  const { t, lang } = useLanguage();
  
  return (
    <footer className="py-12 px-5 md:px-10 bg-[#050505] border-t border-border-glass">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <Logo />
        
        <div className="flex flex-col md:flex-row items-center gap-3 text-center md:text-left">
          <p className="text-text-muted font-sans text-sm font-medium">
            {t.footer.rights}
          </p>
          <span className="text-white/20 hidden md:inline">•</span>
          <a 
            href={APP_RELEASE.downloadUrl}
            download="magixa.apk"
            className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 hover:border-accent-radium/40 text-text-muted hover:text-white transition-colors text-xs font-sans cursor-none"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-accent-radium"></span>
            <span>{lang === 'ar' ? 'تطبيق أندرويد' : 'Android App'}: {APP_RELEASE.versionFull}</span>
          </a>
        </div>
        
        <div className={`flex gap-4 md:gap-6 flex-wrap justify-center ${lang === 'ar' ? 'flex-row-reverse' : ''}`}>
          <Magnetic><a href="#" className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-white hover:text-accent-radium hover:bg-white/10 transition-all font-sans text-xs md:text-sm cursor-none">LinkedIn</a></Magnetic>
          <Magnetic><a href="#" className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-white hover:text-accent-radium hover:bg-white/10 transition-all font-sans text-xs md:text-sm cursor-none">GitHub</a></Magnetic>
          <Magnetic><a href="#" className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-white hover:text-accent-radium hover:bg-white/10 transition-all font-sans text-xs md:text-sm cursor-none">Twitter</a></Magnetic>
        </div>
      </div>
    </footer>
  )
}
