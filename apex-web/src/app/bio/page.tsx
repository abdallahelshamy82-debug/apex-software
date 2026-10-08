'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface BioLinkItem {
  id: string;
  title: string;
  subtitle?: string;
  url: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  highlight?: boolean;
  featured?: boolean;
  actionText?: string;
}

export default function BioLinksPage() {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (typeof window === 'undefined') return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Magixa Tech | روابط التواصل والشبكات الرسمية',
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const primaryLinks: BioLinkItem[] = [
    {
      id: 'order',
      title: 'اطلب خدمة أو استشارة برمجية فورية',
      subtitle: 'تطوير مواقع ومتاجر إلكترونية، تطبيقات موبايل، وأنظمة ERP سحابية متكاملة',
      url: 'https://wa.me/201285512241?text=مرحباً%20Magixa%20Tech،%20أود%20طلب%20مشروع%20أو%20استشارة%20برمجية',
      icon: (
        <svg className="w-6 h-6 text-accent-radium" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>
      ),
      badge: 'تواصل فوري ⚡',
      badgeColor: 'bg-accent-radium/20 text-accent-radium border-accent-radium/40 font-bold',
      highlight: true,
      featured: true,
      actionText: 'بدء المحادثة',
    },
    {
      id: 'website',
      title: 'الموقع الرسمي للشركة (Magixa Tech)',
      subtitle: 'استكشف معرض الأعمال، التقنيات المستخدمة، والباقات البرمجية المتاحة',
      url: '/',
      icon: (
        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>
        </svg>
      ),
      badge: 'الرئيسية 🌐',
      badgeColor: 'bg-white/10 text-white border-white/20',
      featured: true,
      actionText: 'تصفح الموقع',
    },
  ];

  const socialLinks: BioLinkItem[] = [
    {
      id: 'linkedin',
      title: 'لينكد إن (LinkedIn)',
      subtitle: 'Apex Dev Team • الحساب المهني الرسمي للمؤسسة',
      url: 'https://www.linkedin.com/company/apex-dev-team/?viewAsMember=true',
      icon: (
        <svg className="w-5 h-5 text-[#0a66c2] fill-current" viewBox="0 0 24 24">
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
        </svg>
      ),
      badge: 'مهني 💼',
      badgeColor: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
      actionText: 'متابعة',
    },
    {
      id: 'whatsapp',
      title: 'واتساب مباشر (WhatsApp)',
      subtitle: '+201285512241 • استفسار وسرعة رد',
      url: 'https://wa.me/201285512241',
      icon: (
        <svg className="w-5 h-5 text-emerald-400 fill-current" viewBox="0 0 24 24">
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.54 1.761.814 2.791.814 3.18 0 5.767-2.586 5.768-5.766 0-3.18-2.587-5.766-5.768-5.766zm9.969 5.828c0 5.514-4.486 10-10 10-1.748 0-3.385-.45-4.819-1.242l-5.181 1.356 1.378-5.034c-.886-1.488-1.378-3.216-1.378-5.08 0-5.514 4.486-10 10-10s10 4.486 10 10z"/>
        </svg>
      ),
      badge: 'متاح الآن 🟢',
      badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      actionText: 'محادثة',
    },
    {
      id: 'facebook',
      title: 'فيسبوك (Facebook)',
      subtitle: '@magixasoftware • الصفحة الرسمية والتحديثات',
      url: 'https://www.facebook.com/magixasoftware/',
      icon: (
        <svg className="w-5 h-5 text-blue-500 fill-current" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      actionText: 'متابعة',
    },
    {
      id: 'instagram',
      title: 'إنستغرام (Instagram)',
      subtitle: '@magixa_tech • تصاميم واجهات وكواليس المشاريع',
      url: 'https://www.instagram.com/magixa_tech?stkn=dzJ4OXNnczZ0Yno2',
      icon: (
        <svg className="w-5 h-5 text-pink-500 fill-current" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      ),
      actionText: 'زيارة',
    },
    {
      id: 'youtube',
      title: 'يوتيوب (YouTube)',
      subtitle: '@magixa_tech • شروحات تقنية واستعراض أحدث الأنظمة',
      url: 'https://youtube.com/@magixa_tech?si=DujkRUUzNmLoU8s1',
      icon: (
        <svg className="w-5 h-5 text-red-500 fill-current" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      ),
      actionText: 'اشتراك',
    },
    {
      id: 'tiktok',
      title: 'تيك توك (TikTok)',
      subtitle: '@apexcode_team03 • محتوى تقني وحلول سريعة',
      url: 'https://www.tiktok.com/@apexcode_team03',
      icon: (
        <svg className="w-5 h-5 text-cyan-400 fill-current" viewBox="0 0 24 24">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 2.89 3.5 2.77 1.2-.02 2.33-.67 2.91-1.72.36-.61.54-1.32.55-2.03.04-3.86.01-7.72.03-11.58-.02-1.98-.02-3.95-.02-5.93z"/>
        </svg>
      ),
      actionText: 'متابعة',
    },
    {
      id: 'threads',
      title: 'ثريدز (Threads)',
      subtitle: '@ape_xsoftware • نقاشات برمجية وهندسية',
      url: 'https://www.threads.net/@ape_xsoftware',
      icon: (
        <svg className="w-5 h-5 text-purple-400 fill-current" viewBox="0 0 24 24">
          <path d="M12.007 0C5.385 0 0 5.385 0 12.007c0 6.621 5.385 12.007 12.007 12.007 6.621 0 12.007-5.386 12.007-12.007C24.014 5.385 18.628 0 12.007 0zm4.568 12.984c-.067.433-.173.856-.316 1.267-.53 1.528-1.554 2.593-2.964 3.08-1.41.486-2.92.366-4.22-.34-1.3-.705-2.176-1.89-2.47-3.337-.294-1.448.006-2.97.846-4.288.84-1.317 2.164-2.177 3.73-2.42 1.564-.245 3.125.137 4.398 1.075 1.272.937 2.038 2.36 2.155 4.007.037.525.043 1.05.018 1.575h-8.89c.078 1.135.615 2.138 1.47 2.748.855.61 1.94.757 2.972.404 1.032-.353 1.824-1.18 2.173-2.27.06-.188.165-.353.3-.478.134-.124.3-.2.476-.217.177-.016.353.03.5.132.148.102.257.25.31.42z"/>
        </svg>
      ),
      actionText: 'متابعة',
    },
    {
      id: 'github',
      title: 'جيت هب (GitHub)',
      subtitle: 'مشاريع ومستودعات مفتوحة المصدر',
      url: 'https://github.com/abdullahprocom',
      icon: (
        <svg className="w-5 h-5 text-slate-300 fill-current" viewBox="0 0 24 24">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
        </svg>
      ),
      actionText: 'معاينة',
    },
  ];

  return (
    <div className="min-h-screen bg-bg-onyx text-white flex flex-col items-center justify-between p-4 sm:p-6 md:p-10 font-sans relative overflow-x-hidden selection:bg-accent-radium/30 selection:text-accent-radium" dir="rtl">
      {/* Signature Magixa Hero Ambient Glow & Texture */}
      <div aria-hidden="true" className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Top central radium glow, identical to Hero.tsx */}
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[75vw] h-[40vh] bg-accent-radium/[0.08] blur-[130px] rounded-full pointer-events-none will-change-transform" />
        {/* Bottom subtle secondary glow */}
        <div className="absolute bottom-[-15%] right-[-10%] w-[50vw] h-[45vh] bg-accent-radium/[0.04] blur-[140px] rounded-full pointer-events-none will-change-transform" />
        {/* Subtle digital grid lines texture */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_30%,#000_70%,transparent_100%)] pointer-events-none opacity-50" />
      </div>

      {/* Main Responsive Container */}
      <div className="w-full max-w-xl md:max-w-3xl lg:max-w-4xl mx-auto relative z-10 flex flex-col items-center py-4 sm:py-8 space-y-6 md:space-y-8">
        
        {/* Top Floating Action Bar */}
        <div className="w-full flex items-center justify-between px-1 sm:px-2">
          <Link
            href="/"
            className="text-xs sm:text-sm text-text-muted hover:text-white transition-all flex items-center gap-2 bg-card-dark/80 hover:bg-card-hover border border-border-glass px-4 py-2 rounded-full backdrop-blur-xl shadow-sm"
          >
            <span>← العودة للموقع الرئيسي</span>
          </Link>

          <button
            onClick={handleShare}
            className="flex items-center gap-2 text-xs sm:text-sm text-text-muted hover:text-accent-radium bg-card-dark/80 hover:bg-card-hover border border-border-glass px-4 py-2 rounded-full transition-all backdrop-blur-xl shadow-sm"
          >
            {copied ? (
              <span className="text-accent-radium font-bold flex items-center gap-1.5">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                تم نسخ الرابط!
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-accent-radium" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                مشاركة الرابط
              </span>
            )}
          </button>
        </div>

        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center text-center space-y-4"
        >
          {/* Logo Frame: Contained and styled with Radium Neon Border */}
          <div className="relative group">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-accent-radium/50 via-white/20 to-accent-radium/40 rounded-[28px] blur-lg opacity-60 group-hover:opacity-100 transition duration-500"></div>
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-[24px] bg-card-dark border-2 border-border-glass group-hover:border-accent-radium/60 p-1.5 flex items-center justify-center shadow-2xl overflow-hidden transition-colors">
              <img
                src="/magixa-logo.jpg"
                alt="Magixa Logo"
                className="w-full h-full object-cover rounded-[18px] transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.parentElement?.querySelector('.logo-fallback') as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <div className="logo-fallback hidden w-full h-full rounded-[18px] bg-card-dark items-center justify-center">
                <span className="font-heading font-black text-3xl text-accent-radium">M</span>
              </div>
            </div>
          </div>

          {/* Titles & Magixa Brand Heading */}
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-black text-white tracking-wide flex items-center justify-center gap-2">
              <span>Magixa</span>
              <span className="text-accent-radium">
                Tech.
              </span>
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-text-muted font-medium max-w-lg">
              تطوير البرمجيات الحديثة • مواقع وتطبيقات وأنظمة سحابية متطورة
            </p>
          </div>

          {/* Status Pill */}
          <div className="inline-flex items-center gap-2 bg-accent-radium/10 border border-accent-radium/30 text-accent-radium text-xs sm:text-sm font-semibold px-4 py-1.5 rounded-full shadow-[0_0_20px_rgba(204,255,0,0.15)]">
            <span className="w-2.5 h-2.5 rounded-full bg-accent-radium animate-pulse"></span>
            <span>متاح لاستقبال المشاريع الجديدة والاستشارات</span>
          </div>
        </motion.div>

        {/* Section 1: Hero Featured Links (Full width on all screens) */}
        <div className="w-full space-y-3.5 pt-2">
          {primaryLinks.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <a
                href={item.url}
                target={item.url.startsWith('http') ? '_blank' : undefined}
                rel={item.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                className={`w-full group relative flex items-center justify-between p-4 sm:p-5 md:p-6 rounded-2xl border transition-all duration-300 text-right ${
                  item.highlight
                    ? 'bg-gradient-to-r from-accent-radium/[0.08] via-card-dark to-card-dark border-accent-radium/40 hover:border-accent-radium hover:shadow-[0_0_35px_rgba(204,255,0,0.2)]'
                    : 'bg-card-dark hover:bg-card-hover border-border-glass hover:border-white/30 hover:shadow-[0_0_25px_rgba(255,255,255,0.08)]'
                }`}
              >
                <div className="flex items-center gap-4 sm:gap-5 flex-1 min-w-0">
                  <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-white/[0.04] border border-border-glass flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:border-accent-radium/50 transition-all shadow-inner">
                    {item.icon}
                  </div>

                  <div className="truncate flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base sm:text-lg md:text-xl font-heading font-bold text-white group-hover:text-accent-radium transition-colors">
                        {item.title}
                      </span>
                      {item.badge && (
                        <span className={`text-[11px] sm:text-xs font-bold px-2 py-0.5 rounded-md border ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                    {item.subtitle && (
                      <p className="text-xs sm:text-sm text-text-muted truncate mt-1">
                        {item.subtitle}
                      </p>
                    )}
                  </div>
                </div>

                {/* Desktop Action CTA Pill */}
                <div className="hidden sm:flex items-center gap-2 pr-4 shrink-0">
                  <span className={`text-xs font-bold transition-all px-4 py-2 rounded-xl border ${
                    item.highlight 
                      ? 'bg-accent-radium text-bg-onyx border-accent-radium font-heading group-hover:bg-white' 
                      : 'bg-white/5 border-border-glass text-text-muted group-hover:text-white group-hover:border-white/30'
                  }`}>
                    {item.actionText} ←
                  </span>
                </div>
              </a>
            </motion.div>
          ))}
        </div>

        {/* Section 2: Social Channels & Platforms Grid (2 columns on Desktop, 1 on Mobile) */}
        <div className="w-full pt-2">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs sm:text-sm font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent-radium"></span>
              قنواتنا وشبكاتنا الرسمية
            </span>
            <span className="text-[11px] text-text-muted/60 hidden sm:inline">انقر للتواصل أو المتابعة المباشرة</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3.5">
            {socialLinks.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.1 + index * 0.03 }}
              >
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-full group relative flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-card-dark hover:bg-card-hover border border-border-glass hover:border-accent-radium/40 hover:shadow-[0_0_20px_rgba(204,255,0,0.12)] transition-all duration-300 text-right"
                >
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white/[0.03] border border-border-glass flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:border-accent-radium/40 transition-transform">
                      {item.icon}
                    </div>

                    <div className="truncate flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm sm:text-base font-bold text-white group-hover:text-accent-radium transition-colors">
                          {item.title}
                        </span>
                        {item.badge && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${item.badgeColor || 'bg-white/10 text-slate-300 border-white/20'}`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                      {item.subtitle && (
                        <p className="text-[11px] sm:text-xs text-text-muted truncate mt-0.5">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-text-muted group-hover:text-accent-radium transition-colors pr-2 shrink-0">
                    <span className="text-[11px] font-medium hidden lg:inline">{item.actionText}</span>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                  </div>
                </a>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Section 3: Official Business Email & Corporate Contacts */}
        <div className="w-full bg-card-dark border border-border-glass hover:border-accent-radium/30 rounded-2xl p-4 sm:p-5 text-center space-y-2 text-xs sm:text-sm text-text-muted shadow-lg transition-colors">
          <div className="flex items-center justify-center gap-2 font-bold text-white text-sm sm:text-base">
            <svg className="w-4 h-4 text-accent-radium" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
            <span>للتواصل التجاري والتعاقدات الرسمية:</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 pt-1 font-mono text-xs sm:text-sm">
            <span className="text-accent-radium bg-accent-radium/10 border border-accent-radium/30 px-3.5 py-1.5 rounded-lg select-all">
              contact@apexsoftware.com
            </span>
            <span className="text-white bg-white/5 border border-border-glass px-3.5 py-1.5 rounded-lg">
              هاتف / واتساب: +201285512241
            </span>
          </div>
        </div>

        {/* Footer */}
        <footer className="pt-2 text-center text-xs text-text-muted/60 space-y-1">
          <p>© {new Date().getFullYear()} Magixa Tech. جميع الحقوق محفوظة.</p>
          <p className="text-[11px] text-text-muted/40">Built with precision & high performance</p>
        </footer>
      </div>
    </div>
  );
}
