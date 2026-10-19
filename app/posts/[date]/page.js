import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { marked } from "marked";
import { getPost } from "@/lib/db";
import { parts, longDate } from "@/lib/post";
import { SITE_URL, SITE_NAME, jsonLd } from "@/lib/site";

marked.use({
  renderer: {
    html: () => "", 
    image: ({ href, text }) =>
      `<img src="${href.replace(/"/g, "%22")}" alt="${text}" loading="lazy" referrerpolicy="no-referrer">`,
  },
});
export const revalidate = 3600;

const load = cache(getPost);
const published = (d) => `${d}T15:30:00Z`;
const clip = (t, n) => (t.length <= n ? t : t.slice(0, n - 1).replace(/\s+\S*$/, "") + "…");

export async function generateMetadata({ params }) {
  const { date } = await params;
  let post = null;
  try { post = await load(date); } catch {}
  if (!post) return { title: "Post not found", robots: { index: false } };
  const { dek, image } = parts(post.body);
  const description = clip(dek || `${SITE_NAME} digest for ${longDate(date)}`, 160);
  const images = image ? [{ url: image }] : [{ url: "/og.png", width: 1200, height: 630 }];
  return {
    title: post.title,
    description,
    alternates: { canonical: `/posts/${date}` },
    openGraph: {
      type: "article",
      siteName: SITE_NAME,
      title: post.title,
      description,
      url: `/posts/${date}`,
      publishedTime: published(date),
      images,
    },
    twitter: { card: "summary_large_image", title: post.title, description, images: images.map((i) => i.url) },
  };
}

export default async function Post({ params }) {
  const { date } = await params;
  const post = await load(date);
  if (!post) notFound();
  const { dek, stories: headlines, image } = parts(post.body);
  const i = post.body.indexOf("### ");
  const stories = i >= 0 ? post.body.slice(i) : post.body;
  let n = 0;
  const html = marked.parse(stories).replace(/<h3>/g, () => `<h3 id="s${++n}">`);

  const ld = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: post.title.slice(0, 110),
    description: clip(dek, 200),
    datePublished: published(date),
    dateModified: published(date),
    inLanguage: "en",
    isAccessibleForFree: true,
    mainEntityOfPage: `${SITE_URL}/posts/${date}`,
    image: [image || `${SITE_URL}/og.png`],
    author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
  };

  return (
    <article className="article enter">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} />
      <div className="progress" aria-hidden="true" />
      <Link href="/" className="back">All digests</Link>
      <p className="meta">{longDate(post.date)}</p>
      <h1>{post.title}</h1>
      <p className="dek">{dek}</p>
      <div className="article-layout">
        <div className="body" dangerouslySetInnerHTML={{ __html: html }} />
        {headlines.length > 0 && (
          <aside className="rail">
            <h2>In this digest</h2>
            <ol>
              {headlines.map((h, k) => (
                <li key={k}><a href={`#s${k + 1}`}>{h}</a></li>
              ))}
            </ol>
            <Link href="/" className="more">All digests</Link>
          </aside>
        )}
      </div>
    </article>
  );
}