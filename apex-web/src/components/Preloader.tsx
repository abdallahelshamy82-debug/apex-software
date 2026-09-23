'use client';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Logo from './Logo';

export default function Preloader() {
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      current += Math.floor(Math.random() * 10) + 2; // Speed of counting
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        setTimeout(() => setIsLoading(false), 400); // small pause at 100%
      }
      setProgress(current);
    }, 40);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ y: 0 }}
      animate={{ y: isLoading ? 0 : '-100vh' }}
      transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}
      className="fixed inset-0 z-[99999] bg-bg-onyx flex flex-col justify-end p-10 md:p-20 pointer-events-none border-b border-border-glass shadow-2xl"
    >
      <div className="flex justify-between items-end w-full overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="scale-125 md:scale-150 origin-bottom-left"
        >
          <Logo />
        </motion.div>
        
        <h2 className="text-white font-sans text-7xl md:text-[10rem] font-black leading-none tracking-tighter">
          {progress}%
        </h2>
      </div>
    </motion.div>
  );
}
