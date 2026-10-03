"use client";

import { useState } from "react";

const KINDS = [
  { kind: "cancel", label: "Cancel it" },
  { kind: "lower_rate", label: "Ask for a lower rate" },
  { kind: "clarify_charge", label: "Question a charge" },
] as const;

type State =
  | { name: "idle" }
  | { name: "choosing" }
  | { name: "loading" }
  | { name: "ready"; subject: string; body: string }
  | { name: "error"; message: string };

export function DraftPanel({ itemId }: { itemId: string }) {
  const [state, setState] = useState<State>({ name: "idle" });
  const [copied, setCopied] = useState(false);

  async function generate(kind: (typeof KINDS)[number]["kind"]) {
    setState({ name: "loading" });
    const res = await fetch("/api/draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, kind }),
    });
    const data = await res.json().catch(() => ({}));
    setState(res.ok ? { name: "ready", subject: data.subject, body: data.body } : { name: "error", message: data.error ?? "Something went wrong." });
  }

  async function copy(subject: string, body: string) {
    await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (state.name === "idle") {
    return (
      <button
        onClick={() => setState({ name: "choosing" })}
        className="w-full rounded-xl border border-accent bg-white px-5 py-3 font-medium text-accent hover:bg-accent-soft"
      >
        Draft a message
      </button>
    );
  }

  return (
    <section className="rounded-2xl border border-line bg-white p-4">
      <h2 className="font-semibold">Draft a message</h2>
      <p className="mt-1 text-sm text-muted">We write it, you edit and send it yourself. Nothing is sent for you.</p>

      {(state.name === "choosing" || state.name === "error") && (
        <div className="mt-4 grid gap-2">
          {KINDS.map((k) => (
            <button key={k.kind} onClick={() => generate(k.kind)} className="rounded-xl border border-line px-4 py-3 text-left font-medium hover:border-accent">
              {k.label}
            </button>
          ))}
          {state.name === "error" && <p className="text-sm text-urgent-high">{state.message}</p>}
        </div>
      )}

      {state.name === "loading" && (
        <p className="mt-4 text-sm text-muted" role="status">Writing your draft…</p>
      )}

      {state.name === "ready" && (
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="text-sm font-medium">Subject</span>
            <input
              value={state.subject}
              onChange={(e) => setState({ ...state, subject: e.target.value })}
              className="mt-1 w-full rounded-xl border border-line px-4 py-3 text-base"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Message</span>
            <textarea
              value={state.body}
              onChange={(e) => setState({ ...state, body: e.target.value })}
              rows={12}
              className="mt-1 w-full rounded-xl border border-line px-4 py-3 text-base leading-relaxed"
            />
          </label>
          <div className="flex gap-2">
            <button onClick={() => setState({ name: "choosing" })} className="rounded-xl border border-line px-4 py-3 font-medium">
              Start over
            </button>
            <button onClick={() => copy(state.subject, state.body)} className="flex-1 rounded-xl bg-accent px-4 py-3 font-medium text-white hover:bg-accent-hover">
              {copied ? "Copied" : "Copy to clipboard"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
