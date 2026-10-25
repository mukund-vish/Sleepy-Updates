import Link from "next/link";
import SubscribeForm from "@/components/SubscribeForm";

export const metadata = { title: "Newsletter", robots: { index: false } };
export const dynamic = "force-dynamic";

const MSG = {
  confirmed: ["You're in.", "Thanks for confirming. Your first digest arrives tonight."],
  unsubscribed: ["You're unsubscribed.", "You won't get any more emails from us."],
  invalid: ["That link didn't work.", "It may have expired or already been used."],
};

export default async function Newsletter({ searchParams }) {
  const sp = await searchParams;
  const unsub = typeof sp.unsubscribe === "string" && /^[a-f0-9]{48}$/.test(sp.unsubscribe) ? sp.unsubscribe : null;
  const m = MSG[sp.s];

  return (
    <div className="enter" style={{ maxWidth: "36rem", margin: "0 auto" }}>
      <p className="meta">Newsletter</p>
      {unsub ? (
        <>
          <h1>Unsubscribe?</h1>
          <p className="dek">Stop receiving the nightly digest by email.</p>
          <form method="post" action={`/api/unsubscribe?t=${unsub}`} style={{ marginTop: "1.5rem" }}>
            <input type="hidden" name="ui" value="1" />
            <button className="btn">Yes, unsubscribe me</button>
          </form>
        </>
      ) : m ? (
        <>
          <h1>{m[0]}</h1>
          <p className="dek">{m[1]}</p>
          <p style={{ marginTop: "1.5rem" }}><Link href="/" className="more">Back to the latest digest</Link></p>
        </>
      ) : (
        <SubscribeForm />
      )}
    </div>
  );
}