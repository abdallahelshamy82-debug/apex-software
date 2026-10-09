'use client';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export default function Logo({ className = "", size = "md", showText = true }: LogoProps) {
  const sizeMap = {
    sm: {
      box: 'h-8 w-8 rounded-lg',
      px: 32,
      text: 'text-xl',
      dot: 'text-2xl',
    },
    md: {
      box: 'h-10 w-10 rounded-xl',
      px: 40,
      text: 'text-2xl',
      dot: 'text-3xl',
    },
    lg: {
      box: 'h-12 w-12 rounded-2xl',
      px: 48,
      text: 'text-3xl',
      dot: 'text-4xl',
    },
  }[size];

  return (
    <div className={`flex items-center gap-3 ${className}`} dir="ltr">
      {/* Official Magixa Cybernetic Brand Mark */}
      <div 
        className={`relative flex ${sizeMap.box} shrink-0 items-center justify-center overflow-hidden bg-[#05070E] border border-accent-radium/35 shadow-[0_0_18px_rgba(204,255,0,0.22)] group-hover:shadow-[0_0_28px_rgba(204,255,0,0.5)] group-hover:border-accent-radium/70 transition-all duration-300`}
      >
        <Image 
          src="/magixa-symbol.png" 
          alt="Magixa Official Brand Logo" 
          width={sizeMap.px} 
          height={sizeMap.px}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-108"
          priority
        />
        <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-[inherit] pointer-events-none" />
      </div>

      {showText && (
        <span className={`font-heading font-black ${sizeMap.text} tracking-wider text-white flex items-center select-none`}>
          <span>Magixa</span>
          <span className={`text-accent-radium font-sans ${sizeMap.dot} leading-none`}>.</span>
        </span>
      )}
    </div>
  );
}
