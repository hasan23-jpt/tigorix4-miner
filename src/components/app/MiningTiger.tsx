import { useEffect, useRef, useState } from "react";
import { playClink } from "@/lib/sound";

export function MiningTiger({ running }: { running: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const active = useRef(running);
  active.current = running;
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(playClink, 1600); // one clink per pickaxe strike
    return () => clearInterval(id);
  }, [running]);
  useEffect(() => {
    let cancelled = false;
    let dispose: (() => void) | undefined;
    void import("./miningScene").then(({ createMiningScene }) => {
      if (cancelled || !host.current) return;
      try {
        dispose = createMiningScene(host.current, () => active.current);
      } catch {
        setFailed(true);
      }
    }).catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; dispose?.(); };
  }, []);
  return (
    <div className="relative -mx-3 mb-2 h-56 overflow-hidden" role="img" aria-label={running ? "3D tiger striking ore with a pickaxe" : "3D tiger lying down asleep"}>
      <div ref={host} className="h-full w-full touch-pan-y" />
      {!running && !failed && <span className="pointer-events-none absolute left-[30%] top-8 text-sm font-bold text-primary motion-safe:animate-pulse">z Z</span>}
      {failed && <p className="absolute inset-0 grid place-items-center text-xs text-muted-foreground">3D view unavailable on this device</p>}
    </div>
  );
}
