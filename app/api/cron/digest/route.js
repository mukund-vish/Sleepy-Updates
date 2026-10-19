import { collect, summarize, todayIST, prettyDate } from "@/lib/digest";
import { revalidatePath } from "next/cache";
import { getPost, savePost } from "@/lib/db";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`)
    return new Response("Unauthorized", { status: 401 });

  const date = todayIST();
  const force = new URL(req.url).searchParams.get("force") === "1";
  if (!force && (await getPost(date))) return Response.json({ skipped: "already posted" });

  const items = await collect();
  if (items.length < 3) return Response.json({ error: "too few items" }, { status: 500 });

  const { title, body } = await summarize(items, prettyDate(date));
  if (body.trim().length < 200) return Response.json({ error: "summary too short" }, { status: 500 });

  await savePost(date, title, body.trim());
  revalidatePath("/");
  revalidatePath(`/posts/${date}`);
  return Response.json({ ok: true, date, title, items: items.length });
}