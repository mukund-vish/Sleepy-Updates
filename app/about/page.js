import Link from "next/link";
import { SITE_NAME } from "@/lib/site";
import { FEEDS } from "@/lib/sources";

export const metadata = {
  title: "About",
  description:
    "Sleepy Updates is a calm nightly tech news digest: the day's biggest stories, summarized by AI from trusted sources, in a few minutes of reading.",
  alternates: { canonical: "/about" },
};

const TECH = FEEDS.filter((f) => f.topic === "tech");
const SECURITY = FEEDS.filter((f) => f.topic === "security");

const A = (props) => (
  <a {...props} style={{ color: "var(--lamp)", textUnderlineOffset: "3px" }} />
);

export default function About() {
  return (
    <article className="enter" style={{ maxWidth: "44rem", margin: "0 auto" }}>
      <p className="meta">About</p>
      <h1>The day in tech, before bed.</h1>
      <p className="dek">
        {SITE_NAME} is a short, calm digest of the biggest technology stories of the day. One
        read, once a night, and you are caught up.
      </p>

      <h2 className="section">What you get</h2>
      <p>
        Every night around 9 PM IST, a new digest is published here. It covers the seven to nine
        stories that mattered most that day, from general tech to security, each summarized in a short paragraph with a link to
        the original article. No endless scrolling, no notifications, no noise.
      </p>

      <h2 className="section">How it is made</h2>
      <p>
        Each evening the site collects the last day's headlines from public news feeds. An AI
        "editor" reads every headline, picks the stories that matter most and groups reports of the
        same story together. A second step then writes a short summary for each one. The links and
        images are added by the site itself, straight from the original sources, so the model never
        invents a link.
      </p>

      <h2 className="section">Where the news comes from</h2>
      {[["Technology", TECH], ["Security", SECURITY]].map(([label, list]) => (
        <div key={label}>
          <p style={{ margin: "1rem 0 0.25rem", font: "700 0.85rem var(--sans)", color: "var(--dim)" }}>{label}</p>
          <ul style={{ marginTop: 0 }}>
            {list.map((f) => (
              <li key={f.name}>
                <A href={f.site} target="_blank" rel="noopener noreferrer">{f.name}</A>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <h2 className="section">Please keep in mind</h2>
      <p>
        Summaries are written by AI and can contain mistakes or miss context. They are meant to
        help you decide what to read, not to replace the original reporting. Always open the linked
        source for the full story. Images and articles belong to their original publishers, and
        every story links back to where it came from.
      </p>

      <h2 className="section">Follow along</h2>
      <p>
        Read the <Link href="/" style={{ color: "var(--lamp)", textUnderlineOffset: "3px" }}>latest digest</Link>{" "}
        or subscribe to the <A href="/feed.xml">RSS feed</A> in your favourite reader.
      </p>
    </article>
  );
}