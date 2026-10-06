'use client';

import { useLanguage } from '@/context/LanguageContext';

export default function WhatsAppFloatingButton() {
  const { lang } = useLanguage();

  return (
    <aside 
      aria-label="WhatsApp Contact"
      className="fixed bottom-6 right-6 z-[90] flex items-center group pointer-events-auto"
    >
      <a
        href="/whatsapp"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="flex items-center gap-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white px-4 py-3 rounded-full shadow-[0_4px_25px_rgba(37,211,102,0.4)] transition-all transform hover:scale-105 active:scale-95 cursor-none"
      >
        <svg 
          className="w-6 h-6 fill-current" 
          viewBox="0 0 24 24"
        >
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.54 1.761.814 2.791.814 3.18 0 5.767-2.586 5.768-5.766 0-3.18-2.587-5.766-5.768-5.766zm9.969 5.828c0 5.514-4.486 10-10 10-1.748 0-3.385-.45-4.819-1.242l-5.181 1.356 1.378-5.034c-.886-1.488-1.378-3.216-1.378-5.08 0-5.514 4.486-10 10-10s10 4.486 10 10z"/>
        </svg>
        <span className="font-sans font-bold text-sm tracking-wide hidden sm:inline">
          {lang === 'ar' ? 'تواصل عبر واتساب' : 'Chat on WhatsApp'}
        </span>
      </a>
    </aside>
  );
}
