'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import { motion, useScroll, useTransform, useMotionValueEvent } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import Image from 'next/image';

export default function HorizontalPortfolio() {
  const { t, lang } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeCardIndex, setActiveCardIndex] = useState<number>(0);
  const [trackWidth, setTrackWidth] = useState<number>(0);

  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const categories = useMemo(() => [
    { id: 'all', label: t.common.allProjects, count: t.portfolio.projects.length },
    { 
      id: 'erp', 
      label: t.common.erpCategory, 
      count: t.portfolio.projects.filter(p => p.categorySlug === 'erp').length 
    },
    { 
      id: 'ecommerce', 
      label: t.common.ecommerceCategory, 
      count: t.portfolio.projects.filter(p => p.categorySlug === 'ecommerce').length 
    },
    { 
      id: 'edtech', 
      label: t.common.edtechCategory, 
      count: t.portfolio.projects.filter(p => p.categorySlug === 'edtech').length 
    },
    { 
      id: 'landing', 
      label: t.common.landingCategory, 
      count: t.portfolio.projects.filter(p => p.categorySlug === 'landing').length 
    },
  ], [t]);

  const filteredProjects = useMemo(() => {
    if (activeCategory === 'all') return t.portfolio.projects;
    return t.portfolio.projects.filter(p => p.categorySlug === activeCategory);
  }, [t.portfolio.projects, activeCategory]);

  // Dynamic Scroll Height based on number of items (smooth kinetic feeling)
  const scrollHeightVh = useMemo(() => {
    return Math.max(220, filteredProjects.length * 48);
  }, [filteredProjects.length]);

  // Framer Motion Scroll Progress for the pinned section
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"]
  });

  // Calculate accurate pixel distance so the last card finishes exactly on screen
  useEffect(() => {
    const calculateDistance = () => {
      if (trackRef.current) {
        const fullWidth = trackRef.current.scrollWidth;
        const visibleWidth = window.innerWidth;
        // Padding offset to keep the last card pleasantly centered
        const paddingOffset = visibleWidth < 768 ? 40 : 120;
        const maxScroll = Math.max(0, fullWidth - visibleWidth + paddingOffset);
        setTrackWidth(maxScroll);
      }
    };

    calculateDistance();
    const timer = setTimeout(calculateDistance, 150);
    window.addEventListener('resize', calculateDistance);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', calculateDistance);
    };
  }, [filteredProjects]);

  // Horizontal translation mapping: In RTL glide right (+X), in LTR glide left (-X)
  const x = useTransform(
    scrollYProgress, 
    [0, 1], 
    [0, lang === 'ar' ? trackWidth : -trackWidth]
  );

  // Track active card index in real-time
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const total = filteredProjects.length;
    if (total > 0) {
      const idx = Math.min(total - 1, Math.floor(latest * total));
      setActiveCardIndex(idx);
    }
  });

  // Smooth keyboard/button navigation: scroll document to target card ratio
  const scrollToIndex = (index: number) => {
    if (!sectionRef.current) return;
    const rect = sectionRef.current.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const sectionTop = rect.top + scrollTop;
    const sectionHeight = sectionRef.current.offsetHeight - window.innerHeight;
    const targetProgress = index / (filteredProjects.length - 1);
    const targetY = sectionTop + (sectionHeight * targetProgress);

    window.scrollTo({
      top: targetY,
      behavior: 'smooth'
    });
  };

  return (
    <section 
      id="portfolio" 
      ref={sectionRef} 
      style={{ height: `${scrollHeightVh}vh` }}
      className="relative bg-bg-onyx w-full"
    >
      {/* Pinned Viewport Container - Locked to screen height while scrolling */}
      <div className="sticky top-0 h-screen w-full flex flex-col justify-between overflow-hidden px-4 sm:px-8 md:px-14 py-6 md:py-8 z-20">
        
        {/* Ambient background lighting */}
        <div 
          aria-hidden="true" 
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-accent-radium/[0.035] blur-[140px] pointer-events-none rounded-full will-change-transform" 
        />

        {/* 1. Header & Category Tabs (Pinned at top) */}
        <div className="w-full max-w-7xl mx-auto flex flex-col gap-4 z-30 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border-glass pb-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-radium/10 border border-accent-radium/30 text-accent-radium text-xs font-mono mb-2">
                <span className="w-2 h-2 rounded-full bg-accent-radium animate-pulse" />
                <span>{filteredProjects.length} {lang === 'ar' ? 'مشروعاً حياً معتمداً' : 'Verified Live Systems'}</span>
              </div>
              
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-white tracking-tight">
                {t.portfolio.title} <span className="text-accent-radium italic px-2">{t.portfolio.titleHighlight}</span>
              </h2>
            </div>

            {/* Live Counter & Step Controls */}
            <div className="flex items-center gap-3 self-end sm:self-auto">
              <span className="text-xs font-mono text-slate-400 bg-white/5 px-3 py-1.5 rounded-full border border-white/10" dir="ltr">
                <span className="text-accent-radium font-bold">{String(activeCardIndex + 1).padStart(2, '0')}</span>
                <span className="mx-1 text-slate-600">/</span>
                <span>{String(filteredProjects.length).padStart(2, '0')}</span>
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => scrollToIndex(Math.max(0, activeCardIndex - 1))}
                  disabled={activeCardIndex === 0}
                  aria-label="Previous Project"
                  className={`w-9 h-9 rounded-full border border-white/10 flex items-center justify-center transition-all cursor-none ${
                    activeCardIndex === 0 ? 'opacity-30 border-white/5' : 'bg-white/5 hover:bg-accent-radium hover:text-bg-onyx text-white hover:border-accent-radium'
                  }`}
                >
                  <svg className={`w-4 h-4 ${lang === 'ar' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => scrollToIndex(Math.min(filteredProjects.length - 1, activeCardIndex + 1))}
                  disabled={activeCardIndex >= filteredProjects.length - 1}
                  aria-label="Next Project"
                  className={`w-9 h-9 rounded-full border border-white/10 flex items-center justify-center transition-all cursor-none ${
                    activeCardIndex >= filteredProjects.length - 1 ? 'opacity-30 border-white/5' : 'bg-white/5 hover:bg-accent-radium hover:text-bg-onyx text-white hover:border-accent-radium'
                  }`}
                >
                  <svg className={`w-4 h-4 ${lang === 'ar' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setActiveCardIndex(0);
                    if (sectionRef.current) {
                      const rect = sectionRef.current.getBoundingClientRect();
                      const scrollTop = window.scrollY || document.documentElement.scrollTop;
                      window.scrollTo({ top: rect.top + scrollTop, behavior: 'smooth' });
                    }
                  }}
                  className={`px-3.5 sm:px-4 py-1.5 rounded-full font-sans text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-none flex items-center gap-2 ${
                    isActive
                      ? 'bg-accent-radium text-bg-onyx font-bold shadow-[0_0_15px_rgba(204,255,0,0.35)]'
                      : 'bg-card-dark border border-border-glass text-slate-300 hover:text-white hover:border-white/20'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isActive ? 'bg-bg-onyx/20 text-bg-onyx' : 'bg-white/5 text-slate-400'}`}>
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Kinetic Motion Track (Cards slide horizontally & stack dynamically) */}
        <div className="relative w-full my-auto py-2 z-20 overflow-visible">
          <motion.div
            ref={trackRef}
            style={{ x }}
            className="flex gap-6 sm:gap-8 items-center w-max will-change-transform"
          >
            {filteredProjects.map((project, index) => {
              const isActive = index === activeCardIndex;
              return (
                <div
                  key={project.id}
                  className="w-[84vw] sm:w-[480px] md:w-[560px] h-[52vh] sm:h-[55vh] shrink-0 transition-transform duration-500 ease-out"
                  style={{
                    zIndex: index + 1,
                  }}
                >
                  <ProjectMotionCard 
                    project={project} 
                    lang={lang} 
                    index={index} 
                    isActive={isActive}
                  />
                </div>
              );
            })}
          </motion.div>
        </div>

        {/* 3. Bottom Progress Bar & Interactive Footer (Pinned at bottom) */}
        <div className="w-full max-w-7xl mx-auto flex flex-col gap-3 z-30 shrink-0 pt-2 border-t border-border-glass/60">
          
          {/* Animated Neon Progress Bar */}
          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden relative">
            <motion.div 
              style={{ 
                scaleX: scrollYProgress,
                transformOrigin: lang === 'ar' ? 'right' : 'left'
              }}
              className="h-full w-full bg-accent-radium shadow-[0_0_10px_#ccff00] will-change-transform"
            />
          </div>

          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-radium animate-ping" />
              <span>{lang === 'ar' ? 'حرّك بكرة الماوس للتنقل السلس بين الأنظمة' : 'Scroll wheel to glide through systems'}</span>
            </span>

            <a
              href="https://wa.me/201558652579?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%20Magixa%20Tech%D8%8C%20%D8%A3%D9%88%D8%AF%20%D8%AA%D9%86%D9%81%D9%8A%D8%B0%20%D9%85%D8%B4%D8%B1%D9%88%D8%B9%20%D8%A8%D8%B1%D9%85%D8%AC%D9%8A%20%D9%85%D9%85%D8%A7%D8%AB%D9%84"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-radium hover:underline flex items-center gap-1.5 font-bold cursor-none"
            >
              <span>{lang === 'ar' ? 'اطلب نظاماً مشابهاً لنشاطك' : 'Request similar architecture'}</span>
              <span className={lang === 'ar' ? 'rotate-180' : ''}>→</span>
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}

interface ProjectMotionCardProps {
  project: any;
  lang: string;
  index: number;
  isActive: boolean;
}

function ProjectMotionCard({ project, lang, index, isActive }: ProjectMotionCardProps) {
  return (
    <div 
      className={`group relative flex flex-col justify-between h-full bg-card-dark rounded-2xl border transition-all duration-500 shadow-2xl overflow-hidden will-change-transform ${
        isActive 
          ? 'border-accent-radium/60 shadow-[0_15px_45px_rgba(204,255,0,0.12)] scale-[1.01]' 
          : 'border-border-glass hover:border-white/30'
      }`}
    >
      {/* 1. Image Header (High Clarity, Vibrant, Zoom on Hover) */}
      <div className="relative w-full h-[52%] overflow-hidden bg-black/80 border-b border-border-glass">
        <Image
          src={project.img}
          alt={project.title}
          fill
          sizes="(max-width: 768px) 90vw, 600px"
          className="object-cover object-top opacity-95 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-out will-change-transform"
          priority={index < 3}
          loading={index < 3 ? 'eager' : 'lazy'}
        />

        {/* Delicate gradient shadow */}
        <div className="absolute inset-0 bg-gradient-to-t from-card-dark via-transparent to-black/40 pointer-events-none" />

        {/* Category Pill */}
        <div className={`absolute top-3.5 ${lang === 'ar' ? 'right-3.5' : 'left-3.5'} z-10`}>
          <span className="px-3 py-1 rounded-full text-[11px] font-sans font-bold bg-bg-onyx/90 backdrop-blur-md text-accent-radium border border-accent-radium/35 shadow-md">
            {project.category}
          </span>
        </div>

        {/* Live Demo Direct Link Button */}
        <a
          href={project.link}
          target="_blank"
          rel="noopener noreferrer"
          className={`absolute bottom-3.5 ${lang === 'ar' ? 'left-3.5' : 'right-3.5'} z-10 px-3.5 py-1.5 rounded-full bg-accent-radium text-bg-onyx font-sans font-bold text-xs flex items-center gap-1.5 shadow-[0_0_20px_rgba(204,255,0,0.45)] hover:bg-white hover:scale-105 active:scale-95 transition-all cursor-none`}
        >
          <span>{lang === 'ar' ? 'معاينة حية للمشروع' : 'Live Demo'}</span>
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>

      {/* 2. Text & Content Details */}
      <div className="p-5 sm:p-6 flex flex-col justify-between flex-1 gap-3.5">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-white group-hover:text-accent-radium transition-colors">
              {project.title}
            </h3>
            <span className="text-xs font-mono font-bold text-slate-500 shrink-0">
              #{String(index + 1).padStart(2, '0')}
            </span>
          </div>

          <p className="text-xs sm:text-sm font-sans font-semibold text-slate-300 mb-2 line-clamp-1">
            {project.tagline}
          </p>

          <p className="text-xs sm:text-sm font-sans text-text-muted leading-relaxed line-clamp-2">
            {project.desc}
          </p>
        </div>

        {/* 3. Real-Time Impact Metrics */}
        {project.metrics && project.metrics.length > 0 && (
          <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-xl bg-white/[0.025] border border-white/[0.07] text-center">
            {project.metrics.map((m: any, mi: number) => (
              <div key={mi} className="flex flex-col">
                <span className="text-[10px] font-mono text-slate-400">{m.label}</span>
                <span className="text-xs font-mono font-bold text-white truncate">{m.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* 4. Tech Tags Footer */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-border-glass">
          {project.technologies.slice(0, 4).map((tech: string, ti: number) => (
            <span 
              key={ti} 
              className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-slate-300 border border-white/[0.08]"
            >
              {tech}
            </span>
          ))}
          {project.technologies.length > 4 && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.02] text-slate-500">
              +{project.technologies.length - 4}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
