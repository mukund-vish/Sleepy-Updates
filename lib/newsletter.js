import { Marked } from "marked";
import { SITE_URL, SITE_NAME } from "@/lib/site";
import { parts, longDate } from "@/lib/post";

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const isWeb = (u) => /^https?:\/\//i.test(u || "");

// Separate Marked instance so the site's global config is untouched.
const md = new Marked({
  renderer: {
    html: () => "",
    image({ href, text }) {
      return isWeb(href)
        ? `<img src="${esc(href)}" alt="${esc(text)}" width="560" style="display:block;width:100%;max-width:560px;height:auto;border-radius:8px;margin:0 0 14px">`
        : esc(text);
    },
    link({ href, tokens }) {
      const label = this.parser.parseInline(tokens);
      return isWeb(href) ? `<a href="${esc(href)}" style="color:#b8860b">${label}</a>` : label;
    },
  },
});

export const unsubscribeUrl = (token) => `${SITE_URL}/newsletter?unsubscribe=${token}`;
export const oneClickUrl = (token) => `${SITE_URL}/api/unsubscribe?t=${token}`;

const wrap = (inner) => `<!doctype html><html><body style="margin:0;background:#f4f1e8;padding:24px 12px">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;padding:28px;font:16px/1.65 Georgia,serif;color:#222">
${inner}</div></body></html>`;

export function digestEmail(post, token) {
  const { dek } = parts(post.body);
  const i = post.body.indexOf("### ");
  const stories = (i >= 0 ? post.body.slice(i) : post.body)
    .replace(/^### (.*)$/gm, "### $1");
  const body = md
    .parse(stories)
    .replace(/<h3>/g, '<h3 style="font:700 20px/1.3 Arial,sans-serif;margin:30px 0 10px;color:#111">')
    .replace(/<p>/g, '<p style="margin:0 0 14px">');
  const url = `${SITE_URL}/posts/${post.date}`;
  const html = wrap(`
<p style="font:600 13px Arial,sans-serif;color:#b8860b;margin:0 0 6px">${esc(longDate(post.date))}</p>
<h1 style="font:800 26px/1.2 Arial,sans-serif;margin:0 0 12px;color:#111">${esc(post.title)}</h1>
<p style="color:#555;margin:0 0 8px">${esc(dek)}</p>
${body}
<p style="margin:28px 0 0"><a href="${url}" style="color:#b8860b">Read on the website</a></p>
<hr style="border:none;border-top:1px solid #e5e0d0;margin:24px 0 14px">
<p style="font:12px/1.5 Arial,sans-serif;color:#888;margin:0">You get this because you subscribed to ${SITE_NAME}.
Summaries are written by AI from the linked sources. <a href="${unsubscribeUrl(token)}" style="color:#888">Unsubscribe</a></p>`);
  const text = `${post.title}\n${longDate(post.date)}\n\n${post.body.replace(/!\[[^\]]*\]\([^)]*\)\s*/g, "")}\n\nRead online: ${url}\nUnsubscribe: ${unsubscribeUrl(token)}\n`;
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