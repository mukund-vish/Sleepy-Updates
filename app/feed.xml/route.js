import { listPosts } from "@/lib/db";

export const dynamic = "force-dynamic";
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function GET(req) {
  const base = new URL(req.url).origin;
  const posts = (await listPosts()).slice(0, 20);
  const items = posts.map((p) => `<item><title>${esc(p.title)}</title>
<link>${base}/posts/${p.date}</link><guid>${base}/posts/${p.date}</guid>
<pubDate>${new Date(p.date + "T15:30:00Z").toUTCString()}</pubDate>
<description>${esc(p.body)}</description></item>`).join("\n");
  const xml = `<?xml version="1.0"?><rss version="2.0"><channel><title>Sleepy Updates</title>
<link>${base}</link><description>Nightly tech news digest</description>${items}</channel></rss>`;
  return new Response(xml, { headers: { "content-type": "application/rss+xml; charset=utf-8" } });
}
