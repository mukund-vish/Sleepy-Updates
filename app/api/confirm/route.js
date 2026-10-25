import { confirmSubscriber } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const url = new URL(req.url);
  const t = url.searchParams.get("t") || "";
  let ok = false;
  try { ok = /^[a-f0-9]{48}$/.test(t) && (await confirmSubscriber(t)); } catch {}
  return Response.redirect(new URL(`/newsletter?s=${ok ? "confirmed" : "invalid"}`, url), 303);
}