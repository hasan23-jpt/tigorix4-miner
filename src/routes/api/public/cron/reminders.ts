import { createFileRoute } from "@tanstack/react-router";
import { sendFarmReminders } from "@/lib/core.server";

/**
 * Twice-daily farm reminder cron. Accepts the `TELEGRAM_WEBHOOK_SECRET` via
 * `x-cron-secret` / `?secret=`, or Vercel Cron's `Authorization: Bearer CRON_SECRET`.
 */
export const Route = createFileRoute("/api/public/cron/reminders")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const secret = process.env["TELEGRAM_WEBHOOK_SECRET"] ?? "";
        const cronSecret = process.env["CRON_SECRET"] ?? "";
        const url = new URL(request.url);
        const given = request.headers.get("x-cron-secret") ?? url.searchParams.get("secret") ?? "";
        const bearer = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
        const ok = (secret && given === secret) || (cronSecret && bearer === cronSecret);
        if (!ok) return new Response("Unauthorized", { status: 401 });
        let offset = 0;
        let sent = 0;
        const started = Date.now();
        // Walk the user list in chunks while there is time left in this call.
        while (Date.now() - started < 45000) {
          const r = await sendFarmReminders(offset);
          sent += r.sent;
          if (r.next === null) return Response.json({ ok: true, sent, done: true });
          offset = r.next;
        }
        return Response.json({ ok: true, sent, done: false, next: offset });
      },
    },
  },
});
