'use client';

import { motion } from 'framer-motion';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const wordAnimation = {
  hidden: { y: '120%', rotate: 3 },
  show: {
    y: '0%',
    rotate: 0,
    transition: {
      duration: 1.2,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  },
};

const fadeAnimation = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] as [number, number, number, number], delay: 0.8 },
  },
};

export default function Hero() {
  const line1 = 'Scalable Systems,'.split(' ');
  const line2 = 'Flawless Engineering.'.split(' ');

  return (
    <section className="relative w-full h-screen flex flex-col justify-center px-6 md:px-16 lg:px-24 z-10">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="w-full max-w-7xl mx-auto flex flex-col gap-2 md:gap-4"
      >
        {/* Line 1 */}
        <div className="flex flex-wrap gap-x-[2vw] gap-y-2">
          {line1.map((word, idx) => (
            <span key={idx} className="overflow-hidden inline-block pb-2">
              <motion.span
                variants={wordAnimation}
                className="inline-block text-6xl md:text-8xl lg:text-[110px] font-serif font-medium leading-[1.1] tracking-tight text-white origin-bottom-left"
              >
                {word}
              </motion.span>
            </span>
          ))}
        </div>
        
        {/* Line 2 */}
        <div className="flex flex-wrap gap-x-[2vw] gap-y-2 md:ml-[10vw]">
          {line2.map((word, idx) => (
            <span key={idx} className="overflow-hidden inline-block pb-2">
              <motion.span
                variants={wordAnimation}
                className="inline-block text-6xl md:text-8xl lg:text-[110px] font-serif font-medium leading-[1.1] tracking-tight text-[#B4F82C] origin-bottom-left"
              >
                {word}
              </motion.span>
            </span>
          ))}
        </div>

        {/* Subtitle / Intro */}
        <motion.div variants={fadeAnimation} className="mt-8 md:mt-16 flex flex-col md:flex-row gap-8 justify-between items-start md:items-end w-full max-w-4xl md:ml-[10vw]">
          <p className="text-lg md:text-xl text-gray-400 font-sans leading-relaxed max-w-lg">
            I am a Senior Frontend Architect crafting world-class digital experiences. 
            Bridging the gap between award-winning design and robust engineering.
          </p>

          <div className="flex flex-col gap-1">
            <span className="text-sm uppercase tracking-widest text-gray-500 font-semibold mb-2">Available for Work</span>
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#B4F82C] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#B4F82C]"></span>
              </span>
              <span className="text-white font-sans">Open to New Opportunities</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
