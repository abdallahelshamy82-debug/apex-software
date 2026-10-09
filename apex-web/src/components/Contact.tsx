'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Magnetic from './Magnetic';
import { useLanguage } from '@/context/LanguageContext';

export default function Contact() {
  const { t, lang } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;

    setStatus('submitting');
    setErrorMessage('');

    try {
      // 1. Send via internal API route (supports Web3Forms or Formspree)
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ name, email, message }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        setStatus('success');
        setName('');
        setEmail('');
        setMessage('');
        return;
      }

      // 2. Direct browser fallback via Formspree if configured
      const formspreeId = process.env.NEXT_PUBLIC_FORMSPREE_ID || 'myekwbdv';
      if (formspreeId) {
        const formspreeRes = await fetch(`https://formspree.io/f/${formspreeId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            name,
            email,
            message,
            _subject: `استفسار جديد من موقع Magixa Tech: ${name}`,
          }),
        });

        if (formspreeRes.ok) {
          setStatus('success');
          setName('');
          setEmail('');
          setMessage('');
          return;
        }
      }

      // 3. Direct browser fallback via Web3Forms if configured
      const clientWeb3Key = process.env.NEXT_PUBLIC_WEB3FORMS_KEY;
      if (clientWeb3Key) {
        const web3Res = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            access_key: clientWeb3Key,
            name,
            email,
            message,
            from_name: 'Magixa Tech Website',
            subject: `استفسار جديد من: ${name}`,
          }),
        });

        const web3Data = await web3Res.json().catch(() => ({}));
        if (web3Res.ok && web3Data.success) {
          setStatus('success');
          setName('');
          setEmail('');
          setMessage('');
          return;
        }
      }

      // If unconfigured or failed, surface message
      const msg = data.message || (lang === 'ar' 
        ? 'تعذر إرسال الرسالة حالياً. يرجى المحاولة لاحقاً أو التواصل عبر واتساب.' 
        : 'Failed to send message. Please try again or reach out via WhatsApp.');
      setErrorMessage(msg);
      setStatus('error');
    } catch (err) {
      console.error('Contact submission error:', err);
      // Secondary fallback attempt on network error
      try {
        const formspreeId = process.env.NEXT_PUBLIC_FORMSPREE_ID || 'myekwbdv';
        const fallbackRes = await fetch(`https://formspree.io/f/${formspreeId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            name,
            email,
            message,
            _subject: `استفسار جديد من موقع Magixa Tech: ${name}`,
          }),
        });
        const fallbackData = await fallbackRes.json().catch(() => ({}));
        if (fallbackRes.ok || fallbackData.ok) {
          setStatus('success');
          setName('');
          setEmail('');
          setMessage('');
          return;
        }
      } catch {
        // Fallback also failed
      }

      setErrorMessage(lang === 'ar' 
        ? 'حدث خطأ في الاتصال بالشبكة. يمكنك التواصل معنا مباشرة عبر واتساب.' 
        : 'Network error. You can contact us directly via WhatsApp.');
      setStatus('error');
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setErrorMessage('');
  };

  return (
    <section id="contact" className="py-28 px-5 md:px-16 bg-gradient-to-b from-[#070A14] via-[#0A1024] to-[#060812] relative overflow-hidden">
      {/* Ambient Lighting & Cyber Texture */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Central Radium Glow */}
        <div className="absolute top-[8%] left-1/2 -translate-x-1/2 w-[80vw] h-[45vh] bg-accent-radium/[0.07] blur-[150px] rounded-full will-change-transform" />
        {/* Secondary Cyan Glow */}
        <div className="absolute bottom-[5%] right-[-10%] w-[55vw] h-[45vh] bg-[#00F0FF]/[0.05] blur-[160px] rounded-full will-change-transform" />
        {/* Deep Cyber Violet Glow Accent */}
        <div className="absolute top-[35%] left-[-10%] w-[45vw] h-[40vh] bg-indigo-500/[0.04] blur-[140px] rounded-full will-change-transform" />
        {/* Digital Tech Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_75%_65%_at_50%_45%,#000_70%,transparent_100%)] opacity-60" />
      </div>

      <div className="max-w-4xl mx-auto border-t border-white/10 pt-24 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="mb-14 text-center"
        >
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-radium/10 border border-accent-radium/35 text-accent-radium text-xs sm:text-sm font-sans font-semibold mb-5 shadow-[0_0_18px_rgba(204,255,0,0.18)]">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-radium animate-pulse" />
            <span>{lang === 'ar' ? 'تواصل فوري ومباشر مع خبرائنا' : 'Get in Touch with our Engineers'}</span>
          </div>

          <h2 className="text-4xl md:text-6xl font-serif font-bold text-white mb-5 tracking-tight">
            {t.contact.title} <span className="text-accent-radium italic px-2 drop-shadow-[0_0_25px_rgba(204,255,0,0.35)]">{t.contact.titleHighlight}</span>
          </h2>
          <p className="text-slate-300 font-sans text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            {t.contact.desc}
          </p>
        </motion.div>

        {/* Luxury High-Tech Card Container with glowing aura */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-accent-radium/30 via-cyan-500/20 to-accent-radium/30 rounded-[32px] blur-xl opacity-40 group-hover:opacity-75 transition duration-700 pointer-events-none" />

          <div className="relative bg-[#0A0F22]/90 backdrop-blur-2xl p-6 sm:p-10 md:p-12 rounded-[28px] border border-white/15 shadow-[0_25px_70px_rgba(0,0,0,0.85),0_0_40px_rgba(204,255,0,0.06)] overflow-hidden">
            {/* Top glowing laser line on the card */}
            <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-accent-radium/70 to-transparent pointer-events-none" />

            <AnimatePresence mode="wait">
              {status === 'success' ? (
                <motion.div
                  key="success-card"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                  className="py-10 px-4 text-center flex flex-col items-center justify-center space-y-6"
                >
                  <div className="w-20 h-20 rounded-full bg-accent-radium/15 border border-accent-radium/50 flex items-center justify-center shadow-[0_0_35px_rgba(204,255,0,0.35)]">
                    <svg className="w-10 h-10 text-accent-radium" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>

                  <div className="space-y-2 max-w-lg">
                    <h3 className="text-2xl md:text-3xl font-serif font-bold text-white">
                      {lang === 'ar' ? 'تم إرسال رسالتك بنجاح' : 'Message Sent Successfully'}
                    </h3>
                    <p className="text-slate-300 font-sans text-base leading-relaxed">
                      {lang === 'ar' 
                        ? 'سيتواصل معك فريق Magixa قريباً لمناقشة تفاصيل مشروعك وتقديم العرض الفني المناسب.' 
                        : 'The Magixa team will reach out to you shortly to discuss your project specifications.'}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                    <Magnetic strength={0.2}>
                      <button
                        type="button"
                        onClick={handleReset}
                        className="px-8 py-3.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-sans text-sm font-bold transition-all cursor-none"
                      >
                        {lang === 'ar' ? 'إرسال استفسار آخر' : 'Send Another Message'}
                      </button>
                    </Magnetic>

                    <a 
                      href="/whatsapp"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25 hover:text-white transition-all font-sans text-sm font-semibold cursor-none shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                    >
                      <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                        <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.54 1.761.814 2.791.814 3.18 0 5.767-2.586 5.768-5.766 0-3.18-2.587-5.766-5.768-5.766zm9.969 5.828c0 5.514-4.486 10-10 10-1.748 0-3.385-.45-4.819-1.242l-5.181 1.356 1.378-5.034c-.886-1.488-1.378-3.216-1.378-5.08 0-5.514 4.486-10 10-10s10 4.486 10 10z"/>
                      </svg>
                      <span>{lang === 'ar' ? 'متابعة فورية عبر واتساب' : 'Continue on WhatsApp'}</span>
                    </a>
                  </div>
                </motion.div>
              ) : (
                <motion.form 
                  key="contact-form"
                  onSubmit={handleSubmit}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col gap-6"
                >
                  {status === 'error' && errorMessage && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm font-sans flex items-start gap-3">
                      <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      <div className="flex-1 space-y-1">
                        <p>{errorMessage}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col md:flex-row gap-5">
                    <input 
                      type="text" 
                      required
                      disabled={status === 'submitting'}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t.contact.name}
                      className="flex-1 bg-[#060914]/90 border border-white/12 hover:border-white/25 rounded-2xl px-5 py-4 text-white font-sans focus:outline-none focus:border-accent-radium focus:ring-2 focus:ring-accent-radium/20 focus:shadow-[0_0_20px_rgba(204,255,0,0.18)] transition-all cursor-none text-sm md:text-base placeholder:text-slate-500 disabled:opacity-50"
                    />
                    <input 
                      type="email" 
                      required
                      disabled={status === 'submitting'}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t.contact.email}
                      className="flex-1 bg-[#060914]/90 border border-white/12 hover:border-white/25 rounded-2xl px-5 py-4 text-white font-sans focus:outline-none focus:border-accent-radium focus:ring-2 focus:ring-accent-radium/20 focus:shadow-[0_0_20px_rgba(204,255,0,0.18)] transition-all cursor-none text-sm md:text-base placeholder:text-slate-500 disabled:opacity-50"
                    />
                  </div>
                  <textarea 
                    required
                    disabled={status === 'submitting'}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t.contact.message}
                    rows={4}
                    className="w-full bg-[#060914]/90 border border-white/12 hover:border-white/25 rounded-2xl px-5 py-4 text-white font-sans focus:outline-none focus:border-accent-radium focus:ring-2 focus:ring-accent-radium/20 focus:shadow-[0_0_20px_rgba(204,255,0,0.18)] transition-all cursor-none resize-none text-sm md:text-base placeholder:text-slate-500 disabled:opacity-50"
                  />
                  
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
                    <a 
                      href="/whatsapp"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25 hover:text-white hover:border-emerald-500/60 transition-all font-sans text-sm font-semibold cursor-none shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                    >
                      <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                        <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.54 1.761.814 2.791.814 3.18 0 5.767-2.586 5.768-5.766 0-3.18-2.587-5.766-5.768-5.766zm9.969 5.828c0 5.514-4.486 10-10 10-1.748 0-3.385-.45-4.819-1.242l-5.181 1.356 1.378-5.034c-.886-1.488-1.378-3.216-1.378-5.08 0-5.514 4.486-10 10-10s10 4.486 10 10z"/>
                      </svg>
                      <span>{lang === 'ar' ? 'محادثة فورية عبر واتساب' : 'Chat on WhatsApp'}</span>
                    </a>

                    <Magnetic strength={0.2}>
                      <button 
                        type="submit"
                        disabled={status === 'submitting'}
                        className="w-full sm:w-auto px-10 py-3.5 rounded-full bg-accent-radium text-bg-onyx font-sans font-bold text-base hover:bg-white hover:shadow-[0_0_35px_rgba(204,255,0,0.65)] transition-all shadow-[0_0_25px_rgba(204,255,0,0.35)] cursor-none disabled:opacity-60 flex items-center justify-center gap-2"
                      >
                        {status === 'submitting' && (
                          <svg className="animate-spin h-4 w-4 text-bg-onyx" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                          </svg>
                        )}
                        <span>
                          {status === 'submitting'
                            ? (lang === 'ar' ? 'جاري الإرسال...' : 'Sending...')
                            : t.contact.submit}
                        </span>
                      </button>
                    </Magnetic>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
