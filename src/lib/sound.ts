/** Tiny synthesized mining sounds (no audio files) + a persisted on/off switch. */
const KEY = "tgx-sound";
let ctx: AudioContext | null = null;

export function soundOn() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(KEY) !== "off";
}

export function setSound(on: boolean) {
  localStorage.setItem(KEY, on ? "on" : "off");
  window.dispatchEvent(new Event("tgx-sound"));
}

/** Metallic pickaxe "clink" on rock. */
export function playClink() {
  if (!soundOn()) return;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    const t = ctx.currentTime;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.18, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    g.connect(ctx.destination);
    [1800, 2650].forEach((f) => {
      const o = ctx!.createOscillator();
      o.type = "triangle";
      o.frequency.setValueAtTime(f, t);
      o.frequency.exponentialRampToValueAtTime(f * 0.7, t + 0.2);
      o.connect(g);
      o.start(t);
      o.stop(t + 0.25);
    });
    // short rock thud
    const n = ctx.createBufferSource();
    const b = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    n.buffer = b;
    const ng = ctx.createGain();
    ng.gain.value = 0.12;
    n.connect(ng).connect(ctx.destination);
    n.start(t);
  } catch {
    /* audio unavailable */
  }
}
