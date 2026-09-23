'use client';

import { useRef } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';

const philosophy = [
  { 
    id: 1, 
    title: "Performance First", 
    desc: "Optimizing every byte for instant load times and buttery smooth 60fps animations.",
    icon: "⚡"
  },
  { 
    id: 2, 
    title: "Scalable Architecture", 
    desc: "Building modular, type-safe systems that grow seamlessly with your business needs.",
    icon: "🏗️"
  },
  { 
    id: 3, 
    title: "Pixel-Perfect UI", 
    desc: "Bridging the gap between award-winning design and robust engineering with absolute precision.",
    icon: "🎯"
  }
];

const experience = [
  { 
    id: 1,
    year: "2023 - Present", 
    role: "Senior Frontend Architect", 
    company: "Apex Software", 
    desc: "Leading frontend teams, architecting micro-frontends, and establishing global UI/UX standards for enterprise products." 
  },
  { 
    id: 2,
    year: "2020 - 2023", 
    role: "Lead Frontend Engineer", 
    company: "TechNova Solutions", 
    desc: "Developed highly interactive web applications using React, Next.js, and WebGL for global brands." 
  },
  { 
    id: 3,
    year: "2018 - 2020", 
    role: "Creative UI Developer", 
    company: "Awwwards Digital", 
    desc: "Designed and implemented award-winning landing pages with complex scroll animations and 3D interactions." 
  }
];

export default function Experience() {
  const timelineRef = useRef<HTMLDivElement>(null);
  
  // Track the scroll progress of the timeline section
  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ["start center", "end center"]
  });

  // Add a spring physics effect to the timeline drawing
  const scaleY = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <section className="w-full bg-[#050505] py-32 px-6 md:px-16 lg:px-24 text-white z-10 relative">
      <div className="max-w-7xl mx-auto flex flex-col gap-32">
        
        {/* ================= Philosophy Section ================= */}
        <div>
          <h2 className="text-4xl md:text-6xl font-serif font-bold mb-16 text-white">
            Engineering <span className="text-[#B4F82C] italic">Philosophy</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {philosophy.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, delay: i * 0.2, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ scale: 1.05 }}
                className="group relative p-8 rounded-2xl bg-white/5 border border-white/10 transition-shadow duration-500 hover:shadow-[0_0_40px_rgba(180,248,44,0.15)] cursor-default"
              >
                <div className="text-4xl mb-6">{item.icon}</div>
                <h3 className="text-2xl font-serif font-medium mb-4 group-hover:text-[#B4F82C] transition-colors">
                  {item.title}
                </h3>
                <p className="text-gray-400 font-sans leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ================= Experience Timeline Section ================= */}
        <div>
          <h2 className="text-4xl md:text-6xl font-serif font-bold mb-20 text-right text-white">
            Professional <span className="text-gray-500 italic">Journey</span>
          </h2>
          
          <div ref={timelineRef} className="relative w-full max-w-4xl mx-auto">
            {/* The Background Line */}
            <div className="absolute left-[15px] md:left-1/2 top-0 bottom-0 w-[2px] bg-white/10 transform md:-translate-x-1/2" />
            
            {/* The Animated Drawn Line */}
            <motion.div 
              style={{ scaleY, transformOrigin: "top" }} 
              className="absolute left-[15px] md:left-1/2 top-0 bottom-0 w-[2px] bg-[#B4F82C] transform md:-translate-x-1/2 z-10" 
            />

            {/* Timeline Items */}
            <div className="flex flex-col gap-16">
              {experience.map((exp, i) => {
                const isEven = i % 2 === 0;
                return (
                  <div key={exp.id} className={`relative flex flex-col md:flex-row items-start md:items-center w-full ${isEven ? 'md:justify-start' : 'md:justify-end'}`}>
                    
                    {/* The Dot */}
                    <div className="absolute left-[11px] md:left-1/2 w-[10px] h-[10px] rounded-full bg-[#050505] border-2 border-[#B4F82C] transform md:-translate-x-1/2 mt-2 md:mt-0 z-20" />
                    
                    {/* The Content Card */}
                    <motion.div 
                      initial={{ opacity: 0, x: isEven ? -30 : 30 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                      className={`w-full md:w-[45%] pl-12 md:pl-0 ${isEven ? 'md:pr-12 md:text-right' : 'md:pl-12 md:text-left'}`}
                    >
                      <span className="text-[#B4F82C] font-mono text-sm uppercase tracking-widest">{exp.year}</span>
                      <h3 className="text-2xl md:text-3xl font-serif text-white mt-2 mb-1">{exp.role}</h3>
                      <h4 className="text-lg text-gray-400 font-sans mb-4">{exp.company}</h4>
                      <p className="text-gray-500 font-sans leading-relaxed">{exp.desc}</p>
                    </motion.div>
                    
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
