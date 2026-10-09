'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Logo from './Logo';

export default function Preloader() {
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      current += Math.floor(Math.random() * 12) + 3;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        setTimeout(() => {
          setIsLoading(false);
          // Unmount after exit animation completes
          setTimeout(() => setIsFinished(true), 1100);
        }, 300);
      }
      setProgress(current);
    }, 35);

    return () => clearInterval(interval);
  }, []);

  if (isFinished) return null;

  return (
    <motion.div
      initial={{ y: 0 }}
      animate={{ y: isLoading ? 0 : '-100vh' }}
      transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}
      className="fixed inset-0 z-[99999] bg-bg-onyx flex flex-col justify-end p-8 md:p-20 pointer-events-none border-b border-border-glass shadow-2xl will-change-transform"
    >
      <div className="flex justify-between items-end w-full overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="scale-110 md:scale-130 origin-bottom-left"
        >
          <Logo size="lg" />
        </motion.div>
        
        <h2 className="text-white font-sans text-6xl md:text-[8rem] font-black leading-none tracking-tighter">
          {progress}%
        </h2>
      </div>
    </motion.div>
  );
}
