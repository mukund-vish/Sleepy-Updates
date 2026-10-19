import { neon } from "@neondatabase/serverless";


const sql = (s, ...v) => neon(process.env.DATABASE_URL)(s, ...v);

let ready = false;
async function ensure() {
  if (ready) return;
  await sql`CREATE TABLE IF NOT EXISTS posts (
    date text PRIMARY KEY, title text NOT NULL, body text NOT NULL,
    created_at timestamptz DEFAULT now())`;
  ready = true;
}
export async function listPosts() {
  await ensure();
  return sql`SELECT date, title, body FROM posts ORDER BY date DESC LIMIT 30`;
}
export async function getPost(date) {
  await ensure();
  const r = await sql`SELECT date, title, body FROM posts WHERE date = ${date}`;
  return r[0] || null;
}
export async function savePost(date, title, body) {
  await ensure();
  await sql`INSERT INTO posts (date, title, body) VALUES (${date}, ${title}, ${body})
    ON CONFLICT (date) DO UPDATE SET title = EXCLUDED.title, body = EXCLUDED.body`;
}

export async function listAllDates() {
  await ensure();
  return sql`SELECT date FROM posts ORDER BY date DESC LIMIT 5000`;
}


export async function listIndex() {
  await ensure();
  return sql`SELECT date, title FROM posts ORDER BY date DESC LIMIT 5000`;
}