import { listAllDates } from "@/lib/db";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap() {
  let rows = [];
  try { rows = await listAllDates(); } catch {}
  return [
    {
      url: SITE_URL,
      lastModified: rows[0] ? new Date(rows[0].date + "T15:30:00Z") : undefined,
      changeFrequency: "daily",
      priority: 1,
    },
    { url: `${SITE_URL}/archive`, changeFrequency: "daily", priority: 0.6 },
    { url: `${SITE_URL}/about`, changeFrequency: "yearly", priority: 0.4 },
    ...rows.map((r) => ({
      url: `${SITE_URL}/posts/${r.date}`,
      lastModified: new Date(r.date + "T15:30:00Z"),
      changeFrequency: "never",
      priority: 0.7,
    })),
  ];
}