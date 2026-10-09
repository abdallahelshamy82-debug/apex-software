'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';

export default function Services() {
  const { t, lang } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const trackBgRef = useRef<HTMLDivElement>(null);
  const fillLineRef = useRef<HTMLDivElement>(null);
  const dotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const contentRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const updateTimeline = () => {
      const container = containerRef.current;
      if (!container) return;

      const dots = dotRefs.current;
      const contents = contentRefs.current;
      const count = dots.length;
      const dot0 = dots[0];
      const dotLast = dots[count - 1];
      if (!dot0 || !dotLast) return;

      const containerRect = container.getBoundingClientRect();
      const dot0Rect = dot0.getBoundingClientRect();
      const dotLastRect = dotLast.getBoundingClientRect();

      // Exact pixel centers of the first and last dots relative to the container
      const dot0RelativeY = (dot0Rect.top + dot0Rect.height / 2) - containerRect.top;
      const dotLastRelativeY = (dotLastRect.top + dotLastRect.height / 2) - containerRect.top;
      const totalTrackHeight = Math.max(0, dotLastRelativeY - dot0RelativeY);

      // 1. Anchor the subtle background track exactly between Dot 0 and the final Dot
      if (trackBgRef.current) {
        trackBgRef.current.style.top = `${dot0RelativeY}px`;
        trackBgRef.current.style.height = `${totalTrackHeight}px`;
      }

      // 2. Target focal line: exactly the vertical center of the viewport (50% viewport height)
      const focusY = window.innerHeight * 0.5;
      const currentFocusRelativeY = focusY - containerRect.top;

      let fillHeight = 0;
      if (currentFocusRelativeY > dot0RelativeY) {
        fillHeight = Math.min(totalTrackHeight, currentFocusRelativeY - dot0RelativeY);
      }

      // 3. Anchor and size the glowing laser fill bar
      if (fillLineRef.current) {
        fillLineRef.current.style.top = `${dot0RelativeY}px`;
        fillLineRef.current.style.height = `${fillHeight}px`;
      }

      // 4. Perfect 1-to-1 synchronization for all dots and service descriptions:
      // A dot lights up IF AND ONLY IF the laser line tip reaches its center.
      for (let i = 0; i < count; i++) {
        const dotEl = dots[i];
        const contentEl = contents[i];
        if (!dotEl) continue;

        const dotRect = dotEl.getBoundingClientRect();
        const dotCenterY = dotRect.top + dotRect.height / 2;
        
        // Exact impact detection: dot is reached the moment its center hits the focal line
        const isReached = dotCenterY <= focusY + 2;

        dotEl.setAttribute('data-active', isReached ? 'true' : 'false');
        if (contentEl) {
          contentEl.setAttribute('data-active', isReached ? 'true' : 'false');
        }
      }
    };

    // Initial positioning
    updateTimeline();

    // High performance scroll listener with requestAnimationFrame
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateTimeline();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    window.addEventListener('orientationchange', onScroll, { passive: true });

    // Handle dynamic fonts and layout shifts gracefully
    const container = containerRef.current;
    let resizeObserver: ResizeObserver | null = null;
    if (container && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        updateTimeline();
      });
      resizeObserver.observe(container);
    }

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('orientationchange', onScroll);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [lang]);

  return (
    <section className="py-24 px-5 md:px-10 bg-bg-onyx text-white">
      <div className="max-w-7xl mx-auto border-t border-border-glass pt-24">
        
        {/* Section Header */}
        <div className="flex flex-col items-center text-center mb-20 gap-6">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-4xl sm:text-5xl md:text-7xl font-serif font-bold leading-tight"
          >
            {t.services.title} <span className="text-accent-radium italic px-2">{t.services.titleHighlight}</span>
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="max-w-2xl text-text-muted font-sans leading-relaxed text-lg"
          >
            {t.services.desc}
          </motion.p>
        </div>

        {/* Alternating Timeline Section */}
        <div ref={containerRef} className="relative mt-20 md:mt-32 w-full">
          
          {/* Subtle Vertical Track Background: perfectly anchored between first and last dot */}
          <div 
            ref={trackBgRef}
            className={`absolute w-[2px] bg-white/10 ${
              lang === 'ar' 
                ? 'right-[13px] md:right-auto md:left-1/2 md:-translate-x-1/2' 
                : 'left-[13px] md:left-1/2 md:-translate-x-1/2'
            }`} 
          />
          
          {/* Glowing Fill Laser Bar: moves in lockstep with viewport focus */}
          <div 
            ref={fillLineRef}
            className={`absolute w-[4px] bg-accent-radium shadow-[0_0_22px_#ccff00,0_0_8px_#ccff00] z-10 transition-none ${
              lang === 'ar' 
                ? 'right-[12px] md:right-auto md:left-1/2 md:-translate-x-1/2' 
                : 'left-[12px] md:left-1/2 md:-translate-x-1/2'
            }`}
          />

          {/* Service Items */}
          <div className="flex flex-col w-full">
            {t.services.list.map((srv: any, i: number) => {
              const isEven = i % 2 === 0;

              return (
                <div 
                  key={srv.id}
                  className={`relative flex w-full items-center py-20 md:py-32 justify-start ${
                    isEven ? 'md:justify-start' : 'md:justify-end'
                  } ${lang === 'ar' ? 'pr-16 md:pr-24' : 'pl-16 md:pl-24'}`}
                >
                  {/* Milestones Node Dot */}
                  <div 
                    ref={(el) => { dotRefs.current[i] = el; }}
                    data-active="false"
                    className={`group absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full z-20 
                      transition-all duration-300 ease-out 
                      border-2 border-white/25 bg-bg-onyx 
                      data-[active=true]:border-accent-radium 
                      data-[active=true]:bg-accent-radium 
                      data-[active=true]:shadow-[0_0_20px_#ccff00,0_0_8px_#ccff00] 
                      data-[active=true]:scale-125 
                      ${
                        lang === 'ar' 
                          ? 'right-[6px] md:right-auto md:left-1/2 md:-translate-x-1/2' 
                          : 'left-[6px] md:left-1/2 md:-translate-x-1/2'
                      }`}
                  >
                    {/* Subtle Pulsing Halo when active */}
                    <span className="absolute -inset-1 rounded-full bg-accent-radium/35 blur-sm opacity-0 group-data-[active=true]:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  </div>

                  {/* Content Box */}
                  <div 
                    className={`w-full md:w-1/2 ${
                      lang === 'ar'
                        ? `pr-4 md:pr-8 ${isEven ? 'md:pl-16 lg:pl-24' : 'md:pr-16 lg:pr-24'}`
                        : `pl-16 md:pl-0 ${isEven ? 'md:pr-16 lg:pr-24' : 'md:pl-16 lg:pl-24'}`
                    }`}
                  >
                    <div
                      ref={(el) => { contentRefs.current[i] = el; }}
                      data-active="false"
                      className={`transition-all duration-500 ease-out 
                        opacity-25 blur-[1px] translate-y-2 
                        data-[active=true]:opacity-100 data-[active=true]:blur-none data-[active=true]:translate-y-0 
                        flex flex-col ${
                          lang === 'ar' 
                            ? (isEven ? 'md:items-start md:text-right' : 'md:items-start md:text-right') 
                            : (isEven ? 'md:items-end md:text-right' : 'md:items-start md:text-left')
                        }`}
                    >
                      <span className="text-accent-radium font-sans font-black text-3xl md:text-4xl mb-4 drop-shadow-[0_0_15px_rgba(204,255,0,0.4)] block select-none">
                        {srv.id}
                      </span>
                      <h3 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white mb-6">
                        {srv.title}
                      </h3>
                      <p className="text-text-muted font-sans text-lg md:text-xl leading-relaxed">
                        {srv.desc}
                      </p>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
