export default function NoiseOverlay() {
  return (
    <div 
      aria-hidden="true" 
      className="pointer-events-none fixed inset-0 z-40 h-full w-full opacity-[0.025] mix-blend-overlay will-change-transform"
      style={{
        backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.2) 1px, transparent 0)`,
        backgroundSize: `24px 24px`,
      }}
    />
  );
}
