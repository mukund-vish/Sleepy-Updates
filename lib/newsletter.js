import { SITE_URL, SITE_NAME } from "@/lib/site";
import { parts, longDate } from "@/lib/post";

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const unsubscribeUrl = (token) => `${SITE_URL}/newsletter?unsubscribe=${token}`;
export const oneClickUrl = (token) => `${SITE_URL}/api/unsubscribe?t=${token}`;

const BMC_URL = "https://www.buymeacoffee.com/mukundvish";

const wrap = (inner) => `<!doctype html><html><body style="margin:0;background:#f4f1e8;padding:24px 12px">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;padding:28px;font:16px/1.65 Georgia,serif;color:#222">
${inner}</div></body></html>`;

// First ~2 sentences of a summary, cut cleanly at a sentence end.
function teaser(t, max = 230) {
  t = t.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "));
  return end > max * 0.4 ? cut.slice(0, end + 1) : cut.replace(/\s+\S*$/, "") + "…";
}

// Pull headline + summary out of each "### headline" block of the stored markdown.
function storiesOf(body) {
  return body
    .split(/^### /m)
    .slice(1)
    .map((block) => {
      const [head, ...rest] = block.split("\n");
      const paras = rest
        .join("\n")
        .split(/\n{2,}/)
        .map((x) => x.trim())
        .filter((x) => x && !x.startsWith("![") && !/^\[[^\]]+\]\(/.test(x));
      return { headline: head.trim(), summary: paras[0] || "" };
    })
    .filter((s) => s.headline);
}

export function digestEmail(post, token) {
  const { dek } = parts(post.body);
  const url = `${SITE_URL}/posts/${post.date}`;
  const stories = storiesOf(post.body);

  const items = stories
    .map(
      (s, k) => `<div style="margin:0 0 22px">
<a href="${url}#s${k + 1}" style="font:700 18px/1.35 Arial,sans-serif;color:#111;text-decoration:none">${esc(s.headline)}</a>
<p style="margin:6px 0 0;color:#444">${esc(teaser(s.summary))}</p></div>`
    )
    .join("");

  const button = `<p style="margin:26px 0 0"><a href="${url}" style="display:inline-block;background:#f0c46e;color:#111;font:700 15px Arial,sans-serif;padding:12px 24px;border-radius:999px;text-decoration:none">Read the full digest</a></p>`;

  const html = wrap(`
<p style="font:600 13px Arial,sans-serif;color:#b8860b;margin:0 0 6px">${esc(longDate(post.date))}</p>
<h1 style="font:800 26px/1.2 Arial,sans-serif;margin:0 0 12px;color:#111">${esc(post.title)}</h1>
<p style="color:#555;margin:0 0 26px">${esc(dek)}</p>
${items}
${button}
<div style="margin:30px 0 0;padding:18px;background:#faf6e6;border-radius:12px;text-align:center">
<p style="font:14px/1.5 Arial,sans-serif;color:#555;margin:0 0 12px">Enjoying Sleepy Updates? It's free and always will be. If it made your evening better, you can support it.</p>
<a href="${BMC_URL}" style="display:inline-block;background:#FFDD00;color:#000;border:2px solid #000;font:700 15px Arial,sans-serif;padding:10px 20px;border-radius:8px;text-decoration:none">&#9749; Buy me a coffee</a>
</div>
<hr style="border:none;border-top:1px solid #e5e0d0;margin:28px 0 14px">
<p style="font:12px/1.5 Arial,sans-serif;color:#888;margin:0">You get this because you subscribed to ${SITE_NAME}.
Summaries are written by AI from the linked sources. <a href="${unsubscribeUrl(token)}" style="color:#888">Unsubscribe</a></p>`);

  const text =
    `${post.title}\n${longDate(post.date)}\n\n${dek}\n\n` +
    stories.map((s, k) => `${k + 1}. ${s.headline}\n${teaser(s.summary)}`).join("\n\n") +
    `\n\nRead the full digest: ${url}\nBuy me a coffee: ${BMC_URL}\nUnsubscribe: ${unsubscribeUrl(token)}\n`;
  return { subject: post.title, html, text };
}

export function confirmEmail(token) {
  const link = `${SITE_URL}/api/confirm?t=${token}`;
  return {
    subject: `Confirm your ${SITE_NAME} subscription`,
    html: wrap(`<h1 style="font:800 22px Arial,sans-serif;margin:0 0 12px">One last step</h1>
<p>Confirm your email to get the ${SITE_NAME} digest every night.</p>
<p><a href="${link}" style="display:inline-block;background:#f0c46e;color:#111;font:700 15px Arial,sans-serif;padding:12px 22px;border-radius:999px;text-decoration:none">Confirm subscription</a></p>
<p style="font:12px Arial,sans-serif;color:#888">If you did not ask for this, ignore this email and nothing will happen.</p>`),
    text: `Confirm your ${SITE_NAME} subscription: ${link}\n\nIf you did not ask for this, ignore this email.\n`,
  };
}