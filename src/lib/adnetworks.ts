/**
 * Multi-network ad layer (browser only).
 *
 * Every network is optional and fully admin-configurable: when a block ID is
 * missing, the network is simply hidden / skipped. Reward-gated actions require
 * the ad to actually play for `MIN_WATCH_MS`, otherwise no reward is granted and
 * the caller shows a "try again" popup.
 */
import { showAdsgramAd } from "./adsgram";

/** No minimum watch time: the reward is granted as soon as the network reports the ad finished. */
export const MIN_WATCH_MS = 0;

export type AdNet = "int" | "reward" | "giga" | "monetag" | "bitvex";

export type AdResult = { ok: boolean; reason?: "nofill" | "short" | "skip" };

type Win = Record<string, unknown>;

const W = () => window as unknown as Win;

const loaded = new Map<string, Promise<boolean>>();

function loadScript(key: string, build: () => HTMLScriptElement): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  const cached = loaded.get(key);
  if (cached) return cached;
  const p = new Promise<boolean>((resolve) => {
    const s = build();
    s.async = true;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.head.appendChild(s);
  });
  loaded.set(key, p);
  return p;
}

/* -------------------------------- Gigapub -------------------------------- */

async function showGigaAd(id: string): Promise<boolean> {
  const w = W();
  if (typeof w["showGiga"] !== "function") {
    await loadScript(`giga:${id}`, () => {
      const s = document.createElement("script");
      s.src = `https://ad.gigapub.tech/script?id=${encodeURIComponent(id)}`;
      return s;
    });
  }
  // The SDK can register its global slightly after onload.
  for (let i = 0; i < 20 && typeof W()["showGiga"] !== "function"; i++)
    await new Promise((r) => setTimeout(r, 100));
  const fn = W()["showGiga"] as (() => Promise<unknown>) | undefined;
  if (typeof fn !== "function") return false;
  try {
    await fn();
    return true;
  } catch {
    return false;
  }
}

/* -------------------------------- Monetag -------------------------------- */

async function showMonetagAd(zone: string): Promise<boolean> {
  const sdk = `show_${zone}`;
  if (typeof W()[sdk] !== "function") {
    await loadScript(`monetag:${zone}`, () => {
      const s = document.createElement("script");
      s.src = "//libtl.com/sdk.js";
      s.dataset["zone"] = zone;
      s.dataset["sdk"] = sdk;
      return s;
    });
  }
  const fn = W()[sdk] as (() => Promise<unknown>) | undefined;
  if (typeof fn !== "function") return false;
  try {
    await fn();
    return true;
  } catch {
    return false;
  }
}

/* -------------------------------- Tower Ads ------------------------------ */

type TowerInstance = { loadAndShow: () => Promise<unknown> };
type TowerCtor = new (opts: {
  apiKey: string;
  placementId: string;
  onRewardEarned?: (reward: unknown) => void;
  onAdClosed?: () => void;
  onError?: (err: unknown) => void;
}) => TowerInstance;

/** Callbacks of the ad currently on screen (the SDK binds callbacks at construction). */
let towerCurrent: { reward: () => void; closed: () => void; error: () => void } | null = null;
const towerInstances = new Map<string, TowerInstance>();

/**
 * Tower Ads: block ID is "apiKey|placementId". Success only when the SDK fires
 * onRewardEarned; closing early, errors or no-fill count as not watched.
 */
async function showTowerAd(block: string): Promise<boolean> {
  const [apiKey, placementId] = block.split("|").map((x) => x.trim());
  if (!apiKey || !placementId) return false;
  if (typeof W()["TowerAds"] !== "function") {
    await loadScript("tower", () => {
      const s = document.createElement("script");
      s.src = "https://uslads.com/sdk/tower-ads-v4.js";
      return s;
    });
    for (let i = 0; i < 20 && typeof W()["TowerAds"] !== "function"; i++)
      await new Promise((r) => setTimeout(r, 100));
  }
  const Ctor = W()["TowerAds"] as TowerCtor | undefined;
  if (typeof Ctor !== "function") return false;

  let ads = towerInstances.get(block);
  if (!ads) {
    ads = new Ctor({
      apiKey,
      placementId,
      onRewardEarned: () => towerCurrent?.reward(),
      onAdClosed: () => towerCurrent?.closed(),
      onError: () => towerCurrent?.error(),
    });
    towerInstances.set(block, ads);
  }

  return new Promise<boolean>((resolve) => {
    let done = false;
    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      towerCurrent = null;
      clearTimeout(hardStop);
      resolve(ok);
    };
    // Never hang forever if the SDK never settles.
    const hardStop = setTimeout(() => finish(false), 120_000);
    towerCurrent = {
      reward: () => finish(true),
      // The reward callback can land just after close — give it a moment.
      closed: () => setTimeout(() => finish(false), 1500),
      error: () => finish(false),
    };
    ads!.loadAndShow().catch(() => finish(false));
  });
}

/* --------------------------------- public -------------------------------- */

export function hasBlock(id: string | undefined | null) {
  return !!(id && String(id).trim().length >= 3);
}

/**
 * Shows one ad from the given network. When `minWatchMs` is set, an ad that
 * closed too quickly counts as not watched (`reason: "short"`).
 */
export async function showAd(
  net: AdNet,
  blockId: string | undefined,
  minWatchMs = 0
): Promise<AdResult> {
  const id = String(blockId ?? "").trim();
  if (!hasBlock(id)) return { ok: false, reason: "nofill" };
  const started = Date.now();
  let ok = false;
  if (net === "int" || net === "reward") ok = await showAdsgramAd(id);
  else if (net === "giga") ok = await showGigaAd(id);
  else if (net === "monetag") ok = await showMonetagAd(id);
  else ok = await showBitvexAd(id);

  if (!ok) return { ok: false, reason: "nofill" };
  if (minWatchMs && Date.now() - started < minWatchMs) return { ok: false, reason: "short" };
  return { ok: true };
}

export function adErrorMessage(r: AdResult) {
  if (r.reason === "short") return "⏱ Ad closed too soon — watch at least 15 seconds to get the reward.";
  return "📺 No ad available right now — please try again in a moment.";
}
