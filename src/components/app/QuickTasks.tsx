import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTasks } from "@/lib/api.functions";
import { useAppState } from "./useApp";
import { TaskRow, type Task } from "./TasksTab";
import { Card, GhostButton, Pill, SectionTitle } from "./ui";

/** Home shortcut: the next 3 unfinished tasks. Finishing one pulls the next one in. */
export function QuickTasks({ onSeeAll }: { onSeeAll: () => void }) {
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
  if (!left.length) return null;
  const shown = left.slice(0, 3);
  return (
    <Card>
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
    </Card>
  );
}
