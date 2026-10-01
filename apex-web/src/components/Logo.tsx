'use client';
import Image from 'next/image';

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Image
        src="/apex-app-icon.png"
        alt="Apex app logo"
        width={40}
        height={40}
        className="h-10 w-10 rounded-xl object-cover shadow-lg"
      />

      <span className="font-sans font-bold text-2xl tracking-wide text-white">
        Apex<span className="text-accent-radium">.</span>
      </span>
    </div>
  );
}
