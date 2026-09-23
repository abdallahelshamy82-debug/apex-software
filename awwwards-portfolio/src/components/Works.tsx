'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const projects = [
  {
    id: 1,
    title: "PharmaExpress",
    category: "Mobile Application",
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80",
    year: "2024",
  },
  {
    id: 2,
    title: "AutoBid WebRTC",
    category: "Enterprise System",
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
    year: "2023",
  },
  {
    id: 3,
    title: "HealthAI Copilot",
    category: "AI Integration",
    image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80",
    year: "2023",
  },
  {
    id: 4,
    title: "Apex Cloud ERP",
    category: "Web Infrastructure",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
    year: "2022",
  },
];

export default function Works() {
  const targetRef = useRef<HTMLDivElement>(null);
  
  // Create a tall scrollable section (300vh)
  const { scrollYProgress } = useScroll({
    target: targetRef,
  });

  // Map vertical scroll progress (0 to 1) to horizontal translation (0% to -65%)
  // -65% pushes the flex container to the left precisely enough to show all 4 cards
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-65%"]);

  return (
    <section ref={targetRef} className="relative h-[300vh] bg-transparent">
      {/* Sticky container that stays in place while we scroll past 300vh */}
      <div className="sticky top-0 h-screen flex items-center overflow-hidden">
        
        {/* Massive Background Typography */}
        <h2 className="absolute top-12 left-12 text-[8vw] md:text-[6vw] font-serif font-bold text-white/5 whitespace-nowrap pointer-events-none uppercase">
          Selected Works
        </h2>

        {/* The horizontally moving track */}
        <motion.div style={{ x }} className="flex gap-8 px-[10vw] md:px-[15vw] w-max">
          {projects.map((project) => (
            <div 
              key={project.id} 
              className="group relative w-[80vw] md:w-[45vw] lg:w-[35vw] h-[55vh] md:h-[65vh] overflow-hidden rounded-2xl bg-[#0F172A] border border-white/10 shrink-0"
            >
              {/* Image with hover scale effect */}
              <motion.img 
                src={project.image} 
                alt={project.title}
                className="w-full h-full object-cover opacity-80 transition-transform duration-[1.5s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110 group-hover:opacity-100"
              />
              
              {/* Premium Dark Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-8 md:p-10">
                <div className="overflow-hidden mb-2">
                  <p className="text-[#B4F82C] font-sans text-xs md:text-sm uppercase tracking-widest font-semibold transform translate-y-0 transition-transform duration-500">
                    {project.category} • {project.year}
                  </p>
                </div>
                
                <div className="overflow-hidden">
                  <h3 className="text-3xl md:text-5xl font-serif text-white transform transition-transform duration-700 group-hover:-translate-y-2">
                    {project.title}
                  </h3>
                </div>

                {/* Hidden "View Project" button that reveals on hover */}
                <div className="absolute bottom-10 right-10 opacity-0 transform translate-y-4 transition-all duration-700 group-hover:opacity-100 group-hover:translate-y-0 hidden md:flex items-center gap-2">
                  <span className="text-white text-sm font-medium tracking-wide uppercase">View Case</span>
                  <div className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                      <line x1="5" y1="19" x2="19" y2="5"></line>
                      <polyline points="12 5 19 5 19 12"></polyline>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
