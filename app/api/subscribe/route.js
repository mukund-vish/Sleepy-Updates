import { randomBytes } from "node:crypto";
import { requestSubscription, recentConfirmations } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { confirmEmail } from "@/lib/newsletter";

export const dynamic = "force-dynamic";

const EMAIL = /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/;
const DAILY_CONFIRM_CAP = 100; // keeps confirmations from eating the 300/day free quota

export async function POST(req) {
  let body = {};
  try { body = await req.json(); } catch {}
  const email = String(body.email || "").trim().toLowerCase();
  if (body.website) return Response.json({ ok: true }); // honeypot: pretend success
  if (email.length > 254 || !EMAIL.test(email))
    return Response.json({ error: "Please enter a valid email address." }, { status: 400 });

  try {
    if ((await recentConfirmations()) >= DAILY_CONFIRM_CAP)
      return Response.json({ error: "Too many sign-ups right now. Please try again tomorrow." }, { status: 429 });
    const token = await requestSubscription(email, randomBytes(24).toString("hex"));
    if (token) await sendMail({ to: email, ...confirmEmail(token) });
  } catch (e) {
    console.error("subscribe failed:", e.message);
    return Response.json({ error: "Something went wrong. Please try again later." }, { status: 500 });
  }
  // Same answer whether or not the address was already known.
  return Response.json({ ok: true });
}