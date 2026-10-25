// Brevo transactional email (free plan: 300 emails/day). HTTP API, no SMTP.
// Sender must be a verified sender in your Brevo account (no domain needed).
export async function sendMail({ to, subject, html, text, headers }) {
  const key = process.env.BREVO_API_KEY;
  const from = process.env.MAIL_FROM;
  if (!key || !from) throw new Error("BREVO_API_KEY and MAIL_FROM must be set");
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    signal: AbortSignal.timeout(10000),
    headers: { "api-key": key, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: { name: process.env.MAIL_FROM_NAME || "Sleepy Updates", email: from },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text,
      ...(headers ? { headers } : {}),
    }),
  });
  if (!res.ok) throw new Error(`brevo ${res.status}: ${(await res.text()).slice(0, 200)}`);
}