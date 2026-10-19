import Parser from "rss-parser";

const FEEDS = [
  { name: "The Verge", url: "https://www.theverge.com/rss/index.xml" },
  { name: "TechCrunch", url: "https://techcrunch.com/feed/" },
  { name: "Ars Technica", url: "https://feeds.arstechnica.com/arstechnica/index" },
  { name: "Hacker News", url: "https://hnrss.org/frontpage?points=150" },
  { name: "Gadgets 360", url: "https://www.gadgets360.com/rss/news" },
  { name: "Inc42", url: "https://inc42.com/feed/" },
];

export const todayIST = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }); // YYYY-MM-DD

export const prettyDate = (d) =>
  new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
  });

// Only plain web addresses are allowed through (no javascript:, data:, relative paths).
// Brackets and parentheses are encoded so they can't break the markdown link syntax.
function safeUrl(u) {
  try {
    const x = new URL(String(u || "").trim());
    if (x.protocol !== "http:" && x.protocol !== "https:") return null;
    return x.href.replace(/\(/g, "%28").replace(/\)/g, "%29").replace(/\[/g, "%5B").replace(/\]/g, "%5D");
  } catch { return null; }
}

function imgOf(i) {
  if (i.enclosure?.url && (i.enclosure.type || "").startsWith("image")) return i.enclosure.url;
  const m = i.media?.$?.url || i.thumb?.$?.url;
  if (m) return m;
  const html = i["content:encoded"] || i.content || "";
  return (html.match(/<img[^>]+src=["'](https?:[^"']+)["']/i) || [])[1] || null;
}


function textOf(i) {
  const html = i["content:encoded"] || i.content || i.contentSnippet || "";
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;/g, "'")
    .replace(/\s+/g, " ").trim();
}

export async function collect() {
  const parser = new Parser({
    timeout: 8000,
    customFields: { item: [["media:content", "media"], ["media:thumbnail", "thumb"]] },
  });
  const since = Date.now() - 24 * 3600 * 1000;
  const results = await Promise.allSettled(
    FEEDS.map(async (f) => {
      const feed = await parser.parseURL(f.url);
      return feed.items
        .filter((i) => Date.parse(i.isoDate || i.pubDate || "") >= since)
        .slice(0, 10)
        .map((i) => ({
          source: f.name, title: i.title, link: safeUrl(i.link), image: safeUrl(imgOf(i)),
          snippet: textOf(i).slice(0, 700),
        }))
        .filter((x) => x.link && x.title); // drop items without a safe link
    })
  );
  return results.flatMap((r) => (r.status === "fulfilled" ? r.value : [])).slice(0, 45);
}

const SYSTEM = `You write "Sleepy Updates", a calm end-of-day tech news digest.
Reply with ONLY a JSON object, no markdown fences, in exactly this shape:
{"title": "punchy newspaper headline, max 80 chars, for the biggest story",
 "intro": "one sentence summarizing the day",
 "stories": [{"item": 3, "headline": "short headline", "summary": "a paragraph of 4-6 sentences"}],
 "goodnight": "one short sign-off line"}
Pick the 6-8 most important stories. "item" is the number of the main source item for that story.
Merge items about the same story. Use ONLY the provided items and never add facts.
Each summary must tell the whole story on its own so the reader does not need to click through:
what happened, who is involved, the key numbers, dates or names mentioned, why it matters,
and what happens next if the items say so. Do not stop after the headline fact. Never end a
summary mid-thought. If an item has little detail, say what is known and keep it shorter rather
than padding. Write plain paragraphs: no bullet points, markdown or line breaks inside a summary.`;

function build(raw, items, dateLabel) {
  const j = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1));
  const seen = new Set();
  const stories = (j.stories || []).filter(
    (s) => items[s.item - 1] && s.headline && s.summary && !seen.has(s.item) && seen.add(s.item)
  );
  if (stories.length < 3) throw new Error("too few valid stories");
  const blocks = stories.map((s) => {
    const it = items[s.item - 1];
    const img = it.image ? `![${it.source}](${it.image})\n\n` : "";
    return `### ${s.headline}\n\n${img}${s.summary}\n\n[${it.source}](${it.link})`;
  });
  return {
    title: String(j.title || `Sleepy Updates – ${dateLabel}`).slice(0, 120),
    body: [j.intro, ...blocks, j.goodnight].filter(Boolean).join("\n\n"),
  };
}

function trimSentence(t, max) {
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "));
  return end > max * 0.5 ? cut.slice(0, end + 1) : cut.replace(/\s+\S*$/, "") + "…";
}

function fallback(items, dateLabel) {
  const bySource = new Map();
  for (const it of items) {
    if ((it.snippet || "").length < 80) continue;
    if (!bySource.has(it.source)) bySource.set(it.source, []);
    bySource.get(it.source).push(it);
  }
  const picked = [];
  for (let round = 0; picked.length < 7; round++) {
    let any = false;
    for (const list of bySource.values()) {
      if (list[round] && picked.length < 7) { picked.push(list[round]); any = true; }
    }
    if (!any) break;
  }
  if (picked.length < 3) throw new Error("too few items for fallback digest");
  const blocks = picked.map((it) => {
    const img = it.image ? `![${it.source}](${it.image})\n\n` : "";
    return `### ${it.title}\n\n${img}${trimSentence(it.snippet, 520)}\n\n[${it.source}](${it.link})`;
  });
  return {
    title: `Sleepy Updates – ${dateLabel}`,
    body: [
      "Tonight's AI summary was unavailable, so here are today's top tech stories straight from the sources.",
      ...blocks,
      "Goodnight.",
    ].join("\n\n"),
  };
}

export async function summarize(items, dateLabel, deadline = Date.now() + 45000) {
  const list = items
    .map((x, i) => `${i + 1}. [${x.source}] ${x.title}\n${x.snippet}`)
    .join("\n\n");
  const models = (process.env.ELECTRONHUB_MODEL || "mistral-small-3.2-24b-instruct:free")
    .split(",").map((m) => m.trim()).filter(Boolean);
  for (const model of models) {
    const left = deadline - Date.now();
    if (left < 8000) break; 
    try {
      const res = await fetch("https://api.electronhub.ai/v1/chat/completions", {
        method: "POST",
        signal: AbortSignal.timeout(left),
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${process.env.ELECTRONHUB_API_KEY}`,
        },
        body: JSON.stringify({
          model, max_tokens: 4000, temperature: 0.3,
          messages: [
            { role: "system", content: SYSTEM },
            { role: "user", content: `Date: ${dateLabel}\n\n${list}` },
          ],
        }),
      });
      if (!res.ok) throw new Error(`${model}: ${res.status} ${await res.text()}`);
      const text = (await res.json()).choices?.[0]?.message?.content;
      if (!text) throw new Error(`${model}: empty response`);
      return build(text, items, dateLabel); 
    } catch (e) { console.error("summarize failed:", e.message); }
  }
  return fallback(items, dateLabel);
}