import { useEffect, useRef, useState } from "react";
import { playPick, setSoundOn, soundOn } from "@/lib/sound";

type SceneApi = { setRunning: (v: boolean) => void; dispose: () => void };

export function MiningTiger({ running }: { running: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<SceneApi | null>(null);
  const [sound, setSound] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => setSound(soundOn()), []);

  useEffect(() => {
    let cancelled = false;
    void import("./miningScene")
      .then(({ createMiningScene }) => {
        if (cancelled || !host.current) return;
        api.current = createMiningScene(host.current, playPick);
        api.current.setRunning(running);
      })
      .catch(() => setFailed(true));
    return () => {
      cancelled = true;
      api.current?.dispose();
      api.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => api.current?.setRunning(running), [running]);

  return (
    <div className="relative mx-auto mb-3 h-44 w-full overflow-hidden rounded-xl border border-border bg-background/40">
      <div ref={host} className="absolute inset-0" role="img" aria-label={running ? "Tiger mining gold ore" : "Tiger sleeping"} />
      {failed && <p className="grid h-full place-items-center text-5xl">{running ? "🐯⛏" : "🐯💤"}</p>}
      {!running && <span className="pointer-events-none absolute left-1/3 top-6 animate-pulse text-lg font-black text-primary">Z z z</span>}
      <button
        type="button"
        aria-label={sound ? "Sound off" : "Sound on"}
        onClick={() => {
          setSoundOn(!sound);
          setSound(!sound);
        }}
        className="absolute right-2 top-2 rounded-full border border-border bg-background/80 px-2.5 py-1 text-sm"
      >
        {sound ? "🔊" : "🔇"}
      </button>
    </div>
  );
}
