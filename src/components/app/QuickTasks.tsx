import { useEffect, useState } from "react";
import { readOrder, sortByRotation } from "@/lib/adRotation";
import { useQuery } from "@tanstack/react-query";
import { getTasks } from "@/lib/api.functions";
import { useAppState } from "./useApp";
import { TaskRow, type Task } from "./TasksTab";
import { Card, GhostButton, Pill, SectionTitle } from "./ui";

/** Home shortcut: the next 3 unfinished tasks. Finishing one pulls the next one in. */
const NETS = [
  { net: "int", name: "Adsgram", key: "adsgramIntBlockId" },
  { net: "reward", name: "Adsgram Reward", key: "adsgramRewardBlockId" },
  { net: "giga", name: "Gigapub", key: "gigaBlockId" },
  { net: "monetag", name: "Monetag", key: "monetagBlockId" },
  { net: "tower", name: "Tower Ads", key: "towerApiKey" },
];

/** Next two ad networks in the rotation, shown as a Home shortcut. */
function QuickAds({ onAds }: { onAds: () => void }) {
  const { boot } = useAppState();
  const cfg = boot.cfg as unknown as Record<string, unknown>;
  const [order, setOrder] = useState<string[]>([]);
  useEffect(() => {
    const f = () => setOrder(readOrder());
    f();
    window.addEventListener("tgx-ad-order", f);
    return () => window.removeEventListener("tgx-ad-order", f);
  }, []);
  const live = NETS.filter((n) => String(cfg[n.key] ?? "").trim());
  const next = sortByRotation(live, order).slice(0, 2);
  if (!next.length) return null;
  return (
    <Card>
      <SectionTitle icon="📺" title="Quick Ads" action={<Pill tone="warn">next up</Pill>} />
      <div className="grid grid-cols-2 gap-2">
        {next.map((n) => (
          <button
            key={n.net}
            onClick={onAds}
            className="farm-tile rounded-xl border border-primary/30 bg-background/50 p-3 text-left transition-transform active:scale-95"
          >
            <p className="text-sm font-black">{n.name}</p>
            <p className="text-[11px] text-muted-foreground">▶ Watch & earn</p>
          </button>
        ))}
      </div>
    </Card>
  );
}

export function QuickTasks({ onSeeAll, onAds }: { onSeeAll: () => void; onAds?: () => void }) {
  const { auth } = useAppState();
  const [opened, setOpened] = useState<Record<string, number>>({});
  const { data } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => getTasks({ data: { initData: auth } }),
    refetchOnWindowFocus: false,
    staleTime: 30000,
  });
  const done = data?.done ?? [];
  const left = ((data?.tasks ?? []) as Task[]).filter((t) => !done.includes(t.id));
  const shown = left.slice(0, 3);
  return (
    <>
    {onAds && <QuickAds onAds={onAds} />}
    {left.length > 0 && <Card>
      <SectionTitle icon="⚡" title="Quick Tasks" action={<Pill tone="warn">{left.length} left</Pill>} />
      <div className="space-y-3">
        {shown.map((t, i) => (
          <TaskRow
            key={t.id}
            n={i + 1}
            t={t}
            claimed={false}
            openedAt={opened[t.id] ?? 0}
            onOpened={(at) => setOpened((o) => ({ ...o, [t.id]: at }))}
          />
        ))}
      </div>
      {left.length > 3 && (
        <GhostButton className="mt-3" onClick={onSeeAll}>
          📋 See all {left.length} tasks
        </GhostButton>
      )}
    </Card>}
    </>
  );
}
