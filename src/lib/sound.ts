const KEY = "tgx-sound";
let ctx: AudioContext | null = null;

export function soundOn() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(KEY) !== "off";
}
export function setSoundOn(v: boolean) {
  localStorage.setItem(KEY, v ? "on" : "off");
}

/** Short synthesized pickaxe "clink" — no audio files downloaded. */
export function playPick() {
  if (!soundOn()) return;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    const now = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "triangle";
    o.frequency.setValueAtTime(1400, now);
    o.frequency.exponentialRampToValueAtTime(380, now + 0.12);
    g.gain.setValueAtTime(0.18, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    o.connect(g).connect(ctx.destination);
    o.start(now);
    o.stop(now + 0.2);
  } catch {
    /* audio unavailable */
  }
}
