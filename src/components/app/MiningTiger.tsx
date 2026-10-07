import tiger from "@/assets/tiger-miner.png";

export function MiningTiger({ running }: { running: boolean }) {
  return (
    <div className="relative mb-3 grid h-40 place-items-center overflow-hidden rounded-2xl border border-primary/30 bg-background/60">
      <img
        src={tiger}
        alt={running ? "Tiger mining" : "Tiger sleeping"}
        className={`h-36 w-auto select-none ${running ? "tg-mine" : "tg-sleep"}`}
        draggable={false}
      />
      {running ? (
        <>
          <span className="tg-chip absolute bottom-6 left-[58%] text-lg">✨</span>
          <span className="tg-chip absolute bottom-8 left-[64%] text-sm [animation-delay:.3s]">🪨</span>
          <span className="tg-chip absolute bottom-5 left-[54%] text-sm [animation-delay:.55s]">💎</span>
        </>
      ) : (
        <>
          <span className="tg-z absolute right-[28%] top-6 text-sm font-bold text-primary">z</span>
          <span className="tg-z absolute right-[24%] top-4 text-base font-bold text-primary [animation-delay:.7s]">Z</span>
          <span className="tg-z absolute right-[20%] top-2 text-lg font-bold text-primary [animation-delay:1.4s]">Z</span>
        </>
      )}
    </div>
  );
}
