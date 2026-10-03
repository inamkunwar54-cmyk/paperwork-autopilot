import Link from "next/link";
import { signOut } from "@/app/actions";
import { getPlan } from "@/lib/plans";
import { requireUser } from "@/lib/supabase/server";
import { DeleteAll } from "./delete-all";
import { PlanSection } from "./plan-section";

export default async function SettingsPage({ searchParams }: PageProps<"/settings">) {
  const { supabase, user } = await requireUser();
  const plan = await getPlan(supabase, user.id);
  const { upgraded } = await searchParams;

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-2 text-muted">Signed in as {user.email}</p>
        <form action={signOut} className="mt-4">
          <button className="rounded-xl border border-line bg-white px-5 py-3 font-medium hover:border-accent">Sign out</button>
        </form>
      </section>

      <PlanSection plan={plan} justUpgraded={upgraded === "1"} />

      <section>
        <h2 className="text-lg font-semibold">Your data</h2>
        <p className="mt-1 text-muted">
          Deleting your data doesn&apos;t cancel a Pro subscription; use Manage billing for that. Read <Link href="/privacy" className="text-accent underline-offset-2 hover:underline">how your documents are processed</Link>.
        </p>
        <div className="mt-4">
          <DeleteAll />
        </div>
      </section>
    </div>
  );
}
