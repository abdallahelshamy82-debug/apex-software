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

        const formspreeData = await formspreeRes.json().catch(() => ({}));
        if (formspreeRes.ok || formspreeData.ok) {
          setStatus('success');
          setName('');
          setEmail('');
          setMessage('');
          return;
        }
      }

      // 3. Direct browser fallback via Web3Forms if configured
      const clientWeb3Key = process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY;
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
    <section id="contact" className="py-24 px-5 md:px-16 bg-bg-onyx relative overflow-hidden">
      <div className="max-w-4xl mx-auto border-t border-border-glass pt-24 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="mb-14 text-center"
        >
          <h2 className="text-4xl md:text-6xl font-serif font-bold text-white mb-5">
            {t.contact.title} <span className="text-accent-radium italic px-2">{t.contact.titleHighlight}</span>
          </h2>
          <p className="text-text-muted font-sans text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            {t.contact.desc}
          </p>
        </motion.div>

        <div className="bg-card-dark p-6 sm:p-10 md:p-12 rounded-3xl border border-border-glass shadow-2xl backdrop-blur-xl">
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
                <div className="w-20 h-20 rounded-full bg-accent-radium/15 border border-accent-radium/40 flex items-center justify-center shadow-[0_0_30px_rgba(204,255,0,0.25)]">
                  <svg className="w-10 h-10 text-accent-radium" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>

                <div className="space-y-2 max-w-lg">
                  <h3 className="text-2xl md:text-3xl font-serif font-bold text-white">
                    {lang === 'ar' ? 'تم إرسال رسالتك بنجاح' : 'Message Sent Successfully'}
                  </h3>
                  <p className="text-text-muted font-sans text-base leading-relaxed">
                    {lang === 'ar' 
                      ? 'سيتواصل معك فريق Magixa قريباً عبر البريد الإلكتروني لمناقشة تفاصيل مشروعك.' 
                      : 'The Magixa team will reach out to you shortly via email to discuss your project details.'}
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
                    href="https://wa.me/201558652579?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%20Magixa%20Tech%D8%8C%20%D8%A3%D9%88%D8%AF%20%D8%A7%D9%84%D8%AA%D9%88%D8%A7%D8%B5%D9%84%20%D9%85%D8%B9%D9%83%D9%85"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25 hover:text-white transition-all font-sans text-sm font-semibold cursor-none"
                  >
                    <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.54 1.761.814 2.791.814 3.18 0 5.767-2.586 5.768-5.766 0-3.18-2.587-5.766-5.768-5.766zm9.969 5.828c0 5.514-4.486 10-10 10-1.748 0-3.385-.45-4.819-1.242l-5.181 1.356 1.378-5.034c-.886-1.488-1.378-3.216-1.378-5.08 0-5.514 4.486-10 10-10s10 4.486 10 10z"/>
                    </svg>
                    <span>{lang === 'ar' ? 'متابعة عبر واتساب' : 'Continue on WhatsApp'}</span>
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
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white font-sans focus:outline-none focus:border-accent-radium transition-colors cursor-none text-sm md:text-base placeholder:text-slate-500 disabled:opacity-50"
                  />
                  <input 
                    type="email" 
                    required
                    disabled={status === 'submitting'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.contact.email}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white font-sans focus:outline-none focus:border-accent-radium transition-colors cursor-none text-sm md:text-base placeholder:text-slate-500 disabled:opacity-50"
                  />
                </div>
                <textarea 
                  required
                  disabled={status === 'submitting'}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t.contact.message}
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white font-sans focus:outline-none focus:border-accent-radium transition-colors cursor-none resize-none text-sm md:text-base placeholder:text-slate-500 disabled:opacity-50"
                />
                
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
                  <a 
                    href="https://wa.me/201558652579?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%20Magixa%20Tech%D8%8C%20%D8%A3%D9%88%D8%AF%20%D8%A7%D9%84%D8%AA%D9%88%D8%A7%D8%B5%D9%84%20%D9%85%D8%B9%D9%83%D9%85"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:text-white transition-all font-sans text-sm font-semibold cursor-none"
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
                      className="w-full sm:w-auto px-9 py-3.5 rounded-full bg-accent-radium text-bg-onyx font-sans font-bold text-base hover:bg-white transition-all shadow-[0_0_20px_rgba(204,255,0,0.3)] cursor-none disabled:opacity-60 flex items-center justify-center gap-2"
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
    </section>
  );
}
