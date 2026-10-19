export const SITE_URL = (
  process.env.SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000")
).replace(/\/$/, "");

export const SITE_NAME = "Sleepy Updates";
export const SITE_TAGLINE = "The day in tech, summarized before bed";
export const SITE_DESC =
  "A calm nightly tech news digest. The biggest stories from The Verge, TechCrunch, Ars Technica, Hacker News and more, summarized in minutes.";

export const jsonLd = (obj) => JSON.stringify(obj).replace(/</g, "\\u003c");