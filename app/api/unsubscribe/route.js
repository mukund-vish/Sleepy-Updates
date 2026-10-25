import { removeSubscriber } from "@/lib/db";

export const dynamic = "force-dynamic";

// POST only: mail clients' one-click unsubscribe (RFC 8058) and our own form.
// There is no GET handler so link scanners can't unsubscribe people by accident.
export async function POST(req) {
  const url = new URL(req.url);
  const t = url.searchParams.get("t") || "";
  let ok = false;
  try { ok = /^[a-f0-9]{48}$/.test(t) && (await removeSubscriber(t)); } catch {}
  const form = await req.formData().catch(() => null);
  if (form?.get("ui")) // came from the website form
    return Response.redirect(new URL(`/newsletter?s=${ok ? "unsubscribed" : "invalid"}`, url), 303);
  return new Response(ok ? "unsubscribed" : "invalid", { status: ok ? 200 : 400 });
}