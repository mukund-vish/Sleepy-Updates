import { timingSafeEqual } from "node:crypto";
import { collect, summarize, todayIST } from "@/lib/digest";
import { revalidatePath } from "next/cache";
import { getPost, savePost } from "@/lib/db";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

function authorized(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(req.headers.get("authorization") || "");
  const want = Buffer.from(`Bearer ${secret}`);
  return given.length === want.length && timingSafeEqual(given, want);
}

export async function GET(req) {
  const started = Date.now();
  if (!authorized(req)) return new Response("Unauthorized", { status: 401 });

  const date = todayIST();
  const force = new URL(req.url).searchParams.get("force") === "1";

  try {
    if (!force && (await getPost(date))) {
      return Response.json({ skipped: "already posted", date });
    }

    const items = await collect();
    if (items.length < 3) {
      console.error("Digest cron: too few feed items", { date, count: items.length });
      return Response.json({ error: "too few items", date, count: items.length }, { status: 503 });
    }

    const { title, body } = await summarize(items, new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", {
      day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
    }), started + 52000);

    if (typeof title !== "string" || typeof body !== "string" || body.trim().length < 200) {
      console.error("Digest cron: generated digest failed validation", { date });
      return Response.json({ error: "summary validation failed", date }, { status: 502 });
    }

    await savePost(date, title.slice(0, 120), body.trim());
    revalidatePath("/");
    revalidatePath("/archive");
    revalidatePath("/sitemap.xml");
    revalidatePath(`/posts/${date}`);

    return Response.json({ ok: true, date, title: title.slice(0, 120), items: items.length });
  } catch (error) {
    // Keep details in server logs; don't expose upstream or database errors to callers.
    console.error("Digest cron failed", {
      date,
      elapsedMs: Date.now() - started,
      error: error instanceof Error ? error.message : String(error),
    });
    return Response.json({ error: "digest generation failed", date }, { status: 500 });
  }
}
