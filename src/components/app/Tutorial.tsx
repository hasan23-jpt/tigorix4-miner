import { useEffect, useState } from "react";
import { GoldButton, GhostButton } from "./ui";

const KEY = "tgx_tutorial_done_v1";
const STEPS = [
  { e: "🐯", t: "Welcome to the Tiger Farm!", d: "You are the farmer. Grow your TGX harvest every day and cash it out in USDT." },
  { e: "⛏️", t: "Tap to start mining", d: "Tap Start Mining on Home. When the session ends, tap Claim and start a new one." },
  { e: "📺", t: "Watch ads, earn TGX", d: "Each ad network card pays TGX. Watched cards move to the back so fresh ones come first." },
  { e: "✅", t: "Tasks, codes & friends", d: "Finish tasks, redeem daily codes and invite friends for bonus rewards." },
  { e: "💸", t: "Withdraw USDT", d: "Add your BEP-20 wallet in Profile and request a withdrawal. The bot will confirm it." },
];

/** First-run tutorial. Once dismissed it never shows again on this device. */
export function Tutorial() {
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);
  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setOpen(true);
    } catch {
      /* storage blocked */
    }
  }, []);
  if (!open) return null;
  const close = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  };
  const s = STEPS[i]!;
  const last = i === STEPS.length - 1;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-5 backdrop-blur-sm">
      <div key={i} className="surface-card farm-pop w-full max-w-sm p-6 text-center">
        <p className="animate-float text-6xl">{s.e}</p>
        <h2 className="mt-3 text-xl font-black text-gold-gradient">{s.t}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
        <div className="mt-4 flex justify-center gap-1.5">
          {STEPS.map((_, k) => (
            <span key={k} className={`h-1.5 rounded-full transition-all ${k === i ? "w-6 bg-primary" : "w-1.5 bg-muted"}`} />
          ))}
        </div>
        <div className="mt-5 space-y-2">
          <GoldButton onClick={() => (last ? close() : setI(i + 1))}>{last ? "🌾 Start farming" : "Next ➜"}</GoldButton>
          {!last && <GhostButton onClick={close}>Skip</GhostButton>}
        </div>
      </div>
    </div>
  );
}
