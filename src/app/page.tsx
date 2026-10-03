import Link from "next/link";
import { redirect } from "next/navigation";
import { FREE_DOCUMENTS_PER_MONTH, PRO_PRICE_LABEL } from "@/lib/plans";
import { getUser } from "@/lib/supabase/server";

export default async function Home() {
  const { user } = await getUser();
  if (user) redirect("/dashboard");

  return (
    <div className="py-8 sm:py-16">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Your household paperwork, handled.
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-muted">
        Snap a photo of a bill, renewal or official letter. We pull out who it&apos;s from, what you
        owe and when it&apos;s due, and keep it all in one calm list.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/login?mode=signup"
          className="rounded-xl bg-accent px-5 py-3 text-center font-medium text-white hover:bg-accent-hover"
        >
          Create a free account
        </Link>
        <Link
          href="/login"
          className="rounded-xl border border-line bg-white px-5 py-3 text-center font-medium hover:border-accent"
        >
          Sign in
        </Link>
      </div>

      <section className="mt-14 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-white p-5">
          <p className="font-semibold">Free</p>
          <p className="mt-1 text-2xl font-semibold">$0</p>
          <p className="mt-2 text-sm text-muted">
            {FREE_DOCUMENTS_PER_MONTH} documents read each month, plus everything else.
          </p>
        </div>
        <div className="rounded-2xl border border-accent bg-white p-5">
          <p className="font-semibold text-accent">Pro</p>
          <p className="mt-1 text-2xl font-semibold">{PRO_PRICE_LABEL}</p>
          <p className="mt-2 text-sm text-muted">Unlimited documents. Cancel anytime.</p>
        </div>
      </section>
    </div>
  );
}
