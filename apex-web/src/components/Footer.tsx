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
        
        <div className="flex gap-2.5 md:gap-3 flex-wrap justify-center items-center">
          {/* LinkedIn */}
          <Magnetic>
            <a 
              href="https://www.linkedin.com/company/apex-dev-team/?viewAsMember=true" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="px-3.5 py-1.5 bg-[#0a66c2]/10 border border-[#0a66c2]/30 rounded-full text-[#0a66c2] hover:text-white hover:bg-[#0a66c2]/20 transition-all font-sans text-xs md:text-sm cursor-none flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
              </svg>
              <span>LinkedIn</span>
            </a>
          </Magnetic>

          {/* WhatsApp */}
          <Magnetic>
            <a 
              href="https://wa.me/201285512241?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%20Magixa%20Tech%D8%8C%20%D8%A3%D9%88%D8%AF%20%D8%A7%D9%84%D8%AA%D9%88%D8%A7%D8%B5%D9%84%20%D9%85%D8%B9%D9%83%D9%85" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 hover:text-white hover:bg-emerald-500/20 transition-all font-sans text-xs md:text-sm cursor-none"
            >
              WhatsApp
            </a>
          </Magnetic>

          {/* Facebook */}
          <Magnetic>
            <a 
              href="https://www.facebook.com/magixasoftware/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="px-3.5 py-1.5 bg-blue-600/10 border border-blue-600/30 rounded-full text-blue-400 hover:text-white hover:bg-blue-600/20 transition-all font-sans text-xs md:text-sm cursor-none"
            >
              Facebook
            </a>
          </Magnetic>

          {/* Instagram */}
          <Magnetic>
            <a 
              href="https://www.instagram.com/magixa_tech?stkn=dzJ4OXNnczZ0Yno2" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="px-3.5 py-1.5 bg-pink-500/10 border border-pink-500/30 rounded-full text-pink-400 hover:text-white hover:bg-pink-500/20 transition-all font-sans text-xs md:text-sm cursor-none"
            >
              Instagram
            </a>
          </Magnetic>

          {/* YouTube */}
          <Magnetic>
            <a 
              href="https://youtube.com/@magixa_tech?si=DujkRUUzNmLoU8s1" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="px-3.5 py-1.5 bg-red-500/10 border border-red-500/30 rounded-full text-red-400 hover:text-white hover:bg-red-500/20 transition-all font-sans text-xs md:text-sm cursor-none"
            >
              YouTube
            </a>
          </Magnetic>

          {/* TikTok */}
          <Magnetic>
            <a 
              href="https://www.tiktok.com/@apexcode_team03" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="px-3.5 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-cyan-400 hover:text-white hover:bg-cyan-500/20 transition-all font-sans text-xs md:text-sm cursor-none"
            >
              TikTok
            </a>
          </Magnetic>

          {/* Threads */}
          <Magnetic>
            <a 
              href="https://www.threads.net/@ape_xsoftware" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="px-3.5 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-full text-purple-400 hover:text-white hover:bg-purple-500/20 transition-all font-sans text-xs md:text-sm cursor-none"
            >
              Threads
            </a>
          </Magnetic>

          {/* GitHub */}
          <Magnetic>
            <a 
              href="https://github.com/abdullahprocom" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="px-3.5 py-1.5 bg-white/5 border border-white/10 rounded-full text-white hover:text-accent-radium hover:bg-white/10 transition-all font-sans text-xs md:text-sm cursor-none"
            >
              GitHub
            </a>
          </Magnetic>

          {/* Link in Bio */}
          <Magnetic>
            <a 
              href="/bio" 
              className="px-3.5 py-1.5 bg-purple-500/15 border border-purple-500/40 rounded-full text-purple-300 hover:text-white hover:bg-purple-500/30 transition-all font-sans text-xs md:text-sm font-semibold cursor-none flex items-center gap-1"
            >
              <span>🔗</span>
              <span>Bio</span>
            </a>
          </Magnetic>

          {/* Official Domain Email Placeholder */}
          <Magnetic>
            <a 
              href="mailto:contact@apexsoftware.com" 
              title="Official Business Email Coming Soon"
              className="px-3.5 py-1.5 bg-white/5 border border-white/10 rounded-full text-slate-300 hover:text-accent-radium hover:bg-white/10 transition-all font-sans text-xs md:text-sm cursor-none flex items-center gap-1.5"
            >
              <span>contact@apexsoftware.com</span>
              <span className="text-[10px] text-amber-400/80">(Soon)</span>
            </a>
          </Magnetic>
        </div>
      </div>
    </footer>
  );
}
