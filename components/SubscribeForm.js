"use client";
import { useState } from "react";

export default function SubscribeForm({ compact = false }) {
  const [state, setState] = useState({ status: "idle", msg: "" });

  async function submit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    setState({ status: "busy", msg: "" });
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: form.email.value, website: form.website.value }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) return setState({ status: "error", msg: j.error || "Something went wrong." });
      form.reset();
      setState({ status: "done", msg: "Almost there. Check your inbox and confirm your email." });
    } catch {
      setState({ status: "error", msg: "Network error. Please try again." });
    }
  }

  return (
    <section className={`sub${compact ? " compact" : ""}`}>
      <h2>Get the digest in your inbox</h2>
      <p>One calm email each night. Free, no spam, unsubscribe anytime.</p>
      <form onSubmit={submit}>
        <input type="email" name="email" placeholder="you@example.com" required maxLength={254}
          autoComplete="email" aria-label="Email address" />
        <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true"
          style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }} />
        <button disabled={state.status === "busy"}>{state.status === "busy" ? "Sending…" : "Subscribe"}</button>
      </form>
      {state.msg && <p className={`sub-msg ${state.status}`} role="status">{state.msg}</p>}
    </section>
  );
}