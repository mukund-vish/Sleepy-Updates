import Link from "next/link";
import { listPosts } from "@/lib/db";
import { prettyDate } from "@/lib/digest";
import { parts, longDate } from "@/lib/post";

export const metadata = { alternates: { canonical: "/" } };
export const revalidate = 300; 

const Img = ({ src }) =>
  src ? <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" /> : null;

export default async function Home() {
  let posts = [];
  try { posts = await listPosts(); } catch {}
  if (!posts.length)
    return <p className="empty">The first digest arrives tonight around 9 PM IST.</p>;

  const [lead, ...older] = posts;
  const L = parts(lead.body);
  const href = `/posts/${lead.date}`;
  return (
    <>
      <section className="top">
        <Link href={href} className={`hero${L.image ? "" : " plain"}`}>
          <Img src={L.image} />
          <div className="hero-text">
            <p className="meta">{longDate(lead.date)}</p>
            <h1>{lead.title}</h1>
            <p className="dek">{L.dek}</p>
          </div>
        </Link>
        <aside className="panel">
          <h2>In tonight’s digest</h2>
          <ul>
            {L.stories.slice(0, 6).map((s) => (
              <li key={s}><Link href={href}><span>{s}</span></Link></li>
            ))}
          </ul>
          <Link href={href} className="more">Read the full digest</Link>
        </aside>
      </section>

      {older.length > 0 && (
        <section>
          <h2 className="section">Earlier digests</h2>
          <div className="grid">
            {older.map((p) => {
              const x = parts(p.body);
              return (
                <Link key={p.date} href={`/posts/${p.date}`} className="card">
                  {x.image && <div className="thumb"><Img src={x.image} /></div>}
                  <p className="meta">{prettyDate(p.date)}</p>
                  <h3>{p.title}</h3>
                  <p className="dek">{x.dek}</p>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}