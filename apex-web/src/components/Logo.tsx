'use client';

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Sleek App-Like Icon */}
      <div className="relative w-10 h-10 rounded-xl bg-gradient-to-b from-white/10 to-transparent border border-white/10 flex items-center justify-center shadow-lg backdrop-blur-md overflow-hidden group">
        <div className="absolute inset-0 bg-accent-radium/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="w-3.5 h-3.5 rounded-full bg-accent-radium shadow-[0_0_15px_#ccff00]" />
      </div>
      
      {/* Typography */}
      <span className="font-sans font-bold text-2xl tracking-wide text-white">
        Apex<span className="text-accent-radium">.</span>
      </span>
    </div>
  );
}
