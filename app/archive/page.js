import Link from "next/link";
import { listIndex } from "@/lib/db";

export const revalidate = 3600;
export const metadata = {
  title: "Archive",
  description: "Every Sleepy Updates nightly tech digest, newest first.",
  alternates: { canonical: "/archive" },
};

const month = (d) =>
  new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
const day = (d) =>
  new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

export default async function Archive() {
  let rows = [];
  try { rows = await listIndex(); } catch {}

  const groups = [];
  for (const r of rows) {
    const m = month(r.date);
    if (!groups.length || groups[groups.length - 1].m !== m) groups.push({ m, items: [] });
    groups[groups.length - 1].items.push(r);
  }

  return (
    <div className="enter" style={{ maxWidth: "52rem", margin: "0 auto" }}>
      <style>{`.arc a:hover .t{color:var(--lamp)} .arc a:hover .t{text-decoration:underline;text-underline-offset:3px}`}</style>
      <p className="meta">Archive</p>
      <h1>Every digest</h1>
      <p className="dek">{rows.length ? `${rows.length} nights of tech news, newest first.` : "No digests yet. The first one arrives tonight."}</p>

      <div className="arc">
        {groups.map((g) => (
          <section key={g.m}>
            <h2 className="section">{g.m}</h2>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {g.items.map((r) => (
                <li key={r.date} style={{ borderTop: "1px solid var(--line)" }}>
                  <Link
                    href={`/posts/${r.date}`}
                    style={{ display: "flex", gap: "1.25rem", padding: "0.85rem 0", textDecoration: "none", alignItems: "baseline" }}
                  >
                    <span style={{ flex: "0 0 6.5rem", font: "600 0.85rem var(--sans)", color: "var(--lamp)" }}>{day(r.date)}</span>
                    <span className="t" style={{ font: "700 1.05rem/1.4 var(--sans)" }}>{r.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}