import { createFileRoute } from "@tanstack/react-router";
import { notifyFinishedMining } from "@/lib/core.server";

/** Sends "mining complete" bot messages. Same secret rules as the reminders cron. */
export const Route = createFileRoute("/api/public/cron/mining")({
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
        const sent = await notifyFinishedMining();
        return Response.json({ ok: true, sent });
      },
    },
  },
});
