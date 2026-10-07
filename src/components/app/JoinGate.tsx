import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { doGateOpen, doGateVerify, getRequiredChannels } from "@/lib/api.functions";
import { openLink } from "@/lib/telegram";
import { useAppState } from "./useApp";
import { GoldButton } from "./ui";

/** Blocks the app until the user is in every required channel (checked by the bot). */
export function JoinGate() {
  const { auth } = useAppState();
  const { data, refetch, isFetching } = useQuery({
    queryKey: ["required-channels"],
    queryFn: () => getRequiredChannels({ data: { initData: auth } }),
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
  const [open, setOpen] = useState(false);
  const [opened, setOpened] = useState<Record<string, number>>({});
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (data) setOpen(!data.allJoined);
  }, [data]);
  if (!open || !data) return null;

  const verify = async () => {
    const r = await refetch();
    if (r.data?.allJoined) {
      setOpen(false);
      toast.success("✅ Verified — welcome to Tigorix!");
    } else toast.error("📣 Please join every channel first.");
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/90 p-5 backdrop-blur">
      <div className="surface-card w-full max-w-sm p-5">
        <img src="/tigorix-logo.png" alt="Tigorix" className="mx-auto size-16 rounded-full ring-2 ring-primary" />
        <h2 className="mt-3 text-center text-lg font-extrabold">📢 Join our channels</h2>
        <p className="mt-1 text-center text-xs text-muted-foreground">
          Complete every item below to use Tigorix.
        </p>
        <div className="mt-4 space-y-2">
          {data.channels.map((c) => {
            const isApp = c.kind === "app";
            const at = opened[c.id] ?? 0;
            const left = at ? Math.max(0, 5 - Math.floor((now - at) / 1000)) : 0;
            const click = async () => {
              if (c.joined) return;
              if (isApp && at && left === 0) {
                try {
                  await doGateVerify({ data: { initData: auth, id: c.id } });
                  toast.success("✅ Verified");
                  void refetch();
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Not verified");
                }
                return;
              }
              if (isApp) {
                setOpened((o) => ({ ...o, [c.id]: Date.now() }));
                void doGateOpen({ data: { initData: auth, id: c.id } }).catch(() => {});
              }
              openLink(c.url);
            };
            const status = c.joined
              ? "✅ Done"
              : isApp
                ? at
                  ? left > 0 ? `⏱ ${left}s` : "🔎 Verify"
                  : "Open ➜"
                : "Join ➜";
            return (
              <button
                key={c.id}
                onClick={() => void click()}
                className="flex w-full items-center gap-3 rounded-xl border border-border bg-background/50 p-2.5 text-left active:scale-[0.98]"
              >
                <ChannelLogo id={c.id} src={c.imageUrl || undefined} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{c.name}</span>
                  <span className="block text-[10px] text-muted-foreground">{isApp ? "🕹 Mini app" : "📢 Telegram"}</span>
                </span>
                <span className={`text-xs font-extrabold ${c.joined ? "text-success" : "text-primary"}`}>{status}</span>
              </button>
            );
          })}
        </div>
        <GoldButton className="mt-4" disabled={isFetching} onClick={() => void verify()}>
          {isFetching ? "🔎 Checking…" : "✅ Verify & Continue"}
        </GoldButton>
      </div>
    </div>
  );
}

function ChannelLogo({ id, src }: { id: string; src?: string | undefined }) {
  const [bad, setBad] = useState(false);
  if (bad)
    return <img src="/tigorix-logo.png" alt="" className="size-10 rounded-full object-cover" />;
  return (
    <img
      src={src ?? `/api/public/chat-photo?c=${encodeURIComponent(id)}`}
      alt=""
      onError={() => setBad(true)}
      className="size-10 rounded-full object-cover ring-1 ring-border"
    />
  );
}
