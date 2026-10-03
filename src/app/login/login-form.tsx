"use client";

import Link from "next/link";
import { useActionState } from "react";
import { authenticate } from "./actions";

const input = "mt-1 w-full rounded-xl border border-line bg-white px-4 py-3 text-base";

export function LoginForm({ mode }: { mode: "signin" | "signup" }) {
  const [state, action, pending] = useActionState(authenticate, undefined);
  const isSignup = mode === "signup";

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="mode" value={mode} />
      <label className="block">
        <span className="text-sm font-medium">Email</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className={input}
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Password</span>
        <input
          name="password"
          type="password"
          autoComplete={isSignup ? "new-password" : "current-password"}
          minLength={8}
          required
          className={input}
        />
      </label>

      {state?.error && (
        <p role="alert" className="rounded-lg bg-urgent-high-soft px-3 py-2 text-sm text-urgent-high">
          {state.error}
        </p>
      )}
      {state?.message && (
        <p role="status" className="rounded-lg bg-accent-soft px-3 py-2 text-sm text-accent">
          {state.message}
        </p>
      )}

      <button
        disabled={pending}
        className="w-full rounded-xl bg-accent px-5 py-3 font-medium text-white hover:bg-accent-hover disabled:opacity-60"
      >
        {pending ? "One moment…" : isSignup ? "Create account" : "Sign in"}
      </button>

      {isSignup && (
        <p className="text-center text-xs text-muted">
          By creating an account you agree to our{" "}
          <Link href="/legal/terms" className="underline">Terms</Link> and{" "}
          <Link href="/legal/privacy" className="underline">Privacy Policy</Link>.
        </p>
      )}

      <p className="text-center text-sm text-muted">
        {isSignup ? "Already have an account? " : "New here? "}
        <Link
          href={isSignup ? "/login" : "/login?mode=signup"}
          className="font-medium text-accent underline-offset-2 hover:underline"
        >
          {isSignup ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}
