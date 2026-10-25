import { neon } from "@neondatabase/serverless";


const sql = (s, ...v) => neon(process.env.DATABASE_URL)(s, ...v);

let ready = false;
async function ensure() {
  if (ready) return;
  await sql`CREATE TABLE IF NOT EXISTS posts (
    date text PRIMARY KEY, title text NOT NULL, body text NOT NULL,
    created_at timestamptz DEFAULT now())`;
  await sql`CREATE TABLE IF NOT EXISTS subscribers (
    email text PRIMARY KEY, token text NOT NULL UNIQUE,
    confirmed boolean NOT NULL DEFAULT false,
    confirm_sent_at timestamptz, last_sent text,
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

/* ---------- newsletter ---------- */

// Register an address (or find the existing row). Returns the confirmation
// token only when a confirmation email should be sent now (not confirmed yet,
// and none sent in the last hour). Otherwise null, so callers can answer
// identically and never reveal whether an address is already subscribed.
export async function requestSubscription(email, token) {
  await ensure();
  await sql`INSERT INTO subscribers (email, token) VALUES (${email}, ${token})
    ON CONFLICT (email) DO NOTHING`;
  const r = await sql`UPDATE subscribers SET confirm_sent_at = now()
    WHERE email = ${email} AND NOT confirmed
      AND (confirm_sent_at IS NULL OR confirm_sent_at < now() - interval '1 hour')
    RETURNING token`;
  return r[0]?.token || null;
}

// Confirmation emails sent in the last 24h (guards the free email quota).
export async function recentConfirmations() {
  await ensure();
  const r = await sql`SELECT count(*)::int AS n FROM subscribers
    WHERE confirm_sent_at > now() - interval '1 day'`;
  return r[0].n;
}

export async function confirmSubscriber(token) {
  await ensure();
  const r = await sql`UPDATE subscribers SET confirmed = true WHERE token = ${token} RETURNING email`;
  return r.length > 0;
}

export async function removeSubscriber(token) {
  await ensure();
  const r = await sql`DELETE FROM subscribers WHERE token = ${token} RETURNING email`;
  return r.length > 0;
}

export async function dueSubscribers(date, limit) {
  await ensure();
  return sql`SELECT email, token FROM subscribers
    WHERE confirmed AND last_sent IS DISTINCT FROM ${date}
    ORDER BY created_at LIMIT ${limit}`;
}

export async function markSent(email, date) {
  await sql`UPDATE subscribers SET last_sent = ${date} WHERE email = ${email}`;
}

export async function purgeStale() {
  await ensure();
  await sql`DELETE FROM subscribers WHERE NOT confirmed AND created_at < now() - interval '7 days'`;
}