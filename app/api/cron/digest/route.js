import { timingSafeEqual } from "node:crypto";
import { collect, summarize, todayIST, prettyDate } from "@/lib/digest";
import { revalidatePath } from "next/cache";
import { getPost, savePost } from "@/lib/db";

export const maxDuration = 60 
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
  if (!force && (await getPost(date))) return Response.json({ skipped: "already posted" });

  const items = await collect();
  if (items.length < 3) return Response.json({ error: "too few items" }, { status: 500 });

  const { title, body } = await summarize(items, prettyDate(date), started + 52000);
  if (body.trim().length < 200) return Response.json({ error: "summary too short" }, { status: 500 });

  await savePost(date, title, body.trim());
  revalidatePath("/");
  revalidatePath(`/posts/${date}`);
  return Response.json({ ok: true, date, title, items: items.length });
}