import { cronAuthorized } from "@/lib/cronauth";
import { todayIST } from "@/lib/digest";
import { getPost, dueSubscribers, markSent, purgeStale } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { digestEmail, oneClickUrl, unsubscribeUrl } from "@/lib/newsletter";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const PER_RUN = 250; 
const PARALLEL = 5;

export async function GET(req) {
  if (!cronAuthorized(req)) return new Response("Unauthorized", { status: 401 });
  const started = Date.now();
  const date = todayIST();

  const post = await getPost(date);
  if (!post) return Response.json({ skipped: "no digest yet" });

  const force = new URL(req.url).searchParams.get("force") === "1";
  const queue = await dueSubscribers(force ? "force" : date, PER_RUN);
  let sent = 0, failed = 0;

  async function worker() {
    while (queue.length && Date.now() - started < 50000) {
      const s = queue.shift();
      try {
        const mail = digestEmail(post, s.token);
        await sendMail({
          to: s.email,
          ...mail,
          headers: {
            "List-Unsubscribe": `<${oneClickUrl(s.token)}>, <${unsubscribeUrl(s.token)}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        });
        await markSent(s.email, date);
        sent++;
      } catch (e) {
        failed++;
        console.error("send failed:", e.message);
      }
    }
  }
  await Promise.all(Array.from({ length: PARALLEL }, worker));
  try { await purgeStale(); } catch {}
  return Response.json({ ok: true, date, sent, failed, remaining: queue.length });
}