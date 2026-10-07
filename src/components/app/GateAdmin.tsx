import { useState } from "react";
import { adminGateSave } from "@/lib/api.functions";
import { useAppState } from "./useApp";
import { Card, Field, GhostButton, GoldButton, Guide, SectionTitle } from "./ui";

type G = { id: string; kind: "channel" | "app"; name: string; url: string; imageUrl: string };

/** Admin: extra items on the first-open join popup (Telegram channels or mini apps). */
export function GateAdmin({ admin, list, onDone }: { admin: { initData: string; password: string }; list: G[]; onDone: () => void }) {
  const { run, busy } = useAppState();
  const [items, setItems] = useState<G[]>(list ?? []);
  const [d, setD] = useState<G>({ id: "", kind: "channel", name: "", url: "", imageUrl: "" });
  const save = (next: G[]) =>
    void run(() => adminGateSave({ data: { ...admin, list: next } }), (r) => `✅ Saved ${r?.count} item(s)`).then(() => {
      setItems(next);
      onDone();
    });
  return (
    <div className="space-y-4">
      <Guide>
        These show in the join popup after the 4 main channels. Telegram channels are checked by the
        bot (bot must be admin). Mini apps verify 5 seconds after the user opens them.
      </Guide>
      <Card>
        <SectionTitle icon="➕" title="Add join task" />
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {(["channel", "app"] as const).map((k) => (
              <GhostButton key={k} className={d.kind === k ? "border-primary text-primary" : ""} onClick={() => setD({ ...d, kind: k })}>
                {k === "channel" ? "📢 Telegram" : "🕹 Mini app"}
              </GhostButton>
            ))}
          </div>
          <Field label="Name" value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} />
          <Field label="Link (https://t.me/...)" value={d.url} onChange={(e) => setD({ ...d, url: e.target.value })} />
          <Field label="Logo URL (optional)" value={d.imageUrl} onChange={(e) => setD({ ...d, imageUrl: e.target.value })} />
          <GoldButton
            disabled={busy || !d.name || !d.url.startsWith("https://")}
            onClick={() => {
              save([...items, { ...d, id: `g${Date.now()}` }]);
              setD({ id: "", kind: d.kind, name: "", url: "", imageUrl: "" });
            }}
          >
            ➕ Add
          </GoldButton>
        </div>
      </Card>
      <Card>
        <SectionTitle icon="📋" title={`Join tasks (${items.length})`} />
        <div className="space-y-2">
          {items.map((g) => (
            <div key={g.id} className="flex items-center gap-2 rounded-xl border border-border p-2">
              {g.imageUrl ? <img src={g.imageUrl} alt="" className="size-9 rounded-full object-cover" /> : <span className="text-xl">{g.kind === "app" ? "🕹" : "📢"}</span>}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{g.name}</p>
                <p className="truncate text-[10px] text-muted-foreground">{g.url}</p>
              </div>
              <GhostButton className="w-auto px-3" disabled={busy} onClick={() => save(items.filter((x) => x.id !== g.id))}>🗑</GhostButton>
            </div>
          ))}
          {!items.length && <p className="text-center text-xs text-muted-foreground">No extra join tasks.</p>}
        </div>
      </Card>
    </div>
  );
}
