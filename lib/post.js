export function parts(body) {
  const [intro, ...rest] = body.split(/^### /m);
  return {
    dek: intro.replace(/!\[[^\]]*\]\([^)]*\)/g, "").trim(),
    stories: rest.map((s) => s.split("\n")[0].trim()).slice(0, 8),
    image: (body.match(/!\[[^\]]*\]\((https?:[^)\s]+)\)/) || [])[1] || null,
  };
}

export const longDate = (d) =>
  new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  });