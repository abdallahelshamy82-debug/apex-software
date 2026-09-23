import Hero from '@/components/Hero';
import Works from '@/components/Works';
import Experience from '@/components/Experience';

export default function Home() {
  return (
    <div className="flex flex-col w-full min-h-screen">
      <Hero />
      <Works />
      <Experience />
      
      {/* Sleek Minimal Footer */}
      <footer className="w-full py-12 px-6 md:px-16 lg:px-24 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 bg-[#050505] z-10">
        <p className="text-gray-500 font-sans text-sm">© {new Date().getFullYear()} Architect Portfolio. All rights reserved.</p>
        <div className="flex gap-6">
          <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm font-medium tracking-wide">TWITTER</a>
          <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm font-medium tracking-wide">LINKEDIN</a>
          <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm font-medium tracking-wide">GITHUB</a>
        </div>
      </footer>
    </div>
  );
}
