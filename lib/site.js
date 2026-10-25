export const SITE_URL = (
  process.env.SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://sleepy-updates.vercel.app")
).replace(/\/$/, "");

export const SITE_NAME = "Sleepy Updates";
export const SITE_TAGLINE = "The day in tech, summarized before bed";
export const SITE_DESC =
  "A calm nightly digest of the biggest stories in tech and cybersecurity, picked from the best sources and summarized in minutes.";

export const jsonLd = (obj) => JSON.stringify(obj).replace(/</g, "\\u003c");