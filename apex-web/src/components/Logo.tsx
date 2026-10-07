'use client';

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`} dir="ltr">
      {/* High-tech Magixa Monogram Emblem */}
      <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-white/10 to-white/[0.03] border border-white/15 shadow-[0_0_15px_rgba(204,255,0,0.25)] group-hover:shadow-[0_0_25px_rgba(204,255,0,0.5)] group-hover:border-accent-radium/60 transition-all duration-300">
        <svg 
          className="w-5 h-5 text-accent-radium drop-shadow-[0_0_6px_rgba(204,255,0,0.5)]" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2.4" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M4 19V5l8 7 8-7v14" />
        </svg>
      </div>

      <span className="font-heading font-black text-2xl tracking-wider text-white flex items-center">
        <span>Magixa</span>
        <span className="text-accent-radium font-sans text-3xl leading-none">.</span>
      </span>
    </div>
  );
}
