/** Animated tiger-farm backdrop: sun, drifting clouds, rolling fields, a walking tiger farmer and falling coins. */
export function FarmScene() {
  return (
    <div aria-hidden className="farm-scene pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="farm-sky absolute inset-0" />
      <div className="farm-sun absolute right-8 top-16 size-24 rounded-full" />
      <span className="farm-cloud absolute top-24 text-4xl opacity-40">☁️</span>
      <span className="farm-cloud farm-cloud-2 absolute top-44 text-3xl opacity-30">☁️</span>
      {Array.from({ length: 8 }).map((_, i) => (
        <span
          key={i}
          className="farm-coin absolute text-lg"
          style={{ left: `${8 + i * 12}%`, animationDelay: `${i * 1.3}s`, animationDuration: `${7 + (i % 3) * 2}s` }}
        >
          🪙
        </span>
      ))}
      <div className="farm-hill farm-hill-back absolute inset-x-[-20%] bottom-24 h-56 rounded-[50%]" />
      <div className="farm-hill farm-hill-front absolute inset-x-[-10%] bottom-[-40px] h-56 rounded-[50%]" />
      <div className="farm-rows absolute inset-x-0 bottom-0 h-40" />
      <div className="absolute bottom-24 left-1/2 flex -translate-x-1/2 items-end">
        <span className="miner-body inline-block text-5xl">🐯</span>
        <span className="miner-pick -ml-3 mb-6 inline-block text-4xl">⛏️</span>
        <span className="relative -ml-2 inline-block text-5xl">
          🪨
          <span className="miner-chip absolute -top-2 left-1 text-sm">✨</span>
          <span className="miner-chip miner-chip-2 absolute -top-1 left-6 text-sm">🪙</span>
        </span>
      </div>
      <span className="absolute bottom-32 left-6 text-3xl">🌾</span>
      <span className="absolute bottom-36 right-10 text-3xl">🌽</span>
      <span className="absolute bottom-20 left-1/3 text-2xl">🌱</span>
      <div className="absolute inset-0 bg-background/55" />
    </div>
  );
}
