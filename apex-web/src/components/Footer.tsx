'use client';
import { useLanguage } from '@/context/LanguageContext';
import Magnetic from './Magnetic';
import Logo from './Logo';

export default function Footer() {
  const { t, lang } = useLanguage();
  
  return (
    <footer className="py-12 px-5 md:px-10 bg-[#050505] border-t border-border-glass">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <Logo />
        
        <div className="flex flex-col md:flex-row items-center gap-3 text-center md:text-start">
          <p className="text-text-muted font-sans text-sm font-medium">
            {t.footer.rights}
          </p>
        </div>
        
        <div className="flex gap-3 md:gap-4 flex-wrap justify-center items-center">
          <Magnetic>
            <a 
              href="https://wa.me/201285512241?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%20Apex%20Software%D8%8C%20%D8%A3%D9%88%D8%AF%20%D8%A7%D9%84%D8%AA%D9%88%D8%A7%D8%B5%D9%84%20%D9%85%D8%B9%D9%83%D9%85" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 hover:text-white hover:bg-emerald-500/20 transition-all font-sans text-xs md:text-sm cursor-none"
            >
              WhatsApp
            </a>
          </Magnetic>
          <Magnetic>
            <a 
              href="https://youtube.com/@abdullah_mohammed_aly?si=vOTJ97XU7kVODABx" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-full text-red-400 hover:text-white hover:bg-red-500/20 transition-all font-sans text-xs md:text-sm cursor-none"
            >
              YouTube
            </a>
          </Magnetic>
          <Magnetic>
            <a 
              href="https://github.com/abdullahprocom" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-white hover:text-accent-radium hover:bg-white/10 transition-all font-sans text-xs md:text-sm cursor-none"
            >
              GitHub
            </a>
          </Magnetic>
          <Magnetic>
            <a 
              href="mailto:bm1943440@gmail.com" 
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-all font-sans text-xs md:text-sm cursor-none"
            >
              bm1943440@gmail.com
            </a>
          </Magnetic>
        </div>
      </div>
    </footer>
  );
}
