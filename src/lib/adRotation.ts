/** Client-side ad card rotation: a watched network moves to the back of the line. */
const KEY = "tgx_ad_order";

export function readOrder(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as string[];
  } catch {
    return [];
  }
}

export function sortByRotation<T extends { net: string }>(cards: T[], order: string[]): T[] {
  const rank = (n: string) => {
    const i = order.indexOf(n);
    return i === -1 ? -1 : i;
  };
  return [...cards].sort((a, b) => rank(a.net) - rank(b.net));
}

export function rotateToBack(net: string, all: string[]) {
  const cur = readOrder().filter((n) => all.includes(n));
  for (const n of all) if (!cur.includes(n)) cur.unshift(n);
  const next = [...cur.filter((n) => n !== net), net];
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("tgx-ad-order"));
  return next;
}
