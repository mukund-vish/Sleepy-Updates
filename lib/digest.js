import Parser from "rss-parser";
import { FEEDS } from "./sources";


const MAX_ITEMS = 150; 

export const todayIST = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }); // YYYY-MM-DD

export const prettyDate = (d) =>
  new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
  });

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
        .map((i) => ({ i, ts: Date.parse(i.isoDate || i.pubDate || "") }))
        .filter((x) => x.ts >= since)
        .slice(0, 15)
        .map(({ i, ts }) => ({
          source: f.name, topic: f.topic, ts, title: (i.title || "").trim(),
          link: safeUrl(i.link), image: safeUrl(imgOf(i)),
          snippet: textOf(i).slice(0, 700),
        }))
        .filter((x) => x.link && x.title); 
    })
  );
  const seen = new Set();
  return results
    .flatMap((r) => (r.status === "fulfilled" ? r.value : []))
    .sort((a, b) => b.ts - a.ts) 
    .filter((x) => !seen.has(x.link) && seen.add(x.link))
    .slice(0, MAX_ITEMS);
}

const API = "https://api.electronhub.ai/v1/chat/completions";

async function ask(system, user, maxTokens, until, parse) {
  const models = (process.env.ELECTRONHUB_MODEL || "mistral-small-3.2-24b-instruct:free")
    .split(",").map((m) => m.trim()).filter(Boolean);
  let lastErr;
  for (const model of models) {
    const left = until - Date.now();
    if (left < 4000) break; 
    try {
      const res = await fetch(API, {
        method: "POST",
        signal: AbortSignal.timeout(Math.max(1, Math.floor(left))), 
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${process.env.ELECTRONHUB_API_KEY}`,
        },
        body: JSON.stringify({
          model, max_tokens: maxTokens, temperature: 0.3,
          messages: [{ role: "system", content: system }, { role: "user", content: user }],
        }),
      });
      if (!res.ok) throw new Error(`${model}: ${res.status} ${await res.text()}`);
      const text = (await res.json()).choices?.[0]?.message?.content;
      if (!text) throw new Error(`${model}: empty response`);
      return parse(text);
    } catch (e) { lastErr = e; console.error("model call failed:", e.message); }
  }
  throw lastErr || new Error("no time left for a model call");
}

const jsonOf = (raw) => JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1));



const EDITOR = `You are the news editor of "Sleepy Updates", a calm nightly tech digest.
You get today's numbered headlines from many sources, each tagged [source | topic].
Choose the 7-9 stories a tech-curious reader must not miss tonight.
Prefer: major launches and company news, big policy or legal moves, serious security incidents,
actively exploited vulnerabilities, large breaches, and important research.
Prefer stories reported by several sources. Keep the mix balanced: at most 3 security stories,
and include at least 1 if something important happened.
Skip: rumors, minor gadget news, deals and discounts, listicles, opinion pieces, podcasts and promos.
If several headlines cover the same story, give one as "item" and the others in "related" (max 2).
Reply with ONLY a JSON object, no markdown fences, in exactly this shape, most important first:
{"stories": [{"item": 12, "related": [30, 51]}]}`;

function parsePicks(raw, items) {
  const j = jsonOf(raw);
  const used = new Set();
  const picks = [];
  for (const s of j.stories || []) {
    const n = Number(s.item);
    if (!Number.isInteger(n) || !items[n - 1] || used.has(n)) continue;
    used.add(n);
    const related = (Array.isArray(s.related) ? s.related : [])
      .map(Number)
      .filter((r) => Number.isInteger(r) && items[r - 1] && r !== n && !used.has(r))
      .slice(0, 2);
    related.forEach((r) => used.add(r));
    picks.push({ main: items[n - 1], related: related.map((r) => items[r - 1]) });
    if (picks.length >= 9) break;
  }
  if (picks.length < 4) throw new Error("editor picked too few stories");
  return picks;
}


function diverse(items, n) {
  const bySource = new Map();
  for (const it of items) {
    if ((it.snippet || "").length < 80) continue;
    if (!bySource.has(it.source)) bySource.set(it.source, []);
    bySource.get(it.source).push(it);
  }
  const out = [];
  for (let round = 0; out.length < n; round++) {
    let any = false;
    for (const list of bySource.values()) {
      if (list[round] && out.length < n) { out.push(list[round]); any = true; }
    }
    if (!any) break;
  }
  return out;
}

async function pick(items, until) {
  const list = items.map((x, i) => `${i + 1}. [${x.source} | ${x.topic}] ${x.title}`).join("\n");
  try {
    return await ask(EDITOR, list, 800, until, (raw) => parsePicks(raw, items));
  } catch (e) {
    console.error("editor stage failed, using a simple mix:", e.message);
    return diverse(items, 8).map((main) => ({ main, related: [] }));
  }
}


const WRITER = `You write "Sleepy Updates", a calm end-of-day tech news digest.
You get numbered stories that the editor already chose. Some list "Also reported by" lines.
Reply with ONLY a JSON object, no markdown fences, in exactly this shape:
{"title": "punchy newspaper headline, max 80 chars, for the biggest story",
 "intro": "one sentence summarizing the day",
 "stories": [{"item": 3, "headline": "short headline", "summary": "a paragraph of 4-6 sentences"}],
 "goodnight": "one short sign-off line"}
Write one entry for every numbered story, most important first. "item" is its number.
Use ONLY the provided text and never add facts.
Each summary must tell the whole story on its own so the reader does not need to click through:
what happened, who is involved, the key numbers, dates or names mentioned, why it matters,
and what happens next if the text says so. Do not stop after the headline fact. Never end a
summary mid-thought. If a story has little detail, say what is known and keep it shorter rather
than padding. Write plain paragraphs: no bullet points, markdown or line breaks inside a summary.`;

function build(raw, picks, dateLabel) {
  const j = jsonOf(raw);
  const seen = new Set();
  const stories = (j.stories || []).filter(
    (s) => picks[s.item - 1] && s.headline && s.summary && !seen.has(s.item) && seen.add(s.item)
  );
  if (stories.length < 3) throw new Error("too few valid stories");
  const blocks = stories.map((s) => {
    const { main, related } = picks[s.item - 1];
    const img = main.image ? `![${main.source}](${main.image})\n\n` : "";
    // main source first, then up to two other sources that covered the same story
    const links = [main, ...related]
      .filter((x, k, a) => a.findIndex((y) => y.source === x.source) === k)
      .map((x) => `[${x.source}](${x.link})`)
      .join(" ");
    return `### ${s.headline}\n\n${img}${s.summary}\n\n${links}`;
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

function fallback(list, dateLabel) {
  const chosen = list.filter((it) => (it.snippet || "").length >= 80).slice(0, 8);
  if (chosen.length < 3) throw new Error("too few items for fallback digest");
  const blocks = chosen.map((it) => {
    const img = it.image ? `![${it.source}](${it.image})\n\n` : "";
    return `### ${it.title}\n\n${img}${trimSentence(it.snippet, 520)}\n\n[${it.source}](${it.link})`;
  });
  return {
    title: `Sleepy Updates – ${dateLabel}`,
    body: [
      "Tonight's AI summary was unavailable, so here are today's top stories straight from the sources.",
      ...blocks,
      "Goodnight.",
    ].join("\n\n"),
  };
}

export async function summarize(items, dateLabel, deadline = Date.now() + 45000) {
  const now = Date.now();
  const picks = await pick(items, now + Math.min(18000, (deadline - now) * 0.4));

  const list = picks
    .map((p, k) => {
      const also = p.related
        .map((r) => `\n   Also reported by ${r.source}: ${r.title}. ${r.snippet.slice(0, 300)}`)
        .join("");
      return `${k + 1}. [${p.main.source}] ${p.main.title}\n${p.main.snippet}${also}`;
    })
    .join("\n\n");
  try {
    return await ask(WRITER, `Date: ${dateLabel}\n\n${list}`, 4000, deadline, (raw) =>
      build(raw, picks, dateLabel)
    );
  } catch (e) {
    console.error("writer stage failed, publishing plain digest:", e.message);
    try { return fallback(picks.map((p) => p.main), dateLabel); }
    catch { return fallback(diverse(items, 8), dateLabel); }
  }
}